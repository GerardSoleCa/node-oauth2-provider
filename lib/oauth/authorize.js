var debug = require('../utils/debug');
var querystring = require('querystring');
var serializer = require('serializer');

module.exports = function (options, req, res) {
    var client_id = req.query.client_id || req.body.client_id,
        redirect_uri = (req.query.redirect_uri || req.body.redirect_uri);

    if (req.method == 'GET') {
        if (!client_id || !redirect_uri) {
            return res.json({error: "invalid_request"});
        }

        // Check the client validity. In this case, we do not require a client_secret (client authentication not required), just send an undefined and wait the callback
        options.storage.getClient(client_id, undefined, function (client) {
            debug.log('ClientId: %s and RedirectUri: %s', client_id, redirect_uri);
            debug.log('Object from storage: %s', JSON.stringify(client));
            if (!client) {
                res.statusCode = 400;
                return res.json({error: "invalid_client"});
            } else if (client.redirect_uri != redirect_uri) {
                res.statusCode = 400;
                return res.json({error: "invalid_client"});
            }

            // authorization form will be POSTed to same URL, so we'll have all params
            var authorize_url = req.url;

            options.storage.getUserOrLoadLogin(req, res, authorize_url, function (userId) {
                if (userId) {
                    authorize_url += '&' + querystring.stringify({x_user_id: options.serializer.stringify(userId)});
                    options.storage.loadAuthorizeForm(req, res, client_id, authorize_url)
                }
            });
        });
    } else if (req.method == 'POST') {
        var response_type = req.query.response_type;
        var state = (req.query.state || req.body.state);
        var x_user_id = (req.query.x_user_id || req.body.x_user_id);
        var user_id = options.serializer.parse(x_user_id);

        var url = redirect_uri;

        switch (response_type) {
            case 'code':
                url += '?';
                break;
            case 'token':
                url += '#';
                break;
            default:
                res.writeHead(400);
                return res.json({error: "unsupported_response_type"});
        }

        if ('allow' in req.body) {
            if ('token' == response_type) {
                //var user_id;
                //
                //try {
                //    user_id = options.serializer.parse(x_user_id);
                //} catch (e) {
                //    console.error('allow/token error', e.stack);
                //
                //    res.writeHead(500);
                //    return res.end(e.message);
                //}
                //
                //options.emit('create_access_token', user_id, client_id, function (extra_data, token_options) {
                //    var atok = options.generateAccessToken(user_id, client_id, extra_data, token_options);
                //
                //    if (options.listeners('save_access_token').length > 0)
                //        options.emit('save_access_token', user_id, client_id, atok);
                //
                //    url += querystring.stringify(atok);
                //
                //    res.writeHead(303, {Location: url});
                //    res.end();
                //});
            } else if (response_type == 'code') {
                var code = serializer.randomString(128);
                var expires = new Date();
                expires.setMinutes(expires.getMinutes() + 10);
                options.storage.saveCode(code, client_id, user_id, expires.toISOString());
                var extras = {
                    code: code
                };

                // pass back anti-CSRF opaque value
                if (state)
                    extras['state'] = state;

                url += querystring.stringify(extras);

                res.writeHead(303, {Location: url});
                res.end();
            } else {
                url += querystring.stringify({error: 'bad response_type:' + response_type});
                res.writeHead(303, {Location: url});
                res.end();
            }
        } else {
            url += querystring.stringify({
                error: "access_denied",
                error_description: "Owner has not allowed the client to consume it's resources"
            });

            res.writeHead(303, {Location: url});
            res.end();
        }
    }
};
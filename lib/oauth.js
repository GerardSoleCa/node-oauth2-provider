/**
 * Created by Pavilion on 11/11/2014.
 */
var querystring = require('querystring');
var serializer = require('serializer');
var utils = require('./utils/tokenGenerator');

var debug = require('./utils/debug');

module.exports = function (options) {
    var self = options;
    return function (req, res, next) {
        var uri = ~req.url.indexOf('?') ? req.url.substr(0, req.url.indexOf('?')) : req.url;
        if ('/oauth/login' == uri) {
            login(options, req, res, next);
        } else if (self.authorize_uri == uri) {
            authorize(options, req, res, next);
        } else if (self.access_token_uri == uri) {
            token(options, req, res, next);
        }
        else {
            return next();
        }
    };
};

function authorize(options, req, res, next) {
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
        var userId = options.serializer.parse(x_user_id);

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
                options.storage.saveCode(code, client_id, userId, expires.toISOString());
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
            url += querystring.stringify({error: "access_denied", error_description: "Owner has not allowed the client to consume it's resources"});

            res.writeHead(303, {Location: url});
            res.end();
        }
    }
};

function token(options, req, res, next) {
    var client_id = req.body.client_id;
    var client_secret = req.body.client_secret;
    var grant_type = req.body.grant_type;

    //TODO: Search how password grant works exactly
    if (!client_id || !client_secret) {
        var authorization = parse_authorization(req.headers.authorization);

        if (!authorization) {
            res.writeHead(400);
            return res.json({error: "invalid_request"});
        }

        client_id = authorization[0];
        client_secret = authorization[1];
    }

    options.storage.getClient(client_id, client_secret, function (client) {
        if (!client) {
            res.statusCode = 400;
            return res.json({error: "invalid_client"});
        } else if ((client.client_id != client_id) && (client.client_secret != client_secret)) {
            res.statusCode = 400;
            return res.json({error: "invalid_client"});
        }


        if (grant_type == 'authorization_code') {
            var code = req.body.code;
            options.storage.getCode(code, function (jsonCode) {
                if (!jsonCode) {
                    res.statusCode = 400;
                    return res.json({error: "invalid code"});
                }
                res.statusCode = 200;
                options.storage.addFieldsToAccessToken(client_id, code.user_id, function (tokenFields) {
                    var tokenOptions = {token_type: 'bearer'};
                    var token = utils.generateToken(options, client_id, jsonCode.user_id, tokenFields, tokenOptions);
                    options.storage.removeCode(code);
                    options.storage.saveAccessToken(token);
                    return res.json(token);
                });
            });
        } else if (grant_type == 'refresh_token') {
            var plainRefreshToken = options.serializer.parse(req.body.refresh_token);
            if ((plainRefreshToken.client_id != client_id) && (plainRefreshToken.client_secret != client_secret)) {
                res.statusCode = 400;
                return res.json({error: "invalid_grant"});
            }

        } else if (grant_type == 'password') {

        } else {
            res.statusCode = 400;
            return res.json({error: "unsupported_grant_type"});
        }
    });
};

function parse_authorization(authorization) {
    if (!authorization)
        return null;

    var parts = authorization.split(' ');

    if (parts.length != 2 || parts[0] != 'Basic')
        return null;

    var creds = new Buffer(parts[1], 'base64').toString(),
        i = creds.indexOf(':');

    if (i == -1)
        return null;

    var client_id = creds.slice(0, i);
    var client_secret = creds.slice(i + 1);

    return [client_id, client_secret];
}

function login(options, req, res) {
    options.storage.loginUser(req, function (user) {
        var redirection = querystring.stringify({
            client_id: req.query.client_id,
            redirect_uri: req.query.redirect_uri
        });
        decodeURIComponent(req.body.next);
        return res.redirect(decodeURIComponent(req.body.next));
    });
};
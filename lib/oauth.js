/**
 * Created by Pavilion on 11/11/2014.
 */
var querystring = require('querystring');
var serializer = require('serializer');
var userFunctions;
module.exports = function (options) {
    var self = options;
    return function (req, res, next) {
        var uri = ~req.url.indexOf('?') ? req.url.substr(0, req.url.indexOf('?')) : req.url;
        if (self.authorize_uri == uri) {
            authorize(options, req, res, next);
        }
        else if (self.access_token_uri == uri) {
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
            res.statusCode = 400;
            return res.end('client_id and redirect_uri required');
        }

        // authorization form will be POSTed to same URL, so we'll have all params
        var authorize_url = req.url;

        options.userFunctions[OAuthFuncTypes.checkLogin](req, res, function (userId) {
            // store user_id in an HMAC-protected encrypted query param
            authorize_url += '&' + querystring.stringify({x_user_id: options.serializer.stringify(userId)});
            console.log(options.userFunctions);
            options.userFunctions[OAuthFuncTypes.authorizeForm](req, res, client_id, authorize_url);
        });

    } else if (req.method == 'POST') {
        var response_type = (req.query.response_type || req.body.response_type) || 'code';
        var state = (req.query.state || req.body.state);
        var x_user_id = (req.query.x_user_id || req.body.x_user_id);

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
                return res.end('invalid response_type requested');
        }

        if ('allow' in req.body) {
            if ('token' == response_type) {
                var user_id;

                try {
                    user_id = options.serializer.parse(x_user_id);
                } catch (e) {
                    console.error('allow/token error', e.stack);

                    res.writeHead(500);
                    return res.end(e.message);
                }

                options.emit('create_access_token', user_id, client_id, function (extra_data, token_options) {
                    var atok = options.generateAccessToken(user_id, client_id, extra_data, token_options);

                    if (options.listeners('save_access_token').length > 0)
                        options.emit('save_access_token', user_id, client_id, atok);

                    url += querystring.stringify(atok);

                    res.writeHead(303, {Location: url});
                    res.end();
                });
            } else {
                var code = serializer.randomString(128);
                user_id = options.serializer.parse(x_user_id);
                console.log(code, user_id);

                options.userFunctions[OAuthFuncTypes.saveGrant](client_id, user_id, code);
                var extras = {
                    code: code
                };

                // pass back anti-CSRF opaque value
                if (state)
                    extras['state'] = state;

                url += querystring.stringify(extras);

                res.writeHead(303, {Location: url});
                res.end();
            }
        } else {
            url += querystring.stringify({error: 'access_denied'});

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
            return res.end('client_id and client_secret required');
        }

        client_id = authorization[0];
        client_secret = authorization[1];
    }

    if (grant_type == 'password') {

    } else if (grant_type == 'authorization_code') {
        var code = req.body.code;
        // Verify code against userId and clientId
        // Generate and Send AccessToken
        // Remove Code
        userFunctions['verifyCode'](code, client_id)
    }

    if ('password' == req.body.grant_type) {
        if (self.listeners('client_auth').length == 0) {
            res.writeHead(401);
            return res.end('client authentication not supported');
        }

        self.emit('client_auth', client_id, client_secret, req.body.username, req.body.password, function (err, user_id) {
            if (err) {
                res.writeHead(401);
                return res.end(err.message);
            }

            res.writeHead(200, {'Content-type': 'application/json'});

            self._createAccessToken(user_id, client_id, function (atok) {
                res.end(JSON.stringify(atok));
            });
        });
    } else {
        self.emit('lookup_grant', client_id, client_secret, code, function (err, user_id) {
            if (err) {
                res.writeHead(400);
                return res.end(err.message);
            }

            res.writeHead(200, {'Content-type': 'application/json'});

            self._createAccessToken(user_id, client_id, function (atok) {
                self.emit('remove_grant', user_id, client_id, code);

                res.end(JSON.stringify(atok));
            });
        });
    }
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

    var username = creds.slice(0, i);
    password = creds.slice(i + 1);

    return [username, password];
}

/**
 * This stores all the func
 */
var OAuthFuncTypes = {
    checkLogin: "check_login",
    authorizeForm: "authorize_form",
    login: "login",
    storeAccessToken: "store_access_token",
    saveGrant: "saveGrant"
};
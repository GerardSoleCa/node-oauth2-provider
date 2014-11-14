var utils = require('./../utils/tokenGenerator');


var tokenOptions = {token_type: 'bearer'};

module.exports = function (options, req, res) {
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
                options.storage.addFieldsToAccessToken(client_id, client_secret, code.user_id, function (tokenFields) {
                    var access_token = utils.generateToken(options, jsonCode.user_id, client_id, client_secret, '', tokenFields, tokenOptions);
                    options.storage.removeCode(code);
                    if (options.storage.saveAccessToken instanceof Function) {
                        options.storage.saveAccessToken(access_token);
                    }
                    return res.json(access_token);
                });
            });
        } else if (grant_type == 'refresh_token') {
            var plainRefreshToken = options.serializer.parse(req.body.refresh_token);
            if ((plainRefreshToken.client_id != client_id) && (plainRefreshToken.client_secret != client_secret)) {
                res.statusCode = 400;
                return res.json({error: "invalid_grant"});
            }
            var access_token = utils.generateToken(options, plainRefreshToken.user_id, plainRefreshToken.client_id,
                plainRefreshToken.client_secret, plainRefreshToken.scope, plainRefreshToken.token_fields, tokenOptions);
            if (options.storage.saveAccessToken instanceof Function) {
                options.storage.saveAccessToken(access_token);
            }
            return res.json(access_token);

        } else if (grant_type == 'password') {
            if (options.storage.passwordGrantType instanceof Function) {
                var username = req.body.username;
                var password = req.body.password;
                options.storage.passwordGrantType(client_id, client_secret, username, password, function (user_id) {
                    if (user_id) {

                        var accessTokenGenerator = function (tokenFields) {
                            var access_token = utils.generateToken(options, user_id, client_id, client_secret, '', tokenFields, tokenOptions);
                            if (options.storage.saveAccessToken instanceof Function) {
                                options.storage.saveAccessToken(access_token);
                            }
                            return res.json(access_token);
                        };

                        if (options.storage.addFieldsToAccessToken instanceof Function) {
                            options.storage.addFieldsToAccessToken(client_id, client_secret, user_id, function (tokenFields) {
                                accessTokenGenerator(tokenFields);
                            });
                        } else {
                            accessTokenGenerator();
                        }
                    } else {
                        res.statusCode = 400;
                        return res.json({error: "invalid_request", error_description: "Could not authenticate user"});
                    }
                });
            } else {
                res.statusCode = 400;
                return res.json({error: "unsupported_grant_type"});
            }
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
};
var utils = require('../../utils/tokenGenerator');

module.exports = function (options, req, res, client_id, client_secret, token_options) {
    if (options.storage.passwordGrantType instanceof Function) {
        var username = req.body.username;
        var password = req.body.password;
        options.storage.passwordGrantType(client_id, client_secret, username, password, function (user_id) {
            if (user_id) {

                var accessTokenGenerator = function (scope, tokenFields) {
                    var access_token = utils.generateToken(options, user_id, client_id, client_secret, scope, tokenFields, token_options);
                    if (options.storage.saveAccessToken instanceof Function) {
                        options.storage.saveAccessToken(access_token);
                    }
                    return res.json(access_token);
                };

                if (options.storage.addFieldsToAccessToken instanceof Function) {
                    options.storage.addFieldsToAccessToken(client_id, client_secret, user_id, function (scope, tokenFields) {
                        accessTokenGenerator(scope, tokenFields);
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
};
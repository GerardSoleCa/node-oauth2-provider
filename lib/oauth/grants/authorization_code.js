var utils = require('../../utils/tokenGenerator');

module.exports = function (options, req, res, client_id, client_secret, token_options) {
    var code = req.body.code;
    options.storage.getCode(code, function (jsonCode) {
        if (!jsonCode) {
            res.statusCode = 400;
            return res.json({error: "invalid code"});
        }
        res.statusCode = 200;
        options.storage.addFieldsToAccessToken(client_id, client_secret, code.user_id, function (tokenFields) {
            var access_token = utils.generateToken(options, jsonCode.user_id, client_id, client_secret, '', tokenFields, token_options);
            options.storage.removeCode(code);
            if (options.storage.saveAccessToken instanceof Function) {
                options.storage.saveAccessToken(access_token);
            }
            return res.json(access_token);
        });
    });
};
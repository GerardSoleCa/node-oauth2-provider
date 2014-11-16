var utils = require('../../utils/tokenGenerator');

module.exports = function (options, req, res, client_id, client_secret, token_options) {
    var plainRefreshToken = options.serializer.parse(req.body.refresh_token);
    if ((plainRefreshToken.client_id != client_id) && (plainRefreshToken.client_secret != client_secret)) {
        res.statusCode = 400;
        return res.json({error: "invalid_grant"});
    }
    var access_token = utils.generateToken(options, plainRefreshToken.user_id, plainRefreshToken.client_id,
        plainRefreshToken.client_secret, plainRefreshToken.scope, plainRefreshToken.token_fields, token_options);
    if (options.storage.saveAccessToken instanceof Function) {
        options.storage.saveAccessToken(access_token);
    }
    return res.json(access_token);
};
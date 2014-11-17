var utils = require('./../utils/tokenGenerator');
var grants = require('./grants');

var token_options = {token_type: 'bearer'};

module.exports = function (options, req, res) {
    var client_id = req.body.client_id;
    var client_secret = req.body.client_secret;
    var grant_type = req.body.grant_type;

    if (!client_id || !client_secret) {
        var authorization = parse_authorization(req.headers.authorization);

        if (!authorization) {
            res.statusCode = 400;
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
            return grants.authorization_code(options, req, res, client_id, client_secret, token_options);

        } else if (grant_type == 'refresh_token') {
            return grants.refresh_token(options, req, res, client_id, client_secret, token_options);

        } else if (grant_type == 'password') {
            return grants.password(options, req, res, client_id, client_secret, token_options);
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
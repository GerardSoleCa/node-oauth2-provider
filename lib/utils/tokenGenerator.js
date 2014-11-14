var serializer = require('serializer');

module.exports.generateToken = function (options, user_id, client_id, client_secret, scope, token_fields, token_options) {
    token_options = token_options || {};
    var issued_at = new Date();
    var expires_at = new Date(issued_at.getSeconds() + (options.token_expiration || 3600));
    var plainAccessToken = generateAccessToken(user_id, client_id, issued_at, expires_at, scope, token_fields);

    var refreshToken = null;
    if (options.refresh_token) {
        var plainRefreshToken = generateRefreshToken(user_id, client_id, client_secret, scope, token_fields);
        refreshToken = options.serializer.stringify(plainRefreshToken);
    }
    var out = mergeObjects(token_options, {
        access_token: options.serializer.stringify(plainAccessToken),
        refresh_token: refreshToken,
        issued_at: issued_at,
        expires_in: options.token_expiration || 3600
    });
    return out;
};

var mergeObjects = function () {
    var obj = {},
        i = 0,
        il = arguments.length,
        key;
    for (; i < il; i++) {
        for (key in arguments[i]) {
            if (arguments[i].hasOwnProperty(key)) {
                obj[key] = arguments[i][key];
            }
        }
    }
    return obj;
};

var generateAccessToken = function (user_id, client_id, issued_at, expires_at, scope, token_fields) {
    var plainAccessToken = {
        type: 'access_token',
        user_id: user_id,
        client_id: client_id,
        issued_at: issued_at.toISOString(),
        expires_at: expires_at.toISOString(),
        scope: scope,
        custom_fields: token_fields
    };
    return plainAccessToken;
};

var generateRefreshToken = function (user_id, client_id, client_secret, scope, token_fields) {
    var plainRefreshToken = {
        type: 'refresh_token',
        user_id: user_id,
        client_id: client_id,
        client_secret: client_secret,
        scope: scope,
        custom_fields: token_fields
    };
    return plainRefreshToken;
};

var generateCode = function () {
    return serializer.randomString(128);
};
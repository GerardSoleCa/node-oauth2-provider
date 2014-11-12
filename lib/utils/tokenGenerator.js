/**
 * Created by Gerard on 12/11/2014.
 */
module.exports.generateToken = function (options, client_id, user_id, token_fields, token_options) {
    token_options = token_options || {};
    var issued_at = new Date();
    var expires_at = new Date(issued_at.getSeconds() + (options.token_expiration || 3600));
    var plainAccessToken = {
        type: 'accesstoken',
        user_id: user_id,
        client_id: client_id,
        issued_at: issued_at.toISOString(),
        expires_at: expires_at.toISOString(),
        custom_fields: token_fields
    };

    var refreshToken = null;
    if (options.refresh_token) {
        var plainRefreshToken = {
            type: 'refreshtoken',
            user_id: user_id,
            client_id: client_id,
            custom_fields: token_fields
        };
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
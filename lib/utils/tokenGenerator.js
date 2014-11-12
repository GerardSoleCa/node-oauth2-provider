/**
 * Created by Gerard on 12/11/2014.
 */
module.exports.generateToken = function (options, client_id, user_id, token_fields, token_options) {
    token_options = token_options || {};
    var out = mergeObjects(token_options, {
        access_token: options.serializer.stringify([user_id, client_id, new Date, token_fields]),
        refresh_token: null,
        expires_in: options.token_expires_in || 3600
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
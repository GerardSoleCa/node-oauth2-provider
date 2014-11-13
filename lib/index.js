var serializer = require('serializer');

var oauth = require('./oauth/index');
var debug = require('./utils/debug');

var login = require('./login');

function OAuth2Provider(options) {

    if (arguments.length != 1) {
        console.error('You MUST supply a config');
    }

    debug.enable(options.debug || false);
    options.authorize_uri = options.authorize_uri || '/oauth/authorize';
    options.access_token_uri = options.access_token_uri || '/oauth/token';
    options.serializer = serializer.createSecureSerializer(options.crypt_key, options.sign_key);
    options.userFunctions = {};

    var module = {};

    // Use this function as a middleware to enforce the authentication in the resource
    module.needsOauth = login(options)

    // module.enforceLogin = function () {
    //    return function (req, res, next) {
    //        var token;
    //
    //        if (req.query.access_token) {
    //            token = req.query.access_token;
    //        } else if ((req.headers.authorization || '').indexOf('Bearer') == 0) {
    //            token = req.headers.autorization.replace('Bearer', '').trim();
    //        } else {
    //            res.statusCode = 401;
    //            return res.json({error: "invalid_request", error_description: "authenticated_resource"});
    //        }
    //
    //        try {
    //            var data = options.serializer.parse(token);
    //            req.oauth = {
    //                type: data[0],
    //                user_id: data[1],
    //                client_id: data[2],
    //                issued_at: new Date(data[3]),
    //                expires_at: new Date(data[4]),
    //                custom_fields: data[5]
    //            };
    //
    //            if (req.oauth.type != 'accesstoken') {
    //                res.statusCode = 400;
    //                return res.json({error: "invalid_grant", error_description: "invalid_accesstoken"});
    //            }
    //
    //            if (req.oauth.expires_at < new Date()) {
    //                res.statusCode = 400;
    //                return res.json({error: "invalid_grant", error_description: "token_expired"});
    //            }
    //
    //            next();
    //        } catch (e) {
    //            res.statusCode = 400;
    //            return res.json({error: e.message});
    //        }
    //    }
    //};

    // This function is used to load all the required middleware into express
    module.middleware = function () {
        var middlewares = [];
        middlewares.push(index(options));
        return middlewares;
    };
    return module;
};
module.exports.OAuth2Provider = OAuth2Provider;
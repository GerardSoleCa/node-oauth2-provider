var serializer = require('serializer');
var oauth = require('./oauth');
var debug = require('./utils/debug');
function OAuth2Provider(options) {

    if (arguments.length != 1) {
        console.error('Must supply a config');
    }

    debug.enable(options.debug || false);
    options.authorize_uri = options.authorize_uri || '/oauth/authorize';
    options.access_token_uri = options.access_token_uri || '/oauth/token';
    options.serializer = serializer.createSecureSerializer(options.crypt_key, options.sign_key);
    options.userFunctions = {};

    this.options = options;

    var module = {};

    module.enforceLogin = function () {
        var self = options;
        return function (req, res, next) {
            var token;

            if (req.query.access_token) {
                token = req.query.access_token;
            } else if ((req.headers.authorization || '').indexOf('Bearer') == 0) {
                token = req.headers.autorization.replace('Bearer', '').trim();
            } else {
                res.statusCode = 403;
                res.end('Unauthorized access');
            }

            try {
                var data = self.serializer.parse(token);
                req.oauth = {
                    userId: data[0],
                    clientId: data[1],
                    grantData: new Date(data[2]),
                    extraData: data[3]
                };
                next();
            } catch (e) {
                res.statusCode = 400;
                return res.end(e.message);
            }
        }
    };

    module.middleware = function () {
        var middlewares = [];
        middlewares.push(oauth(options));
        return middlewares;
    };
    return module;
};

module.exports.OAuth2Provider = OAuth2Provider;

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
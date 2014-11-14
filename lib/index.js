var serializer = require('serializer');

var oauth = require('./oauth/index');
var debug = require('./utils/debug');
var login = require('./login');


var OAuth2Provider = function (options) {

    if (arguments.length != 1) {
        console.error('You MUST supply a config');
    }

    debug.enable(options.debug || false);
    options.authorize_uri = options.authorize_uri || '/oauth/authorize';
    options.access_token_uri = options.access_token_uri || '/oauth/token';
    options.serializer = serializer.createSecureSerializer(options.crypt_key, options.sign_key);


    var module = {};

    // Use this function as a middleware to enforce the authentication in the resource
    module.needsOAuth = login(options);


    // This function is used to load all the required middleware into express
    module.middleware = function () {
        return oauth(options);
    };
    return module;
};

module.exports.OAuth2Provider = OAuth2Provider;
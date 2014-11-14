/**
 * Created by Pavilion on 11/11/2014.
 */
var codes = [];
var clients = [];
var accessTokens = [];
module.exports = {

    getClient: function (clientId, clientSecret, callback) {
        var client = clients[clientId];

        if (client) {
            callback(client);
        } else {
            callback(false);
        }
    },

    getUserOrLoadLogin: function (req, res, authorizeUrl, callback) {
        if (req.session.userId) {
            callback(req.session.userId);
        } else {
            res.render('oauth_login', {next: encodeURIComponent(authorizeUrl)});
        }
    },

    loginUser: function (req, callback) {
        if (req.body.username == req.body.password) {
            req.session.userId = req.body.username;
            callback(req.body.user);
        } else {
            callback(false);
        }
    },

    loadAuthorizeForm: function (req, res, clientId, authorizeUrl) {
        res.render('oauth_authorization', {client_id: clientId, authorize_url: authorizeUrl})
    },

    saveCode: function (code, client_id, user_id, expires) {
        codes[code] = {
            client_id: client_id,
            user_id: user_id,
            expires: expires
        };
        console.log(codes);
    },

    removeCode: function (code) {
        codes[code] = undefined;
    },

    getCode: function (code, callback) {
        callback(codes[code]);
    },

    addFieldsToAccessToken: function (client_id, client_secret, user_id, callback) {
        var fields = {
            test_field: 'test test'
        };
        callback(fields);
    },

    saveAccessToken: function (accessToken) {

    }
};

var populateTestData = function () {
    var clientId = 'clientId';
    clients[clientId] = {
        client_id: 'clientId',
        client_secret: 'clientSecret',
        redirect_uri: 'http://myapp.foo/'
    };
};

populateTestData();
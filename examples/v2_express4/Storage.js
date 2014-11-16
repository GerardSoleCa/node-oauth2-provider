var codes = [];
var clients = [];
var accessTokens = [];

module.exports = {

    getClient: function (client_id, client_secret, callback) {
        var client = clients[client_id];

        if (client) {
            callback(client);
        } else {
            callback(false);
        }
    },

    getUserOrLoadLogin: function (req, res, authorize_uri, callback) {
        if (req.session.userId) {
            callback(req.session.userId);
        } else {
            res.render('oauth_login', {next: encodeURIComponent(authorize_uri)});
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

    loadAuthorizeForm: function (req, res, client_id, authorize_uri) {
        res.render('oauth_authorization', {client_id: client_id, authorize_url: authorize_uri})
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

    saveAccessToken: function (access_token) {

    }
};

var populateTestData = function () {
    var clientId = 'clientId';
    clients[clientId] = {
        client_id: 'clientId',
        client_secret: 'clientSecret',
        redirect_uri: 'localhost'
    };
};

populateTestData();
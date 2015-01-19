var querystring = require('querystring');
var serializer = require('serializer');
var debug = require('./../utils/debug');

// Sublibs
var token = require('./token');
var authorize = require('./authorize');

module.exports = function (app, options) {

    app.post('/oauth/login', function (req, res) {
        login(options, req, res)
    });
    app.get(options.authorize_uri, function (req, res) {
        authorize(options, req, res)
    });
    app.post(options.authorize_uri, function (req, res) {
        authorize(options, req, res)
    });
    app.post(options.access_token_uri, function (req, res) {
        token(options, req, res)
    });

    //return function (req, res, next) {
    //    var uri = ~req.url.indexOf('?') ? req.url.substr(0, req.url.indexOf('?')) : req.url;
    //    if ('/oauth/login' == uri) {
    //        login(options, req, res);
    //    } else if (options.authorize_uri == uri) {
    //        authorize(options, req, res);
    //    } else if (options.access_token_uri == uri) {
    //        token(options, req, res);
    //    }
    //    else {
    //        return next();
    //    }
    //}
};

function login(options, req, res) {
    options.storage.loginUser(req, function (user) {
        var redirection = querystring.stringify({
            client_id: req.query.client_id,
            redirect_uri: req.query.redirect_uri
        });
        decodeURIComponent(req.body.next);
        return res.redirect(decodeURIComponent(req.body.next));
    });
};

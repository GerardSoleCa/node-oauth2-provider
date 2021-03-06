// simple server with a protected resource at /secret secured by OAuth 2

var OAuth2Provider = require('../../lib/index').OAuth2Provider,
    express = require('express'),
    session = require('express-session'),
    MemoryStore = require('express-session').MemoryStore,
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    storage = require('./Storage');


var app = express();

/**
 * crypt_key and sign_key are used to sign and encrypt the content of accessToken
 * manager is implemented by the developer
 *
 */
var oauthProvider = new OAuth2Provider({
    crypt_key: 'encryption secret',
    sign_key: 'signing secret',
    storage: storage,
    authorize_uri: '/oauth/authorize',
    access_token_uri: '/oauth/token',
    token_expiration: 3600,
    refresh_token: true,
    persist_refreshtoken: true,
    persist_accesstoken: true,
    debug: true
});

app.use(logger('dev'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.query());
app.use(cookieParser());
app.use(session({
    store: new MemoryStore({reapInterval: 5 * 60 * 1000}),
    secret: 'abracadabra',
    resave: true,
    saveUninitialized: true
}));

app.use(oauthProvider.middleware());

app.get('/', function (req, res, next) {
    console.dir(req.session);
    res.end('home, logged in? ' + !!req.session.user);
});

app.get('/logout', function (req, res, next) {
    req.session.destroy(function (err) {
        res.writeHead(303, {Location: '/'});
        res.end();
    });
});

app.get('/secret', oauthProvider.needsOAuth(), function (req, res, next) {
    res.json({response: 'SECRET'});
});

app.listen(8081);

console.log('Listening on http://localhost:8081/');
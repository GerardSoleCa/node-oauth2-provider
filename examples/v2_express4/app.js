// simple server with a protected resource at /secret secured by OAuth 2

var OAuth2Provider = require('../../lib/index').OAuth2Provider,
    express = require('express'),
    session = require('express-session'),
    MemoryStore = require('express-session').MemoryStore,
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    storage = require('./Storage');

// hardcoded list of <client id, client secret> tuples
var myClients = {
    '1': '1secret',
};

var app = express();

// temporary grant storage
var myGrants = {};

/**
 * crypt_key and sign_key are used to sign and encrypt the content of accessToken
 * manager is implemented by the developer
 *
 */
var oauthProvider = new OAuth2Provider({
    crypt_key: 'encryption secret',
    sign_key: 'signing secret',
    storage: storage,
    authorize_uri : '/oauth/authorize',
    access_token_uri : '/oauth/token',
    token_expiration: 3600,
    persist_refreshtoken: true,
    persist_accesstoken: true,
    debug: true
});

//oauthProvider.authorizeForm(function(req, res, client_id, authorize_url){
//    res.end('<html>this app wants to access your account... <form method="post" action="' + authorize_url + '"><button name="allow">Allow</button><button name="deny">Deny</button></form>');
//});

//oauthProvider.saveGrant(function (clientId, userId, code) {
//    myGrants[clientId+'.'+userId] = code;
//});


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
//app.use(oauthProvider.oauth());
//app.use(oauthProvider.login());

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

app.get('/secret', oauthProvider.enforceLogin(), function (req, res, next) {
    res.end('SECRET');
});

app.listen(8081);

console.log('Listening on http://localhost:8081/');

function escape_entities(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


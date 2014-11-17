# OAuth2.0 Express

This is an OAuth2.0 Provider compliant with [RFC6749](https://tools.ietf.org/html/rfc6749).
This provider is designed as a secure middleware for [Express](http://expressjs.com/). Actually it supports
authorization_code, password and refresh_token grants and code and token OAuth flows.

Actually you only need to take care of storing (store and retrieve of codes, tokens, clients, ...).

## Greetings to Amir Malik (ammmir)

This library born as a fork of Amir Malik's [**node-oauth2-provider**](https://github.com/ammmir/node-oauth2-provider).
You can review the Git history to view changes in commits and the evolution of this library.

## Using it with npm

If you're using this module via npm, please be sure the bracket the
version in your app's `package.json` file. Major versions may have an
incompatible API that's not backwards-compatible, so use a safe version
range under `dependencies` (eg. for version 1.x):

    "oauth2-express": "1.x"

## Quick Start

Install via npm:

    npm install oauth2-express

You can add it to your Connect or Express application as another middleware.
Be sure to enable the `bodyParser` and `query` middleware.

The OAuth2Provider instance providers two middleware:

* `oauth()`: OAuth flow entry and access token generation
* `login()`: Access control for protected resources

The most important event emitted by OAuth2Provider is `access_token`, which
lets you set up the request as if it were authenticated. For example, to
support both cookie-authenticated and OAuth access to protected URLs, you
could populate `req.session.user` so that individual URLs don't need to
care about which type of authentication was used.

To support client authentication (sometimes known as xAuth) for trusted
clients, handle the `client_auth` event to exchange a username and password
for an access token. See `examples/simple_express4/app.js`.

## Example

Within the examples sub-folder matching your preferred version of Express (for example, `examples/simple_express4`), run `npm install` and then run:

    node app.js

Visit <http://localhost:8081/login> to gain access to
<http://localhost:8081/secret> or use OAuth to obtain an access token as a code (default) or a token (in the URL hash):

  - code: <http://localhost:8081/oauth/authorize?client_id=1&redirect_uri=http://myapp.foo/>
  - token: <http://localhost:8081/oauth/authorize?client_id=1&redirect_uri=http://myapp.foo/&response_type=token>

## Running tests

  Install dev dependencies:

    $ npm install -d

  Run the tests:

    $ make test
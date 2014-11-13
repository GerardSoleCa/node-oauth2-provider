/**
 * Created by Pavilion on 13/11/2014.
 */
var auth_code = require('./authorization_code');
var refresh_token = require('./refresh_token');
var password = require('./password');

module.exports = {
    authorization_code: function () {
        return auth_code();
    },
    refresh_token: function () {
        return refresh_token();
    },
    password: function () {
        return password();
    }
};
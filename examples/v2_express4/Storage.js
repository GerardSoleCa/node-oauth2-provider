/**
 * Created by Pavilion on 11/11/2014.
 */
var codes = [];
module.exports = {

    /**
     * AUTHORITZATION_CODE
     */

    saveCode: function (code, clientId, userId, expires) {
        codes[code] = {
            clientId: clientId,
            userId: userId,
            expires: expires
        };
        console.log(codes);
    },

    getCode: function (code) {
        return codes[code];
    },

    verifyCode: function (code, clientId) {
        return (codes[code].clientId == clientId);
    },

    /**
     * ACCESS_TOKEN
     */

    saveAccessToken: function () {

    },
    getAccessToken: function () {

    }
};
/**
 * Wrapper for console function with enable/disable capabilities.
 *
 * @author GerardSoleCa [https://github.com/GerardSoleCa]
 */
var enabled = false;
var error = function () {
    if (enabled)
        console.error.apply(this, arguments);
};

var warn = function () {
    if (enabled)
        console.warn.apply(this, arguments);
};

var log = function () {
    if (enabled)
        console.log.apply(this, arguments);
};
var enable = function (enable) {
    enabled = enable;
};

module.exports.error = error;
module.exports.warn = warn;
module.exports.log = log;
module.exports.enable = enable;
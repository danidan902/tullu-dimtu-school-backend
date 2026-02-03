exports.setup = function (arg) {
    if (arg === true) {
        console.debug = function (message) {
            console.log(("[DEBUG]" + message).grey);
        };
    } else {
        console.debug = function () {};
    }
};

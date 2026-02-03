var exec = require('child_process').exec;

/*
 Play the sound streamed from the specified URL.
 */
exports.playMessage = function (message) {
    if (message.url) {
        console.debug("Playing " + message.url);

        exec("mplayer " + message.url.replace("https://", "http://") + " -really-quiet");
    }
};

var colors = require('colors'),
    moment = require('moment'),
    when = require('when'),
    sequence = require('when/sequence'),
    _ = require('lodash');

module.exports = function (config) {
    var userRegistry = config.userRegistry,
        campfire = config.campfire,
        out = config.out || process.stdout,
        showEnterLeaveMessages = config.showEnterLeaveMessages,
        self = this;

    moment.locale(config.locale || "en-GB");

    function userToString(user) {
        return user ? user.name.cyan : "?".red;
    }

    this.printMessage = function (message) {
        // Yes we really do need to duplicate code here - momentjs mutates the moment with its "startOf" function
        var createdAtDate = new Date(message.created_at),
            createdAt = moment(createdAtDate),
            messageCreatedToday = moment(createdAtDate).startOf('day')
                .isSame(moment().startOf('day')),
            createdText = messageCreatedToday ?
                createdAt.format("HH:mm:ss") :
                createdAt.calendar();

        console.debug(JSON.stringify(message));

        if ((message.type === 'TextMessage') || (message.type === 'PasteMessage')) {
            var body = message.body,
                isMultiline = (body.indexOf('\n') > 0);

            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]:" + (isMultiline ? "\n" : " ") + body + "\n");
                });

        } else if ((message.type === 'EnterMessage') && (showEnterLeaveMessages || _.isUndefined(showEnterLeaveMessages))) {
            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]: " + "Entered room.".yellow + "\n");
                });

        } else if (message.type === 'LeaveMessage' && (showEnterLeaveMessages || _.isUndefined(showEnterLeaveMessages))) {
            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]: " + "Left room.".yellow + "\n");
                });

        } else if (message.type === "UploadMessage") {
            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    return userToString(user) + " [" + createdText.green + "]: " + "Uploaded a file: ".magenta;
                })
                .then(function (preamble) {
                    return campfire.getUpload(config.roomId, message.id)
                        .then(function (upload) {
                            out.write(preamble + upload.full_url + "\n");
                        });
                });

        } else if (message.type === "SoundMessage") {
            return userRegistry.getUser(message.user_id)
                .then(function (user) {
                    out.write(userToString(user) + " [" + createdText.green + "]: " + "Played a sound: ".magenta + message.url + "\n");
                });
        }

        return when.resolve();
    };

    this.printMessages = function (messages) {
        function printMessageFunc (message) {
            return function () {
                return self.printMessage(message);
            };
        }

        return sequence(messages.map(printMessageFunc));
    };
};


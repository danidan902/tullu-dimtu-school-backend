var when = require('when'),
    nn = require('node-notifier'),
    fs = require('fs'),
    path = require('path'),
    _ = require('lodash');

module.exports = function (config) {
    var campfire = config.campfire,
        userRegistry = config.userRegistry,
        streamfireIconPath = __dirname + "/../../img/sicon-55x55.png";

    /**
     * Sends an alert based on the specified message.
     *
     * Returns a promise;
     */
    this.notify = function (message) {
        function matches (body) {
            return function (regexp) {
                return regexp.test(body);
            };
        }

        if ((message.type !== 'TextMessage') && (message.type !== 'PasteMessage')) {
            return when.resolve();
        }

        if (!config.alertOn) {
            return when.resolve();
        }

        var body = message.body,
            userId = message.user_id,
            user;

        if (!config.alertOn.some(matches(body))) {
            return when.resolve();
        }

        return userRegistry.getUser(userId)
            .then(function (userObj) {
                user = userObj;
                return userObj;
            })
            .then(function (user) {
                var avatarFile;
                if (!user.avatar_url || (user.avatar_url.indexOf("missing/avatar") > -1)) {
                    avatarFile = streamfireIconPath;
                } else {
                    avatarFile = config.workingDir + user.id + ".png";
                }

                if (fs.existsSync(avatarFile)) {
                    return when.resolve(avatarFile);
                } else {
                    return campfire.downloadAvatarFor(user, avatarFile);
                }
            })
            .then(function (path) {
                console.debug("Sending notification...");
                console.debug("Using avatar on path " + path + ".");

                nn.notify({
                    title: 'Streamfire',
                    message: user.name + ": " + message.body,
                    icon: path,
                    sound: true,
                    wait: false
                });
            });

    };

    this.notifyInfo = function (text) {
        nn.notify({
            title: 'Streamfire',
            message: text,
            sound: false,
            wait: false,
            icon: streamfireIconPath
        });
    };
};


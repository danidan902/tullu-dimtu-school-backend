var es = require('event-stream'),
    colors = require('colors'),
    _ = require('lodash'),
    util = require('util'),
    os = require('os'),
    wrench = require('wrench'),
    moment = require('moment'),
    when = require('when'),
    sequence = require('when/sequence'),
    Campfire = require('./streamfire/campfire'),
    UserRegistry = require('./streamfire/user-registry'),
    RoomOutStream = require('./streamfire/room-out'),
    Printer = require('./streamfire/printer'),
    Notifier = require('./streamfire/notifier'),
    roomResolver = require('./streamfire/room-resolver'),
    player = require('./streamfire/player');

exports.run = function (argv, debug, quiet) {
    require('./streamfire/debug').setup(debug);

    var userConfig = require('./streamfire/config').loadConfig(),
        workingDir = os.tmpdir() + "/./streamfire/",
        domain = userConfig.domain,
        apiToken = userConfig.apiToken,
        alertOn = (userConfig.alertOn || [])
            .map(function (textMatch) {
                return new RegExp(textMatch, "i");
            });

    var campfire = new Campfire({
            url: util.format('https://%s', domain),
            apiToken: apiToken,
            workingDir: workingDir
        }),
        roomId = roomResolver.resolve(argv[0], {
            campfire: campfire,
            rooms: userConfig.rooms
        }),
        userRegistry = new UserRegistry({
            campfire: campfire
        }),
        notifier = new Notifier({
            campfire: campfire,
            userRegistry: userRegistry,
            alertOn: alertOn,
            workingDir: workingDir
        }),
        printer = new Printer({
            campfire: campfire,
            userRegistry: userRegistry,
            locale: userConfig.locale,
            roomId: roomId,
            showEnterLeaveMessages: userConfig.showEnterLeaveMessages
        }),
        outStream = new RoomOutStream({
            campfire: campfire,
            notifier: notifier,
            userRegistry: userRegistry,
            printer: printer,
            rooms: userConfig.rooms
        });

    function bootstrapMessage(message) {
        if (!quiet) {
            process.stdout.write(message);
        }
    }

    function joinRoom() {
        bootstrapMessage("Joining room ".yellow + roomId.green + "...".yellow);

        return campfire.joinRoom(roomId)
            .then(ok);
    }

    function openRoomStreamIn() {
        return campfire.openRoomStream(roomId)
            .pipe(es.map(function (message, callback) {
                printer.printMessage(message);
                notifier.notify(message);

                if (userConfig.playSounds) {
                    player.playMessage(message);
                }
                callback();
            }));
    }

    function openRoomStreamOut() {
        return when.resolve(outStream.open(roomId));
    }

    function ok(result) {
        bootstrapMessage(" [" + "OK".green + "]\n");
        return result;
    }

    function loadUsersFromRoom() {
        bootstrapMessage("Loading users in room...".yellow);
        return userRegistry.loadFromRoom(roomId)
            .then(ok);
    }

    function loadUsersFromMessages(messages) {
        bootstrapMessage("Loading owners of messages...".yellow);

        return userRegistry.loadFromMessages(messages)
            .then(ok);
    }

    function loadRecentMessages() {
        bootstrapMessage("Loading recent messages...".yellow);
        return campfire.getRecentMessages(roomId)
            .then(ok);
    }

    function showAlerts() {
        if (userConfig.showTodaysAlertsOnStartup && _.isArray(userConfig.alertOn)) {
            return campfire.getTranscript(roomId, moment())
                .done(function (messages) {
                    messages.forEach(notifier.notify);
                });
        } else {
            return when.resolve();
        }
    }

    wrench.rmdirSyncRecursive(workingDir, { forceDelete: true });
    wrench.mkdirSyncRecursive(workingDir);

    if (_.isString(roomId)) {
        joinRoom()
            .then(loadUsersFromRoom)
            .then(loadRecentMessages)
            .then(function (messages) {
                return sequence([ loadUsersFromMessages, printer.printMessages ], messages);
            })
            .then(openRoomStreamIn)
            .then(openRoomStreamOut)
            .then(showAlerts)
            .catch(function (e) {
                notifier.notifyInfo("streamfire exited unexpectedly.");
                console.error(e);
                process.exit(1);
            });
    }
};

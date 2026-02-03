var _ = require('lodash'),
    util = require('util'),
    Campfire = require('./streamfire/campfire'),
    Printer = require('./streamfire/printer'),
    UserRegistry = require('./streamfire/user-registry'),
    roomResolver = require('./streamfire/room-resolver'),
    moment = require('moment'),
    sequence = require('when/sequence');

exports.run = function (argv, debug) {
    require('./streamfire/debug').setup(debug);

    var userConfig = require('./streamfire/config').loadConfig(),
        campfire = new Campfire({
            url: util.format('https://%s', userConfig.domain),
            apiToken: userConfig.apiToken
        }),
        roomId = roomResolver.resolve(argv[0], {
            campfire: campfire,
            rooms: userConfig.rooms
        }),
        userRegistry = new UserRegistry({
            campfire: campfire
        }),
        printer = new Printer({
            userRegistry: userRegistry,
            locale: userConfig.locale,
            campfire: campfire,
            roomId: roomId
        }),
        dayArg = argv[1],
        date;

    if (_.isUndefined(dayArg)) {
        date = moment();
    } else if (_.isNumber(dayArg)) {
        date = moment().subtract(dayArg, 'days');
    } else {
        date = moment(dayArg, "YYYY-MM-DD");
    }

    if (_.isString(roomId)) {
        campfire.getTranscript(roomId, date)
            .then(function (messages) {
                return sequence([
                    userRegistry.loadFromMessages,
                    printer.printMessages
                ], messages);
            })
            .catch(function (e) {
                console.error(e);
                process.exit(1);
            })
            .done();
    }
};

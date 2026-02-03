var _ = require('lodash'),
    util = require('util'),
    Campfire = require('./streamfire/campfire'),
    Printer = require('./streamfire/printer'),
    UserRegistry = require('./streamfire/user-registry'),
    roomResolver = require('./streamfire/room-resolver');

exports.run = function (argv, debug) {
    require('./streamfire/debug').setup(debug);

    var term = argv[1],
        userConfig = require('./streamfire/config').loadConfig(),
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
            roomId: roomId,
            campfire: campfire
        });

    if (_.isString(roomId)) {
        campfire.search(roomId, term)
            .then(printer.printMessages)
            .catch(function (e) {
                console.error(e);
                process.exit(1);
            })
            .done();
    }
};

var _ = require('lodash');

/**
 * Attempts to resolve the room id (as a string) from the given alias. If no alias exists in the user config
 * then the process exits, dumping out a list of available rooms.
 *
 * If the alias is already numeric then assumes that it is a room id already and returns it.
 */
exports.resolve = function (alias, config) {

    if (!isNaN(alias)) {
        return alias.toString();
    }

    var roomConfig = _.find(config.rooms, { alias: alias });

    if (roomConfig) {
        return roomConfig.id.toString();

    } else {
        // No alias exists - exit.
        return config.campfire.getRooms()
            .then(function (rooms) {
                console.log("Available rooms:\n");

                rooms.forEach(function (room) {
                    var roomConfig = _.find(config.rooms, { id: room.id });

                    console.log(room.id.toString().cyan + ": " + room.name.green +
                        (roomConfig ? (" Alias: \"" + roomConfig.alias + "\"").yellow : ""));
                });

                process.exit();
            });
    }
};

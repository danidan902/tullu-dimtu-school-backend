var when = require('when'),
    _ = require('lodash');

module.exports = function (config) {
    var self = this,
        campfire = config.campfire,
        users = {};

    /**
     * Gets the user with the specified id from the registry. If the user does not exist it is loaded from Campfire.
     *
     * Returns a promise;
     */
    this.getUser = function (id) {
        if (users[id]) {
            return when.resolve(users[id]);

        } else {
            return campfire.getUser(id)
                .then(function (user) {
                    users[id] = user;
                    return user;
                });
        }
    };

    /**
     * Loads all users currently present in the specified room.
     *
     * Returns a promise;
     */
    this.loadFromRoom = function(roomId) {
        return campfire.getRoom(roomId)
            .then(function (room) {
                var userIds = _.pluck(room.users, "id");

                return when.all(_.uniq(userIds).map(self.getUser));
            });
    };

    /**
     * Loads all users that are owners of messages in the specified list.
     *
     * Returns a promise;
     */
    this.loadFromMessages = function(messages) {
        var userIds = _.compact(_.pluck(messages, 'user_id'));

        return when.all(_.uniq(userIds).map(self.getUser));
    };

    /**
     * Gets all users with names starting with the specified text.
     */
    this.search = function (text) {
        var lineMatcher = new RegExp("^" + text, "i");

        return _.values(users).filter(function (user) {
            return lineMatcher.test(user.name);
        });
    };
};

var request = require('request'),
    JSONStream = require('JSONStream'),
    when = require('when'),
    util = require('util'),
    qs = require('querystring'),
    fs = require('fs'),
    os = require('os'),
    open = require('open'),
    imagemagick = require('imagemagick');

module.exports = function (config) {
    var apiToken = config.apiToken,
        baseUrl = config.url,
        workingDir = config.workingDir;

    function responseResolver(deferred, bodyParser) {
        return function (error, response, body) {
            if (error) {
                deferred.reject(error);

            } else if (response.statusCode > 299) {
                deferred.reject(new Error("Status code: " + response.statusCode));

            } else {
                if (bodyParser) {
                    console.debug(body);
                    deferred.resolve(bodyParser(body));
                } else {
                    deferred.resolve();
                }
            }
        };
    }

    this.dateFormat = "YYYY/MM/DD HH:mm:ss ZZ";

    this.downloadAvatarFor = function (user) {
        var deferred = when.defer(),
            filename = user.id;

        if (user.avatar_url) {
            var path = workingDir + filename,
                file = fs.createWriteStream(path);

            console.debug("Downloading avatar for user " + user.id + " to path " + path + "...");

            request.get(user.avatar_url)
                .pipe(file)
                .on('finish', function () {
                    console.debug("Avatar downloaded. Converting...");
                    var finalPath = path + ".png";

                    try {
                        imagemagick.convert([ path, finalPath], function () {
                            deferred.resolve(finalPath);
                        });
                    } catch (e) {
                        deferred.reject(e);
                    }
                });

            return deferred.promise;

        } else {
            console.debug("User " + user.id + " does not have avatar.");
            deferred.reject();
        }

        return deferred.promise;
    };

    /**
     * Gets the details for the specified user. Returns a promise.
     */
    this.getUser = function (userId) {
        console.debug("Getting user " + userId + "...");

        var deferred = when.defer();

        request.get(util.format('%s/users/%s.json', baseUrl, userId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).user;
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the details for the specified room. Returns a promise.
     */
    this.getRoom = function (roomId) {
        console.debug("Getting room " + roomId + "...");

        var deferred = when.defer();

        request.get(util.format('%s/room/%s.json', baseUrl, roomId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).room;
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the details for all rooms visible to the user. Returns a promise.
     */
    this.getRooms = function () {
        console.debug("Getting rooms...");

        var deferred = when.defer();

        request.get(util.format('%s/rooms.json', baseUrl),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).rooms;
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Sends a join request to the specified Campfire room. Returns a promise.
     */
    this.joinRoom = function (roomId) {
        console.debug("Joining room " + roomId + "...");

        var deferred = when.defer();

        request.post(util.format('%s/room/%s/join.json', baseUrl, roomId),
            responseResolver(deferred))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Sends a leave request to the specified Campfire room. Returns a promise.
     */
    this.leaveRoom = function (roomId) {
        console.debug("Leaving room " + roomId + "...");

        var deferred = when.defer();

        request.post(util.format('%s/room/%s/leave.json', baseUrl, roomId),
            responseResolver(deferred))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the most recent messages for the specified room. Returns a promise.
     */
    this.getRecentMessages = function (roomId) {
        console.debug("Getting recent messages from room " + roomId + "...");

        var deferred = when.defer();

        request.get(util.format('%s/room/%s/recent.json', baseUrl, roomId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).messages;
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Posts the specified message to the specified room.
     */
    this.postMessage = function (roomId, message) {
        console.debug("Posting message to room " + roomId + "...");
        console.debug(JSON.stringify(message));

        var deferred = when.defer();

        request.post({
            url: util.format('%s/room/%s/speak.json', baseUrl, roomId),
            auth: {
                user: apiToken,
                pass: 'X'
            },
            json: {
                message: message
            }
        }, responseResolver(deferred));

        return deferred.promise;
    };

    /**
     * Searches all rooms for the specified term.
     */
    this.search = function (roomId, term) {
        console.debug("Searching room " + roomId + " with term '" + term + "'...");

        var deferred = when.defer(),
            url = util.format('%s/search?', baseUrl) + qs.stringify({
                q: term,
                format: "json"
            });

        request.get(url,
            responseResolver(deferred, function (body) {
                return JSON.parse(body).messages.filter(function (message) {
                    return message.room_id === parseInt(roomId);
                }).reverse();
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the room transcript for the specified day indicated by the specified moment.
     *
     * Returns a promise.
     */
    this.getTranscript = function (roomId, date) {

        var datePath = date.format("YYYY/M/D"),
            deferred = when.defer();

        console.debug("Getting messages for " + datePath + " from room " + roomId + "...");

        request.get(util.format('%s/room/%s/transcript/' + datePath + ".json", baseUrl, roomId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).messages;
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Gets the upload details for the specified upload message.
     *
     * Returns a promise.
     */
    this.getUpload = function (roomId, messageId) {

        var deferred = when.defer();

        console.debug("Getting upload for message " + messageId + " from room " + roomId + "...");

        request.get(util.format('%s/room/%s/messages/%s/upload.json', baseUrl, roomId, messageId),
            responseResolver(deferred, function (body) {
                return JSON.parse(body).upload;
            }))
            .auth(apiToken, 'X');

        return deferred.promise;
    };

    /**
     * Opens a stream to the specified room.
     */
    this.openRoomStream = function (roomId) {
        console.debug("Opening stream to room " + roomId + "...");

        return request.get('https://streaming.campfirenow.com/room/' + roomId + '/live.json')
            .auth(apiToken, 'X')
            .pipe(JSONStream.parse());
    };

    /**
     * Opens a browser session for the specified room.
     */
    this.openRoomInBrowser = function (roomId) {
        var url = baseUrl + '/room/' + roomId;

        console.debug("Opening url " + url + " in browser...");
        open(url);
    };
};

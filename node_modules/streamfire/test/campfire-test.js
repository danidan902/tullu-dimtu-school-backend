/* jshint expr:true */
var chai = require('chai'),
    expect = chai.expect,
    vanilliPort = process.env.vanilliPort,
    milli = require('milli').configure({ port: parseInt(vanilliPort) }),
    request = require('request'),
    moment = require('moment'),
    campfireBaseUrl = 'http://localhost:' + vanilliPort,
    Campfire = require('../lib/streamfire/campfire'),
    campfire = new Campfire({
        url: campfireBaseUrl,
        apiToken: "sometoken"
    });

describe("campfire client", function () {
    beforeEach(function (done) {
        milli.clearStubs(done);
    });

    afterEach(function (done) {
        milli.verifyExpectations(done);
    });

    it("getUser pulls user object from response", function (done) {
        var entity = { user: { somefield: "somevalue" } };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/users/someuserid.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getUser("someuserid")
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.user);
                        done();
                    })
                    .done();
            });
    });

    it("getRoom pulls room object from response", function (done) {
        var entity = { room: { somefield: "somevalue" } };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/room/someroomid.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getRoom("someroomid")
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.room);
                    })
                    .done(done, done);
            });
    });

    it("getRooms pulls rooms array from response", function (done) {
        var entity = { rooms: [
            { somefield: "somevalue" }
        ] };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/rooms.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getRooms()
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.rooms);
                    })
                    .done(done, done);
            });
    });

    it("joinRoom gives no data", function (done) {
        milli.stub(
            milli.expectRequest(
                milli.onPost('/room/someroomid/join.json')
                    .respondWith(200)))

            .run(function () {
                campfire.joinRoom("someroomid")
                    .then(function (data) {
                        expect(data).to.be.undefined;
                    })
                    .done(done, done);
            });
    });

    it("leaveRoom gives no data", function (done) {
        milli.stub(
            milli.expectRequest(
                milli.onPost('/room/someroomid/leave.json')
                    .respondWith(200)))

            .run(function () {
                campfire.leaveRoom("someroomid")
                    .then(function (data) {
                        expect(data).to.be.undefined;
                    })
                    .done(done, done);
            });
    });

    it("getRecentMessages pulls messages array from response", function (done) {
        var entity = { messages: [
            { somefield: "somevalue" }
        ] };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/room/someroomid/recent.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getRecentMessages("someroomid")
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.messages);
                    })
                    .done(done, done);
            });
    });

    it("getTranscript requests messages for the day indicated by the passed moment", function (done) {
        var entity = { messages: [
                { somefield: "somevalue" }
            ] },
            date = moment("2014-09-29T20:56:00Z");

        milli.stub(
            milli.expectRequest(
                milli.onGet('/room/someroomid/transcript/2014/9/29.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getTranscript("someroomid", date)
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.messages);
                    })
                    .catch(done)
                    .done(function () {
                        done();
                    });
            });
    });

    it("getUpload requests the upload for the specified message id", function (done) {
        var entity = {
            upload: { somefield: "somevalue" }
        };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/room/someroomid/messages/1234/upload.json')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.getUpload("someroomid", 1234)
                    .then(function (data) {
                        expect(data).to.deep.equal(entity.upload);
                    })
                    .done(function () {
                        done();
                    }, done);
            });
    });

    it("search pulls only those messages with matching room id from response", function (done) {
        var entity = { messages: [
            { room_id: 1234, somefield: "anothervalue" },
            { room_id: 4567, somefield: "somevalue" },
            { room_id: 890, somefield: "yetanothervalue" }
        ] };

        milli.stub(
            milli.expectRequest(
                milli.onGet('/search')
                    .respondWith(200)
                    .body(entity)
                    .contentType("application/json")))

            .run(function () {
                campfire.search(4567, "someterm")
                    .then(function (data) {
                        expect(data[0]).to.deep.equal(entity.messages[1]);
                        expect(data.length).to.equal(1);
                    })
                    .done(done, done);
            });
    });

    it("search pulls only those messages with matching room id from response", function (done) {
        milli.stub(
            milli.expectRequest(
                milli.onGet('/search')
                    .param("q", "myterm")
                    .param("format", "json")
                    .respondWith(200)
                    .body({ messages: [] })
                    .contentType("application/json")))

            .run(function () {
                campfire.search(4567, "myterm")
                    .then(function (data) {
                        expect(data).to.be.empty;
                    })
                    .done(done, done);
            });
    });
});

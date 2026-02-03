/* jshint expr:true */
var chai = require('chai'),
    when = require('when'),
    expect = chai.expect,
    streams = require('memory-streams'),
    Printer = require('../lib/streamfire/printer'),
    moment = require('moment');

moment.locale('en-GB');

describe("printer", function () {

    var dummyCreatedAt = "2014-09-21T21:28:00Z";

    function dummyUserRegistry(users) {
        return {
            getUser: function (userId) {
                return {
                    then: function (f) {
                        return when.resolve(
                            f(users[userId])
                        );
                    }
                };
            }
        };
    }

    it("prints a single line message with user's name", function () {

        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream
            });

        p.printMessage({
            type: "TextMessage",
            created_at: dummyCreatedAt,
            user_id: "user1",
            body: "My message"
        });

        expect(dummyStream.toString()).to.contain("My message\n");
        expect(dummyStream.toString()).to.contain("some user");
    });

    it("prints a multi-line message with user's name once", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream
            });

        p.printMessage({
            type: "TextMessage",
            created_at: dummyCreatedAt,
            user_id: "user1",
            body: "line1\nline2\nline3\n"
        });

        expect(dummyStream.toString()).to.contain("line1\nline2\nline3\n");
        expect(dummyStream.toString().match(/some user/g).length).to.equal(1);
    });

    it("timestamps each message according to locale", function (done) {
        var users = dummyUserRegistry({ user1: { name: "some user" }}),
            createdAt = moment().subtract(1, 'days').hour(22).minute(0).second(0).toISOString(),
            message = { type: "TextMessage", user_id: "user1", body: "some message", created_at: createdAt };

        var enGBStream, deDEStream, enGBPrinter, deDEPrinter;

        enGBStream = new streams.WritableStream();
        enGBPrinter = new Printer({
            userRegistry: users,
            out: enGBStream,
            locale: "en-GB"
        });

        enGBPrinter.printMessage(message)
            .then(function () {
                expect(enGBStream.toString()).to.contain("Yesterday at 22:00");
                return when.resolve();
            })
            .then(function () {
                deDEStream = new streams.WritableStream();
                deDEPrinter = new Printer({
                    userRegistry: users,
                    out: deDEStream,
                    locale: "de-DE"
                });

                return deDEPrinter.printMessage(message);
            })
            .then(function () {
                expect(deDEStream.toString()).to.contain("Gestern um 22:00 Uhr");
                done();
            })
            .done();
    });

    it("default locale is en-GB", function () {
        var users = dummyUserRegistry({ user1: { name: "some user" }}),
            createdAt = moment().subtract(1, 'days').hour(22).minute(0).second(0).toISOString(),
            message = { type: "TextMessage", user_id: "user1", body: "some message", created_at: createdAt };

        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: users,
                out: dummyStream
            });

        p.printMessage(message);
        expect(dummyStream.toString()).to.contain("Yesterday at 22:00");
    });

    it("ignores any message with unsupported type", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream
            });

        p.printMessage({ type: "Bollox", user_id: "user1", body: "some message" });

        expect(dummyStream.toString()).to.equal("");
    });

    it("prints user's name as '?' if unknown", function () {

        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({}),
                out: dummyStream
            });

        p.printMessage({
            type: "TextMessage",
            created_at: dummyCreatedAt,
            user_id: "user1",
            body: "My message"
        });

        expect(dummyStream.toString()).to.match(new RegExp("^"));
    });

    it("ignores 'left room' message if config leaveEnterMessages flag false", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream,
                showEnterLeaveMessages: false
            });

        p.printMessage({ type: "LeaveMessage", user_id: "user1", body: "the message" });

        expect(dummyStream.toString()).to.equal("");
    });

    it("prints 'left room' message if config leaveEnterMessages flag true", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream,
                showEnterLeaveMessages: true
            });

        p.printMessage({ type: "LeaveMessage", user_id: "user1", body: "the message" });

        expect(dummyStream.toString()).to.contain("Left room.");
    });

    it("prints 'left room' message if config leaveEnterMessages missing", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream
            });

        p.printMessage({ type: "LeaveMessage", user_id: "user1", body: "the message" });

        expect(dummyStream.toString()).to.contain("Left room.");
    });

    it("ignores 'entered room' message if config leaveEnterMessages flag false", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream,
                showEnterLeaveMessages: false
            });

        p.printMessage({ type: "EnterMessage", user_id: "user1", body: "the message" });

        expect(dummyStream.toString()).to.equal("");
    });

    it("prints 'entered room' message if config leaveEnterMessages flag true", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream,
                showEnterLeaveMessages: true
            });

        p.printMessage({ type: "EnterMessage", user_id: "user1", body: "the message" });

        expect(dummyStream.toString()).to.contain("Entered room.");
    });

    it("prints 'entered room' message if config leaveEnterMessages missing", function () {
        var dummyStream = new streams.WritableStream(),
            p = new Printer({
                userRegistry: dummyUserRegistry({ user1: { name: "some user" }}),
                out: dummyStream
            });

        p.printMessage({ type: "EnterMessage", user_id: "user1", body: "the message" });

        expect(dummyStream.toString()).to.contain("Entered room.");
    });
});

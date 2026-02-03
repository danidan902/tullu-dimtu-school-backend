/* jshint expr:true */
var chai = require('chai'),
    when = require('when'),
    expect = chai.expect,
    sinon = require('sinon'),
    nn = require('node-notifier'),
    Notifier = require('../lib/streamfire/notifier'),
    os = require('os'),
    fs = require('fs'),
    wrench = require('wrench'),
    workingDir = os.tmpdir() + "/streamfire-test/";

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

function dummyCampfire() {
    return {
        downloadAvatarFor: sinon.stub().returns({
            then: function (f) {
                return when.resolve(
                    f("somepath")
                );
            }
        })
    };
}

describe("notifier", function () {
    before(function () {
        wrench.rmdirSyncRecursive(workingDir, { forceDelete: true });
    });

    after(function () {
        wrench.rmdirSyncRecursive(workingDir, { forceDelete: true });
    });

    it("does not notify if the user does not have an alerts section in config", function (done) {
        var notifier = new Notifier({
            campfire: {},
            userRegistry: {},
            workingDir: workingDir
        });

        notifier.notify({ type: "TextMessage", body: "somebody" })
            .then(done);
    });

    it("does not notify if the user's alerts do not match the body of the message", function (done) {
        var notifier = new Notifier({
            campfire: {},
            userRegistry: {},
            alertOn: [ /bollox/i ],
            workingDir: workingDir
        });

        notifier.notify({ type: "TextMessage", body: "somebody" })
            .then(done);
    });

    it("does not notify if the message is not a TextMessage or PasteMessage", function (done) {
        var notifier = new Notifier({
            campfire: {},
            userRegistry: {},
            alertOn: [ /something/i ],
            workingDir: workingDir
        });

        notifier.notify({ type: "BolloxMessage", body: "something" })
            .then(done);
    });

    it("notifies if the message a TextMessage or PasteMessage with a body that matches a user alert", function (done) {
        var notifier = new Notifier({
            campfire: dummyCampfire(),
            userRegistry: dummyUserRegistry({ user1: { name: "user1" } }),
            alertOn: [ /something/i ],
            workingDir: workingDir
        });

        nn.notify = sinon.stub();

        notifier.notify({ type: "TextMessage", body: "something", user_id: "user1" })
            .then(function () {
                expect(nn.notify.calledOnce).to.be.true;
                done();
            })
            .done();
    });

    it("does not try to download an avatar if one already exists for the user on disk", function (done) {
        var notifier = new Notifier({
            userRegistry: dummyUserRegistry({ user1: { id: "user1", name: "user1" } }),
            alertOn: [ /something/i ],
            workingDir: workingDir
        });

        fs.mkdirSync(workingDir);
        fs.appendFileSync(workingDir + "user1.png", "something");

        nn.notify = sinon.stub();

        notifier.notify({ type: "TextMessage", body: "something", user_id: "user1" })
            .then(function () {
                expect(nn.notify.calledOnce).to.be.true;
                done();
            })
            .done();
    });
});

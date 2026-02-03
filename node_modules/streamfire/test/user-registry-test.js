/* jshint expr:true */
var chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    UserRegistry = require('../lib/streamfire/user-registry'),
    when = require('when');

describe("user registry", function () {
    it("will retrieve a user from campfire if it does not exist in the registry", function (done) {
        var campfire = {
                getUser: sinon.stub().returns({
                    then: function (f) {
                        return when.resolve(f({ user_id: 1234 }));
                    }
                })
            },
            userRegistry = new UserRegistry({ campfire: campfire });

        userRegistry.getUser(1234)
            .then(function (user) {
                expect(user.user_id).to.equal(1234);
                return userRegistry.getUser(1234);
            })
            .then(function (user) {
                expect(user.user_id).to.equal(1234);
                expect(campfire.getUser.callCount).to.equal(1);
                done();
            });
    });

    it("can return all users with names starting with a specified string", function (done) {
        var stub = sinon.stub();
        stub.onCall(0).returns({
            then: function (f) {
                return when.resolve(f({ name: "user1", user_id: 1 }));
            }
        });

        stub.onCall(1).returns({
            then: function (f) {
                return when.resolve(f({ name: "bollox", user_id: 2 }));
            }
        });

        stub.returns({
            then: function (f) {
                return when.resolve(f({ name: "user2", user_id: 3 }));
            }
        });

        var campfire = {
                getUser: stub
            },
            userRegistry = new UserRegistry({ campfire: campfire });

        userRegistry.getUser(1)
            .then(function () { return userRegistry.getUser(2); })
            .then(function () { return userRegistry.getUser(3); })
            .then(function () {
                var results = userRegistry.search("use");

                expect(results).to.have.length(2);
                expect(results[0].name).to.equal("user1");
                expect(results[1].name).to.equal("user2");
                done();
            });
    });
});

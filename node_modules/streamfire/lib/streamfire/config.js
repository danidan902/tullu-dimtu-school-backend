var _ = require('lodash');

exports.loadConfig = function () {
    var fs = require('fs'),
        homeDir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE,
        configFile = homeDir + "/.streamfire/config.json";

    function ensureValid(config) {
        if (!config.domain) {
            throw new Error("Configuration: A domain must be specified.");
        }

        if (!config.apiToken) {
            throw new Error("Configuration: An apiToken must be specified.");
        }

        if (config.alertOn && !_.isArray(config.alertOn)) {
            throw new Error("Configuration: alertOn must be an array.");
        }

        if (config.rooms && !_.isArray(config.rooms)) {
            throw new Error("Configuration: rooms must be an array.");
        }

        return config;
    }

    try {
        return ensureValid(
            JSON.parse(
                fs.readFileSync(configFile, "utf8")));

    } catch (e) {
        console.log("Could not load configuration from file '" + configFile + "'.");
        console.error(e);
        process.exit(1);
    }
};

const fs = require('fs');
const yaml = require('js-yaml');
const config = require('../config/default-config');
const fsUtils = require('../../commons/util/file-utils');

module.exports = {
    initalizeConfigContext: function(cliContext) {
        let configContext = new this.CcnfigContext();

        configContext.devConfig = yaml.safeLoad(fs.readFileSync(config.defaultConfig.devConfigFilePath, 'utf8'));

        configContext.workspaceConfig = yaml.safeLoad(fs.readFileSync(config.defaultConfig.workspaceConfigFilePath, 'utf8'));

        return configContext;
    },

    scanConfigContextEnv: function(cliContext) {
        let configContextEnv = new this.ConfigContextEnv();

        configContextEnv.devConfigFilesExists = fsUtils.isFileSync(config.defaultConfig.devConfigFilePath);
        configContextEnv.workspaceConfigFilesExists = fsUtils.isFileSync(config.defaultConfig.workspaceConfigFilePath);

        return configContextEnv;
    },

    initConfigContextFromResources: function(cliContext) {

    },

    initConfigContextFromUser: function(cliContext) {

    },

    CcnfigContext: class {
    },

    ConfigContextEnv: class {
    }
}
const fs = require('fs');
const config = require('../config/default-config');
const configContextBuilder = require('./config-context-builder');
const runtimeContextBuilder = require('./runtime-context-builder');

module.exports = {
    initalizeCliContext: function() {
        let cliContext = new this.CliContext();

        cliContext.contexts = new this.CliContextEntries();

        cliContext.envs = this.scanCliEnv();

        cliContext.contexts.configContext = configContextBuilder.initalizeConfigContext(cliContext);
        cliContext.contexts.runtimeContext = runtimeContextBuilder.initializeRuntimeContext(cliContext);

        console.log("\n\ninitalizeCliContext:  " + JSON.stringify(cliContext, null, 4));

        try {
            fs.writeFileSync(config.defaultConfig.tempCliContextCache.cacheFilePath, JSON.stringify(cliContext, null, 2), 'utf8');
        } catch (e) {
            // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
            // But need to log a warning.
            console.log("Warning.  Error trying to write Clic Context cache to file:  '" + config.defaultConfig.tempCliContextCache.cacheFilePath + "'.  .  Error:  '" + e + "'");
            return null;
        }

        return cliContext;
    },

    scanCliEnv: function(cliContext) {
        let cliEnv = new this.CliContextEnv();

        cliEnv.configEnv = configContextBuilder.scanConfigContextEnv(cliContext);
        cliEnv.runtimeEnv = runtimeContextBuilder.scanRuntimeContextEnv(cliContext);

        return cliEnv;
    },

    CliContext: class {
    },

    CliContextEntries: class {

    },

    CliContextEnv: class {
    }
}
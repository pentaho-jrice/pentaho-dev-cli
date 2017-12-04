const fs = require('fs');
const moment = require('moment');
const config = require('../config/default-config');
const fsUtils = require('../../commons/util/file-utils');

module.exports = {
    initializeRuntimeContext: function(cliContext) {
        let runtimeContext = new this.RuntimeContext();

        if (cliContext.envs.runtimeEnv == null) {
            // TODO add error handling.  If RuntimeEnv is null for any reason, exit script
        }

        let localAppRuntimeEnv = cliContext.envs.runtimeEnv.localAppRuntime;

        if (localAppRuntimeEnv != null && !localAppRuntimeEnv.cacheBuildIsNeeded) {
            runtimeContext.localAppsContext = loadLocalAppsContextFromCache(cliContext, runtimeContext, localAppRuntimeEnv);
        } else {
            runtimeContext.localAppsContext = buildLocalAppsContext(cliContext, runtimeContext, localAppRuntimeEnv);
        }

        let localGitProjectRuntime = cliContext.envs.runtimeEnv.localGitProjectRuntime;

        if (localGitProjectRuntime != null && !localGitProjectRuntime.cacheBuildIsNeeded) {
            runtimeContext.localGitProjectsContext = loadLocalGitProjectsContextFromCache(cliContext, runtimeContext, localGitProjectRuntime);
        } else {
            runtimeContext.localGitProjectsContext = buildLocalGitProjectsContext(cliContext, runtimeContext, localGitProjectRuntime);
        }


        let remoteBuildAppRuntime = cliContext.envs.runtimeEnv.remoteBuildAppRuntime;

        if (remoteBuildAppRuntime != null && !remoteBuildAppRuntime.cacheBuildIsNeeded) {
            runtimeContext.remoteBuildVersionsContext = loadRemoteBuildAppsContextFromCache(cliContext, runtimeContext, remoteBuildAppRuntime);
        } else {
            runtimeContext.remoteBuildVersionsContext = buildRemoteBuildAppsContext(cliContext, runtimeContext, remoteBuildAppRuntime);
        }


        let remoteBuildVersionRuntime = cliContext.envs.runtimeEnv.remoteBuildVersionRuntime;

        if (remoteBuildVersionRuntime != null && !remoteBuildVersionRuntime.cacheBuildIsNeeded) {
            runtimeContext.remoteBuildAppsContext = loadRemoteBuildVersionContextFromCache(cliContext, runtimeContext, remoteBuildVersionRuntime);
        } else {
            runtimeContext.remoteBuildAppsContext = buildRemoteBuildVersionsContext(cliContext, runtimeContext, remoteBuildVersionRuntime);
        }

        return runtimeContext;
    },

    scanRuntimeContextEnv: function(cliContext) {
        let runtimeContextEnv = new this.RuntimeContextEnv();

        runtimeContextEnv.localAppRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.localAppRuntimeCache);
        runtimeContextEnv.localGitProjectRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.localGitProjectRuntimeCache);
        runtimeContextEnv.remoteBuildAppRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.remoteBuildAppRuntimeCache);
        runtimeContextEnv.remoteBuildVersionRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.remoteBuildVersionsRuntimeCache);
        runtimeContextEnv.testCacheNotExist = scanRuntimeContextEnvEntry(config.defaultConfig.testCacheNotExist);

        return runtimeContextEnv;
    },

    RuntimeContext: class {
    },

    RuntimeContextEnv: class {

        getEnvsThatNeedBuild() {
            let envs = [];

            for (let key in this) {
                let envHolder = {};
                envHolder.id = key;
                envHolder.displayName = this[key].config.displayName;

                if (this[key].cacheBuildIsNeeded == null || this[key].cacheBuildIsNeeded) {
                    envs.push(key);
                }
            }

            return envs;
        }

        getEnvsThatDoNotNeedBuild() {
            let envs = [];

            for (let key in this) {
                let envHolder = {};
                envHolder.id = key;
                envHolder.displayName = this[key].config.displayName;

                if (this[key].cacheBuildIsNeeded != null && !this[key].cacheBuildIsNeeded) {
                    envs.push(key);
                }
            }

            return envs;
        }
    }
}

function scanRuntimeContextEnvEntry(cacheConfig) {
    let runtimeContextEnvEntry = new RuntimeContextEnvEntry();

    runtimeContextEnvEntry.config = cacheConfig;

    runtimeContextEnvEntry.cacheFileExists = fsUtils.isFileSync(cacheConfig.cacheFilePath);

    runtimeContextEnvEntry.cacheFilePath = cacheConfig.cacheFilePath;

    if (!runtimeContextEnvEntry.cacheFileExists) {
        runtimeContextEnvEntry.cacheBuildIsNeeded = true;

        return runtimeContextEnvEntry;
    }

    let cacheFileContents;

    try {
        cacheFileContents = JSON.parse(fs.readFileSync(cacheConfig.cacheFilePath, 'utf8'));
    } catch (e) {
        let cacheReadError = {};
        cacheReadError.errorMessage = "Error trying to read cacheFile: '" +cacheConfig.cacheFilePath + "'.  Error:  " + e;
        runtimeContextEnvEntry.cacheHasError = true;
        runtimeContextEnvEntry.cacheBuildIsNeeded = true;
        runtimeContextEnvEntry.cacheReadError = cacheReadError;

        return runtimeContextEnvEntry;
    }

    if (cacheFileContents == null ||
        cacheFileContents.cacheMeta == null ||
        cacheFileContents.cacheMeta.lastRunTimestamp == null ||
        !moment(cacheFileContents.cacheMeta.lastRunTimestamp).isValid())
    {
        runtimeContextEnvEntry.cacheBuildIsNeeded = true;
        return runtimeContextEnvEntry;
    }

    runtimeContextEnvEntry.cacheMeta = cacheFileContents.cacheMeta;

    if (runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp == null || !moment(runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp).isValid()) {
        let lastRunTimestamp = moment(runtimeContextEnvEntry.cacheMeta.lastRunTimestamp);
        runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp = lastRunTimestamp.add(cacheConfig.cacheDurationSecions, 'seconds');
    }

    if (runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp < moment()) {
        runtimeContextEnvEntry.cacheBuildIsNeeded = true;
        return runtimeContextEnvEntry;
    }

    runtimeContextEnvEntry.cacheBuildIsNeeded = false;
    return runtimeContextEnvEntry;
}

function loadLocalAppsContextFromCache (cliContext, runtimeContext, runtimeEnv) {
    let cacheFileContents;

    try {
        cacheFileContents = JSON.parse(fs.readFileSync(runtimeEnv.config.cacheFilePath, 'utf8'));
    } catch (e) {
        // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
        // But need to log a warning.
        console.log("Warning.  Error trying to parse json file:  '" + runtimeEnv.config.cacheFilePath + "'.  Error:  '" + e + "'");
        return null;
    }

    return cacheFileContents;
}

function buildLocalAppsContext(cliContext, runtimeContext, runtimeEnv) {

}

function loadLocalGitProjectsContextFromCache(cliContext, runtimeContext, runtimeEnv) {
    let cacheFileContents;

    try {
        cacheFileContents = JSON.parse(fs.readFileSync(runtimeEnv.config.cacheFilePath, 'utf8'));
    } catch (e) {
        // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
        // But need to log a warning.
        console.log("Warning.  Error trying to parse json file:  '" + runtimeEnv.config.cacheFilePath + "'.  Error:  '" + e + "'");
        return null;
    }

    return cacheFileContents;
}

function buildLocalGitProjectsContext(cliContext, runtimeContext, runtimeEnv) {

}

function loadRemoteBuildVersionContextFromCache(cliContext, runtimeContext, runtimeEnv) {
    let cacheFileContents;

    try {
        cacheFileContents = JSON.parse(fs.readFileSync(runtimeEnv.config.cacheFilePath, 'utf8'));
    } catch (e) {
        // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
        // But need to log a warning.
        console.log("Warning.  Error trying to parse json file:  '" + runtimeEnv.config.cacheFilePath + "'.  Error:  '" + e + "'");
        return null;
    }

    return cacheFileContents;
}

function buildRemoteBuildVersionsContext(cliContext, runtimeContext, runtimeEnv) {

}

function loadRemoteBuildAppsContextFromCache(cliContext, runtimeContext, runtimeEnv) {
    let cacheFileContents;

    try {
        cacheFileContents = JSON.parse(fs.readFileSync(runtimeEnv.config.cacheFilePath, 'utf8'));
    } catch (e) {
        // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
        // But need to log a warning.
        console.log("Warning.  Error trying to parse json file:  '" + runtimeEnv.config.cacheFilePath + "'.  Error:  '" + e + "'");
        return null;
    }

    return cacheFileContents;
}

function buildRemoteBuildAppsContext(cliContext, runtimeContext, runtimeEnv) {

}

class RuntimeContextEnvEntry {
}
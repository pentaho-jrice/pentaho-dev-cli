const fs = require('fs');
const moment = require('moment');
const request = require('request');
const cheerio = require('cheerio');
var Stopwatch = require("node-stopwatch").Stopwatch;

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
            runtimeContext.remoteBuildAppsContext = loadRemoteBuildAppsContextFromCache(cliContext, runtimeContext, remoteBuildAppRuntime);
        } else {
            runtimeContext.remoteBuildAppsContext = buildRemoteBuildAppsContext(cliContext, runtimeContext, remoteBuildAppRuntime);
        }


        let remoteBuildVersionRuntime = cliContext.envs.runtimeEnv.remoteBuildVersionRuntime;

        if (remoteBuildVersionRuntime != null && !remoteBuildVersionRuntime.cacheBuildIsNeeded) {
            runtimeContext.remoteBuildVersionsContext = loadRemoteBuildVersionContextFromCache(cliContext, runtimeContext, remoteBuildVersionRuntime);
        } else {
            runtimeContext.remoteBuildVersionsContext = buildRemoteBuildVersionsContext(cliContext, runtimeContext, remoteBuildVersionRuntime);
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
        runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp = lastRunTimestamp.add(cacheConfig.cacheDurationSeconds, 'seconds');
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
    let stopwatch = Stopwatch.create();
    let buildVersionsRuntimeContext = new BuildVersionsRuntimeContext();
    let cacheMeta = startBuildContext(stopwatch, config.defaultConfig.remoteBuildVersionsRuntimeCache);

    // html = fs.readFileSync("/home/vagrant/git/pentaho-dev-cli/resources/sample-response-files/pentaho-build-versions-page-response.html");
    // buildJavaScriptFile(buildVersionsRuntimeContext, html);

     request(config.defaultConfig.appDownloadSites.pentahoBuild.url, function(error, response, html){
         if(!error){
             buildJavaScriptFile(buildVersionsRuntimeContext, html);
         }
     });

    stopBuildContext(cacheMeta, stopwatch, config.defaultConfig.remoteBuildVersionsRuntimeCache);

    buildVersionsRuntimeContext.cacheMeta = cacheMeta;

    return buildVersionsRuntimeContext;
}

function buildJavaScriptFile(buildVersionsRuntimeContext, html) {
    let majorVersions = [];

    let $ = cheerio.load(html);

    $('tr').each(function(i, element){
        let appsPageUrl = $(this).find("td").eq(1).find("a").attr("href");
        let versionString = $(this).find("td").eq(1).find("a").text();
        let lasModifiedDate = $(this).find("td").eq(2).text();

        if (appsPageUrl != null && versionString != "Parent Directory") {
            let majorVersion = new MajorVersion();

            majorVersion.versionInfo = {}
            majorVersion.versionInfo.versionString = versionString;

            majorVersion.urls = {}
            majorVersion.urls.buildSiteUrl = config.defaultConfig.appDownloadSites.pentahoBuild.url + appsPageUrl;

            majorVersion.lastModifiedDate = lasModifiedDate;

            majorVersions.push(majorVersion)
        }
    });

    buildVersionsRuntimeContext.majorVersions = majorVersions;
}

class CacheMeta {

}

class BuildVersionsRuntimeContext {

}

class MajorVersion {

}

function startBuildContext(stopwatch, runtimeCache) {
    cacheMeta = new CacheMeta();

    stopwatch.start();

    return cacheMeta;
}

function stopBuildContext(cacheMeta, stopwatch, runtimeCache) {
    stopwatch.stop();

    cacheMeta.lastRunTimestamp = moment();
    cacheMeta.lastRunDurationMilis = stopwatch.elapsedMilliseconds;
    cacheMeta.lastRunDurationDisplay = stopwatch.elapsed.seconds + " seconds";
    cacheMeta.nextScheduledRunTimestamp = cacheMeta.lastRunTimestamp.add(runtimeCache.cacheDurationSeconds, 'seconds');

    return cacheMeta;
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
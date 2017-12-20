const fs = require('fs');
const moment = require('moment');
const requestSync = require('sync-request');
const cheerio = require('cheerio');
const Stopwatch = require("node-stopwatch").Stopwatch;

const logger = require("../util/logger")
const pcliUtils = require("../util/pcliUtils");


const config = require('../config/default-config');
const fsUtils = require('../../commons/util/file-utils');

module.exports = {
    initializeRuntimeContext: function (cliContext) {
        let runtimeContext = new this.RuntimeContext();

        if (cliContext.envs.runtimeEnv == null) {
            // TODO add error handling.  If RuntimeEnv is null for any reason, exit script
        }

        let remoteBuildVersionRuntime = cliContext.envs.runtimeEnv.remoteBuildVersionRuntime;

        if (remoteBuildVersionRuntime != null && !remoteBuildVersionRuntime.cacheBuildIsNeeded) {
            runtimeContext.remoteBuildVersionsContext = loadRemoteBuildVersionContextFromCache(cliContext, runtimeContext, remoteBuildVersionRuntime);
        } else {
            runtimeContext.remoteBuildVersionsContext = buildRemoteBuildVersionsContext(cliContext, runtimeContext, remoteBuildVersionRuntime);
        }

        let remoteBuildAppRuntime = cliContext.envs.runtimeEnv.remoteBuildAppRuntime;

        if (remoteBuildAppRuntime != null && !remoteBuildAppRuntime.cacheBuildIsNeeded) {
            runtimeContext.remoteBuildAppsContext = loadRemoteBuildAppsContextFromCache(cliContext, runtimeContext, remoteBuildAppRuntime);
        } else {
            runtimeContext.remoteBuildAppsContext = buildRemoteBuildAppsContext(cliContext, runtimeContext, remoteBuildAppRuntime);
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

        return runtimeContext;
    },

    scanRuntimeContextEnv: function (cliContext) {
        let runtimeContextEnv = new this.RuntimeContextEnv();

        runtimeContextEnv.localAppRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.localAppRuntimeCache);
        runtimeContextEnv.localGitProjectRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.localGitProjectRuntimeCache);
        runtimeContextEnv.remoteBuildAppRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.remoteBuildAppRuntimeCache);
        runtimeContextEnv.remoteBuildVersionRuntime = scanRuntimeContextEnvEntry(config.defaultConfig.remoteBuildVersionsRuntimeCache);
        // runtimeContextEnv.testCacheNotExist = scanRuntimeContextEnvEntry(config.defaultConfig.testCacheNotExist);

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
        cacheReadError.errorMessage = "Error trying to read cacheFile: '" + cacheConfig.cacheFilePath + "'.  Error:  " + e;
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

    if (runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp == null ||
        !moment(runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp).isValid())
    {
        let lastRunTimestamp = moment(runtimeContextEnvEntry.cacheMeta.lastRunTimestamp);
        runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp = lastRunTimestamp.add(cacheConfig.cacheDurationSeconds, 'seconds');
    }

    if (moment(runtimeContextEnvEntry.cacheMeta.nextScheduledRunTimestamp) < moment()) {
        runtimeContextEnvEntry.cacheBuildIsNeeded = true;
        return runtimeContextEnvEntry;
    }

    runtimeContextEnvEntry.cacheBuildIsNeeded = false;
    return runtimeContextEnvEntry;
}

function loadLocalAppsContextFromCache(cliContext, runtimeContext, runtimeEnv) {
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
    logger.logBanner("Building Local App Context...");
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
    logger.logBanner("Building Git Projects Context...");

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
     logger.logBanner("Building Remote Build Versions Context...");

    let stopwatch = Stopwatch.create();
    let buildVersionsRuntimeContext = new BuildVersionsRuntimeContext();
    let cacheMeta = startBuildContext(stopwatch, config.defaultConfig.remoteBuildVersionsRuntimeCache);

    // html = fs.readFileSync("/home/vagrant/git/pentaho-dev-cli/resources/sample-response-files/pentaho-build-versions-page-response.html");
    // let $ = cheerio.load(html);
    // parseBuildVersionsHtml(buildVersionsRuntimeContext, $);
    // console.log("\n\n\n:  html from file:  " + html + "\n\n\n");

    try {
        let res =  requestSync('GET',config.defaultConfig.appDownloadSites.pentahoBuild.url);

        let html = res.getBody();

        buildVersionsRuntimeContext.majorVersions = parseBuildVersionsHtml(buildVersionsRuntimeContext, html);
    } catch (e) {
        // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
        // But need to log a warning.
        console.log("Warning.  Error trying to parse Remote Build Version url:  '" + config.defaultConfig.appDownloadSites.pentahoBuild.url + "'.  Error:  '" + e + "'");
        return null;
    }

    stopBuildContext(cacheMeta, stopwatch, config.defaultConfig.remoteBuildVersionsRuntimeCache);

    buildVersionsRuntimeContext.cacheMeta = cacheMeta;

     try {
         fs.writeFileSync(runtimeEnv.config.cacheFilePath, JSON.stringify(buildVersionsRuntimeContext, null, 4), 'utf8');
     } catch (e) {
         // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
         // But need to log a warning.
         console.log("Warning.  Error trying to write Femote Builder Versions JSON cache to file:  '" + runtimeEnv.config.cacheFilePath + "'.  .  Error:  '" + e + "'");
         return null;
     }

    return buildVersionsRuntimeContext;
}

function parseBuildVersionsHtml(buildVersionsRuntimeContext, html) {
    let majorVersions = [];

    let $ = cheerio.load(html);

    $('tr').each(function (i, element) {
        let appsPageUrl = $(this).find("td").eq(1).find("a").attr("href");
        let versionString = $(this).find("td").eq(1).find("a").text();
        let lasModifiedDate = $(this).find("td").eq(2).text();

        if (appsPageUrl != null && versionString != "Parent Directory") {
            let majorVersion = new MajorVersion();

            versionString = versionString.replace('/','');

            majorVersion.versionInfo = pcliUtils.parseMajorVersionString(versionString);
            // majorVersion.versionInfo.versionString = versionString;

            majorVersion.urls = {}
            majorVersion.urls.buildSiteUrl = config.defaultConfig.appDownloadSites.pentahoBuild.url + appsPageUrl;

            majorVersion.lastModifiedDate = lasModifiedDate;

            majorVersions.push(majorVersion);
        }
    });

    return majorVersions;
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
    logger.logBanner("Building Remote Build App Context...");

    let stopwatch = Stopwatch.create();
    let remoteBuildAppsRuntimeContext = new BuildAppsRuntimeContext();
    let remoteBuildVersionsContext = runtimeContext.remoteBuildVersionsContext;
    let cacheMeta = startBuildContext(stopwatch, config.defaultConfig.remoteBuildAppRuntimeCache);

    // html = fs.readFileSync("/git/pentaho/pentaho-dev-cli/resources/sample-response-files/pentaho-build-apps-page-response.html");
    // // html = fs.readFileSync("/home/vagrant/git/pentaho-dev-cli/resources/sample-response-files/pentaho-build-apps-page-response.html");
    // let $ = cheerio.load(html);
    // parseBuildVersionsHtml(buildVersionsRuntimeContext, $);
    // console.log("\n\n\n:  html from Remote Build Apps file:  " + html + "\n\n\n");

    let majorVersions = remoteBuildVersionsContext.majorVersions;

    remoteBuildAppsRuntimeContext.applications = [];

    for (let i = 0; i < majorVersions.length; i++) {
        let majorVersion = majorVersions[i];

        console.error("Processing " + (i + 1) + " of " + majorVersions.length + " - " + majorVersion.versionInfo.versionString);

        let application = buildRemoteAppForMajorVersion(majorVersion, cliContext, runtimeContext, remoteBuildAppsRuntimeContext, remoteBuildVersionsContext, runtimeEnv);

        remoteBuildAppsRuntimeContext.applications.push(application);
    }

    stopBuildContext(cacheMeta, stopwatch, config.defaultConfig.remoteBuildAppRuntimeCache);

    remoteBuildAppsRuntimeContext.cacheMeta = cacheMeta;

    // try {
    //     fs.writeFileSync(runtimeEnv.config.cacheFilePath, JSON.stringify(remoteBuildAppsRuntimeContext, null, 4), 'utf8');
    // } catch (e) {
    //     // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
    //     // But need to log a warning.
    //     console.log("Warning.  Error trying to write Femote Builder Versions JSON cache to file:  '" + runtimeEnv.config.cacheFilePath + "'.  .  Error:  '" + e + "'");
    //     return null;
    // }

    return remoteBuildAppsRuntimeContext;
}

function buildRemoteAppForMajorVersion(majorVersion, cliContext, runtimeContext, remoteBuildAppsRuntimeContext, remoteBuildVersionsContext, runtimeEnv) {
    let majorVersionString = majorVersion.versionInfo.versionString;
    let majorVersionUrl = majorVersion.urls.buildSiteUrl;
    let remoteApplication = new RemoteApplication();
    let appDescriptors;
    let majorVersionHolder = {};

    majorVersionHolder.versionString = majorVersionString;
    majorVersionHolder.appDescriptors = [];

    try {
        let res =  requestSync('GET',majorVersionUrl);

        let html = res.getBody();

        appDescriptors = parseBuildAppaHtml(majorVersion, runtimeContext, html);
    } catch (e) {
        // TODO add more robust error messaging.  In this case, we're going to return null so we can build a new context.
        // But need to log a warning.
        console.log("Warning.  Error trying to parse remote app url:  '" + config.defaultConfig.appDownloadSites.pentahoBuild.url + "'.  Error:  '" + e + "'");
        return null;
    }

    if (appDescriptors == null) {
        return null;
    }

    majorVersionHolder.appDescriptors = appDescriptors;
    remoteApplication.majorVersion = majorVersionHolder;

    return remoteApplication;
}

function isValidAppDownloadPage($) {
    return true;
}

function parseBuildAppaHtml(majorVersion, runtimeContext, majorVersionUrl, html) {
    let appDescriptors = [];
    let majorVersionUrl = majorVersion.urls.buildSiteUrl;

    let $ = cheerio.load(html);

    if (!isValidAppDownloadPage($)) {

    }

    let buildInfo;

    $('tr').each(function (i, element) {
        let appDescriptor = {};

        let buildNumberInfoTableHeader$ = $(this).find("th").eq(0);

        let th = $(this).find("th").eq(0).html();

        if (buildNumberInfoTableHeader$.html() != null && buildNumberInfoTableHeader$.html().length > 0) {
            buildInfo = pcliUtils.parseAppBuildInfoFromTableRow(buildNumberInfoTableHeader$);
        }

        appDescriptor.appDownloadUrl = $(this).find("td").eq(0).find("a").attr("href");
        appDescriptor.appName = $(this).find("td").eq(0).text();
        appDescriptor.os = $(this).find("td").eq(1).text();
        appDescriptor.type = $(this).find("td").eq(2).text();
        appDescriptor.size = $(this).find("td").eq(3).text();
        appDescriptor.checkSumUrl = $(this).find("td").eq(3).attr("href");

        appDescriptor.lasModifiedDate = buildInfo.lastModifiedDate;
        appDescriptor.buildNumber = buildInfo.buildNumber;
        appDescriptor.majorVersion = majorVersion;

        if (appDescriptor.appName != null && appDescriptor.appName.length > 0) {
            let appInfo;

            appInfo = pcliUtils.parseAppBuildString(appDescriptor, majorVersion, buildInfo);

            appDescriptor.appInfo = appInfo;

            if (appInfo.isReject) {
                if (runtimeContext.appRejects == null) {
                    runtimeContext.appRejects = {};
                }

                let appRejectVersion = runtimeContext.appRejects[majorVersion.versionInfo.versionString];

                if (appRejectVersion == null) {
                    appRejectVersion = {}

                    runtimeContext.appRejects[majorVersion.versionInfo.versionString] = appRejectVersion;
                }

                let appRejectVersionBuild = appRejectVersion[buildInfo.buildNumber]

                if (appRejectVersionBuild == null) {
                    appRejectVersionBuild = {}
                    appRejectVersionBuild.apps = [];

                    appRejectVersion[buildInfo.buildNumber] = appRejectVersionBuild;
                }

                appRejectVersionBuild.apps.push(appDescriptor.appName);

                // appRejectApp.appDescriptor = appDescriptor;
                // appRejectApp.buildInfo = buildInfo;
                // appRejectVersion.majorVersion = majorVersion;
            }

            appDescriptors.push(appDescriptor);
        }
    });

    return appDescriptors;
}

class RemoteApplication {

}

class RuntimeContextEnvEntry {
}

class BuildAppsRuntimeContext {

}

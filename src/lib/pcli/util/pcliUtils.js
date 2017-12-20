module.exports = {
    parseMajorVersionString: function(versionString) {
        let versionInfo = new VersionInfo();

        versionInfo.versionString = versionString;

        let splitArr = versionString.split(/-(.+)/);

        let versionParts = new VersionParts();

        versionInfo.versionParts = versionParts;

        versionParts.majorVerson = splitArr[0];

        if (splitArr.length > 1) {
            versionParts.type = splitArr[1];
        }

        return versionInfo;
    },
    
    parseAppBuildString: function(appDescriptor, majorVersion, buildInfo) {
        let appInfo = new AppInfo();
        let versionString = majorVersion.versionInfo.versionString;

        let splitAppNameByVersionArr = appDescriptor.appName.split(versionString);

        if (splitAppNameByVersionArr.length > 0) {
            console.log("\nversionString:  " + versionString + " - " + appDescriptor.appDownloadUrl);
            console.log("  AppName:  " + appDescriptor.appName);
            console.log("  splitAppNameArr:  " + splitAppNameByVersionArr);

            let splitAppDownloadUrl = appDescriptor.appDownloadUrl.split("/");
            console.log("  build number:  " + splitAppDownloadUrl[5]);

            console.log("   appName split by verson:  ");
            for (let i = 0; i < splitAppNameByVersionArr.length; i++) {
                console.log("     " + i + " - '" + splitAppNameByVersionArr[i]) + "'";
            }
        }

        if (splitAppNameByVersionArr.length < 2) {
            appInfo.isReject = true;
            appInfo.regjectReason = "Major Version Not In App Name";
            return getNameWithoutVersionString(appInfo, appDescriptor, majorVersion, buildInfo);
        } else {
            appInfo.isReject = false;
            return getNameWithVersionString(splitAppNameByVersionArr, appInfo, appDescriptor, majorVersion, buildInfo)
        }

        return appInfo;
    },

    parseAppBuildInfoFromTableRow: function($) {
        let tableRowInfo = {};

        let buildString = $.text();
        let splitArr = buildString.split("|");

        tableRowInfo.buildNumber = splitArr[0].trim().replace("Build ", "");
        tableRowInfo.lastModifiedDate = splitArr[1].trim();

        return tableRowInfo;
    },

    initRemoteAppsStats: function() {
        let runtimeStats = {}

        runtimeStats.totalMajorVersions = 0;
        runtimeStats.totalApps = 0;
        runtimeStats.totalBuildNumbers = 0;
        runtimeStats.numberOfRejectedApps = 0;
        runtimeStats.numberOfAccptedApps = 0;

        runtimeStats.majorVersionStatus = {};
        runtimeStats.buildNumberStats = {};

        return runtimeStats;
    }
}

function getNameWithVersionString(splitAppNameByVersionArr, appInfo, appDescriptor, majorVersion, buildInfo) {
    appInfo.id = appDescriptor.appName;

    if (splitAppNameByVersionArr != null &&
        (splitAppNameByVersionArr[1] == null || splitAppNameByVersionArr[1].trim() == ""))
    {
        appInfo.id = splitAppNameByVersionArr[0].replace(/(^-)|(-$)/g, "");

        // appInfo.processType = "NoTrailing";
        console.log("  ----> no trailing..." + appDescriptor.appName + " - " + splitAppNameByVersionArr[1] + appInfo.id);
    }

    return appInfo;
}

function getNameWithoutVersionString(appInfo, appDescriptor, majorVersion, buildInfo) {
    appInfo.id = appDescriptor.appName;

    return  appInfo;
}

class VersionInfo {

}
class VersionParts {

}
class AppInfo {

}

const os = require('os');

module.exports = {
    defaultConfig: {
        "userPentahoHomeDir": os.homedir + "/.pentaho",
        "userPentahoDevHomeDir": os.homedir + "/.pentaho/dev",
        "userPentahoCliHomeDir": os.homedir + "/.pentaho/dev/cli",
        "userPentahoCliCacheHomeDir": os.homedir + "/.pentaho/dev/cli/.cache",
        "devConfigFileName": "dev-config.yml",
        "devConfigFilePath": os.homedir + "/.pentaho/dev/cli/dev-config.yml",
        "workspaceConfigFilePath": os.homedir + "/.pentaho/dev/cli/workspace-config.yml",
        "localAppRuntimeCache" : {
            "displayName": "Local Apps",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/local-app-runtime-cache.json",
            "cacheDurationSecions": 28800
        },
        "localGitProjectRuntimeCache" : {
            "displayName": "Local Git Projects",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/local-git-project-runtime-cache.json",
            "cacheDurationSecions": 28800
        },
        "remoteBuildAppRuntimeCache" : {
            "displayName": "Remote Build Apps",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/remote-build-apps-runtime-cache.json",
            "cacheDurationSecions": 14400
        },
        "remoteBuildVersionsRuntimeCache" : {
            "displayName": "Remote Build Versions",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/remote-build-versions-runtime-cache.json",
            "cacheDurationSecions": 14400
        },
        "testCacheNotExist" : {
            "displayName": "Remote Build Versions",
            "cacheFilePath": os.homedir + "c:\filedoes\notexist",
            "cacheDurationSecions": 14400
        },
        "appDownloadSites": {
            "build.pentaho": {
                "url": "http://build.pentaho.com/hosted/"
            }
        }
    }
}

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
            "cacheDurationSeconds": 28800
        },
        "localGitProjectRuntimeCache" : {
            "displayName": "Local Git Projects",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/local-git-project-runtime-cache.json",
            "cacheDurationSeconds": 28800
        },
        "remoteBuildAppRuntimeCache" : {
            "displayName": "Remote Build Apps",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/remote-build-apps-runtime-cache.json",
            "cacheDurationSeconds": 14400
        },
        "remoteBuildVersionsRuntimeCache" : {
            "displayName": "Remote Build Versions",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/remote-build-versions-runtime-cache.json",
            "cacheDurationSeconds": 14400
        },
        "tempCliContextCache" : {
            "displayName": "Remote Build Versions",
            "cacheFilePath": os.homedir + "/.pentaho/dev/cli/.cache/cli-context-runtime-cache.json",
            "cacheDurationSeconds": 14400
        },
        "appDownloadSites": {
            "pentahoBuild": {
                "url": "http://build.pentaho.com/hosted/"
            }
        }
    }
}

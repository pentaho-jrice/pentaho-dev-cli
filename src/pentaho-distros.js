const config = require('./lib/pcli/config/default-config');
const cliContextBuilder = require('./lib/pcli/core/cli-context-builder');
const promptUtils = require('./lib/pcli/util/promptUtils');
const pcliUtils = require("./lib/pcli/util/pcliUtils");

// const cliContext = cliContextBuilder.initalizeCliContext();
//
// let majorVersions = cliContext.contexts.runtimeContext.remoteBuildVersionsContext.majorVersions;

// let majorVersion = promptUtils.buildChoicePrompt(majorVersions, "versionInfo.versionString", "Choose Version #", "Version #")

let testVersionStringArr = [
    {
        majorVersionString: "8.1.0.0-TEST-TIAMAT",
        appBuildString1: "pad-ee-8.1.0.0-TEST-TIAMAT-227",
        appBuildString2: "pdd-plugin-ee-8.1.0.0-TEST-TIAMAT-227",
        appBuildString3: "pdd-plugin-ee-8.1.0.0-TEST-TIAMAT-227-dist"
    },
    {
        majorVersionString: "8.0.0.0",
        appBuildString1: "pad-ce-8.0.0.0-28",
        appBuildString2: "pdd-plugin-ee-8.0.0.0-28",
        appBuildString3: "pdd-plugin-ee-8.0.0.0-28-dist"
    },
    {
        majorVersionString: "8.1-SNAPSHOT",
        appBuildString1: "biserver-ee-upgrade-8.1-SNAPSHOT",
        appBuildString2: "pentaho-big-data-ee-cdh512-package-8.1-SNAPSHOT",
        appBuildString3: "paz-plugin-ee-8.1-SNAPSHOT-dist"
    },
    {
        majorVersionString: "8.1.0-TEST",
        appBuildString1: "pentaho-big-data-ee-cdh512-package-81.2018.04.00-TEST-ENLIL-19-dist",
        appBuildString2: "pentaho-big-data-plugin-samples-8.1.0-TEST-ENLIL-19",
        appBuildString3: "pdd-plugin-ee-8.1.0-TEST-ENLIL-19-dist"
    },
    {
        majorVersionString: "8.1.0.0-SNAPSHOT",
        appBuildString1: "paz-plugin-ee-8.1.0.0-SNAPSHOT-dist",
        appBuildString2: "pentaho-big-data-ee-cdh512-package-8.1.0.0-SNAPSHOT",
        appBuildString3: "pentaho-hadoop-shims-emr56-scope-default-assembly-8.1.0.0-SNAPSHOT"
    },
    {
        majorVersionString: "7.1-QAT",
        appBuildString1: "SP201712-7.1-QAT-585-Linux",
        appBuildString2: "SP201712-7.1-QAT-585-Mac",
        appBuildString3: "pdi-wekaforecasting-spoon-plugin-ee-7.1-QAT-585-deploy-dist"
    },
    {
        majorVersionString: "7.1.0.7",
        appBuildString1: "pentaho-business-analytics-7.1.0.7-78-x64",
        appBuildString2: "pentaho-business-analytics-7.1.0.7-78-x64.app",
        appBuildString3: "prd-ee-7.1.0.7-78"
    }
]

for (let i = 0; i < testVersionStringArr.length; i++) {
    let testVersionString = testVersionStringArr[i];

    console.log("\nResults of version: '" + testVersionString.majorVersionString + "'");
    let versionInfo = pcliUtils.parseMajorVersionString(testVersionString.majorVersionString);
    console.log("  App Build 1 :  " + JSON.stringify(pcliUtils.parseAppBuildString(testVersionString.appBuildString1, versionInfo)))
    console.log("  App Build 2 :  " + JSON.stringify(pcliUtils.parseAppBuildString(testVersionString.appBuildString2, versionInfo)))
    console.log("  App Build 3 :  " + JSON.stringify(pcliUtils.parseAppBuildString(testVersionString.appBuildString3, versionInfo)))
}
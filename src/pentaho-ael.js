#!/usr/bin/env node

const config = require('./lib/pcli/config/default-config');
const cliContextBuilder = require('./lib/pcli/core/cli-context-builder');
const fs = require('fs');
const yaml = require('js-yaml');

const cliContext = cliContextBuilder.initalizeCliContext();

// try {
//     var configFileDoc = yaml.safeLoad(fs.readFileSync(config.defaultConfig.devConfigFilePath, 'utf8'));
//     console.log(configFileDoc);
// } catch (e) {
//     console.log(e);
// }
//
// console.log("\n\n");
//
// try {
//     var remoteBuildAppRuntimeCacheDoc = JSON.parse(fs.readFileSync(config.defaultConfig.remoteBuildAppRuntimeCacheFilePath, 'utf8'));
//     console.log(JSON.stringify(remoteBuildAppRuntimeCacheDoc, null, 2));
// } catch (e) {
//     console.log(e);
// }
//
// class CacheMeta {
// }
//
// class RemoteBuildAppRuntime {
// }
//
// let remoteBuildAppRuntime = new RemoteBuildAppRuntime();
//
// let cache = new CacheMeta();
//
// cache.lastRunTimeStamp = new Date();
//
// remoteBuildAppRuntime.cacheMeta = cache;
//
// console.log("\n\n");
//
// console.log(JSON.stringify(remoteBuildAppRuntime, null, 2));
//
// configFileDoc.joe;
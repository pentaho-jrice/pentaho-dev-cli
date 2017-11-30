#!/usr/bin/env node

const config = require('./lib/config/default-config');

console.log("<<-- executed pentaho ael userHomeDir:  " + config.defaultConfig.userHomeDir);
console.log("<<-- executed pentaho ael devConfigFilePath:  " + config.defaultConfig.devConfigFilePath);
const config = require('./lib/pcli/config/default-config');
const cliContextBuilder = require('./lib/pcli/core/cli-context-builder');
const fs = require('fs');
const yaml = require('js-yaml');
const promptUtils = require('./lib/pcli/util/promptUtils');

const cliContext = cliContextBuilder.initalizeCliContext();

let majorVersions = cliContext.contexts.runtimeContext.remoteBuildVersionsContext.majorVersions;

// let majorVersion = promptUtils.buildChoicePrompt(majorVersions, "versionInfo.versionString", "Choose Version #", "Version #")


#!/usr/bin/env node

var program = require('commander');

program
    .version('0.0.1')
    .description('Pentaho Dev ')
    .option('-e, --env <environment>', 'The JRA environment to execute against')
    .command('ael', 'Manage the AEL app')//.alias('env')
    .command('distros', 'Manage PDI (spoon) app')//.alias('sw')
    .parse(process.argv);

console.log("<<-- executed pentaho");
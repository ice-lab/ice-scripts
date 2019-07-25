#!/usr/bin/env node
const program = require('commander');
const packageInfo = require('../package.json');
const updater = require('update-notifier');
const checkNodeVersion = require('../lib/utils/checkNodeVersion');
const validationSassAvailable = require('../lib/utils/validationSassAvailable');

(async () => {
  console.log(packageInfo.name, packageInfo.version);
  // finish check before run command
  checkNodeVersion(packageInfo.engines.node);
  validationSassAvailable();
  updater({ pkg: packageInfo, shouldNotifyInNpmScript: true }).notify({ defer: true });

  program
    .version(packageInfo.version)
    .usage('<command> [options]')
    .command('build', 'build project')
    .command('dev', 'start server')
    .command('test <regexForTestFiles>', 'run tests with jest');

  program.parse(process.argv);

  const proc = program.runningCommand;

  if (proc) {
    proc.on('close', process.exit.bind(process));
    proc.on('error', () => {
      process.exit(1);
    });
  }

  const subCmd = program.args[0];
  if (!subCmd) {
    program.help();
  }
})();

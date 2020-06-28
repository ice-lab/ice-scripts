#!/usr/bin/env node
const program = require('commander');
const packageInfo = require('../package.json');
const checkNodeVersion = require('../lib/utils/checkNodeVersion');
const validationSassAvailable = require('../lib/utils/validationSassAvailable');
const chalk = require('chalk');

console.log();
console.log(chalk.red(`
  当前 ice-scripts 版本 ${packageInfo.version} 已不在维护，请升级到 ice.js 进行使用。
  ice.js 在可配置性以及扩展性方面做了极大提升，且满足 ice-scripts 的所有功能。
`));
console.log(chalk.yellow(`
  升级文档：https://ice.work/docs/guide/migrate
  如升级遇到问题可通过钉钉群与我们联系：https://ice.alicdn.com/assets/images/qrcode.png
`));
console.log();

(async () => {
  console.log(packageInfo.name, packageInfo.version);
  // finish check before run command
  checkNodeVersion(packageInfo.engines.node);
  validationSassAvailable();

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

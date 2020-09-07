#!/usr/bin/env node
const program = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const packageInfo = require('../package.json');
const checkNodeVersion = require('../lib/utils/checkNodeVersion');
const validationSassAvailable = require('../lib/utils/validationSassAvailable');

(async () => {
  console.log(packageInfo.name, packageInfo.version);

  program.parse(process.argv);
  const subCmd = program.args[0];

  if (subCmd) {
    console.log();
    console.log(chalk.red(`
      1. 检查到您项目依赖的 ice-scripts 版本 ${packageInfo.version} 已不在维护，请升级到 ice.js 进行使用
      2. 升级文档：https://ice.work/docs/guide/migrate
      3. 如升级遇到问题可通过钉钉群与我们联系：https://ice.alicdn.com/assets/images/qrcode.png
      4. 再次感谢您升级到最新版本，感谢信任并使用 ICE。
    `));
    console.log();

    const answer = await inquirer.prompt({
      type: 'confirm',
      name: 'shouldUpgrade',
      message: `检测到您的项目符合一键升级规范，立即升级？`,
      default: true,
    });
    console.log('Answer:', answer);
  }

  // finish check before run command
  checkNodeVersion(packageInfo.engines.node);
  validationSassAvailable();

  program
    .version(packageInfo.version)
    .usage('<command> [options]')
    .command('build', 'build project')
    .command('dev', 'start server')
    .command('test <regexForTestFiles>', 'run tests with jest');

  const proc = program.runningCommand;

  if (proc) {
    proc.on('close', process.exit.bind(process));
    proc.on('error', () => {
      process.exit(1);
    });
  }

  if (!subCmd) {
    program.help();
  }
})();

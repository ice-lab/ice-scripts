#!/usr/bin/env node
const program = require('commander');
const parse = require('yargs-parser');

const getCliOptions = require('../lib/utils/getCliOptions');
const Context = require('../lib/core/Context');
const log = require('../lib/utils/log');

program
  .allowUnknownOption() // allow jest config
  .option('--config <config>', 'use custom ice config')
  .parse(process.argv);

(async () => {
  process.env.NODE_ENV = 'test';
  const cliOptions = getCliOptions(program);
  const rawArgv = parse(process.argv.slice(2));
  const jestArgv = {};
  // get jest options
  Object.keys(rawArgv).forEach((key) => {
    if (key.indexOf('jest-') === 0) {
      // transform jest-config to config
      const jestKey = key.replace('jest-', '');
      jestArgv[`${jestKey[0].toLowerCase()}${jestKey.slice(1)}`] = rawArgv[key];
    }
  });
  if (program.args && program.args.length > 0) {
    jestArgv.regexForTestFiles = program.args;
  }
  try {
    await new Context({
      command: 'test',
      args: { ...cliOptions, jestArgv },
    }).run();
  } catch (err) {
    log.error(err.message);
    console.error(err);
    process.exit(1);
  }
})();

const program = require('commander');

const getCliOptions = require('../lib/utils/getCliOptions');
const Context = require('../lib/core/Context');
const log = require('../lib/utils/log');

program
  .option('--mode <mode>', 'dev or build, default is dev')
  .option('--rule <ruleName>', 'inspect a specific module rule')
  .option('--plugin <pluginName>', 'inspect a specific plugin')
  .option('--rules', 'list all module rule names')
  .option('--plugins', 'list all plugin names')
  .parse(process.argv);

(async () => {
  const cliOptions = getCliOptions(program);
  const { mode } = cliOptions;
  try {
    let command;
    if (mode === "build") {
      command = "build";
    } else {
      command = "dev";
    }
    const context = await new Context({
      command,
    });
    context.runPlugins();
    const webpackConfig = context.getWebpackConfig();

    // eslint-disable-next-line global-require
    const inspect = require('../lib/commands/inspect');
    await inspect(webpackConfig, cliOptions);

    process.exit(1);
  } catch (err) {
    log.error(err.message);
    console.error(err);
    process.exit(1);
  }
})();

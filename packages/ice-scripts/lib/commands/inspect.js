const Config = require('webpack-chain');

module.exports = (config, args) => {
  let result;
  let exists;

  // Specific module rule
  if (args.rule) {
    // eslint-disable-next-line no-underscore-dangle
    exists = config.module.toConfig().rules.some(r => r.__ruleNames[0] === args.rule);
    if (exists) {
      result = Config.toString(
        config.module.rule(args.rule).toConfig(),
      );
    }
  } else if (args.plugin) { // Specific plugin
    exists = config.plugins.get(args.plugin);
    if (exists) {
      result = Config.toString(
        config.plugins.get(args.plugin).toConfig(),
      );
    }
  } else if (args.rules) { // All module rules
    result = Config.toString(config.module.toConfig().rules);
  } else if (args.plugins) { // All plugins
    result = Config.toString(config.toConfig().plugins)
  } else { // Entire webpack config
    result = Config.toString(config);
  }

  console.log(result);
};

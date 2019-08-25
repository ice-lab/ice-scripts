/* eslint-disable no-param-reassign */
const HappyPack = require('happypack');

module.exports = ({ chainWebpack }) => {
  chainWebpack((config) => {
    const rules = config.toConfig().module.rules;

    rules.forEach(rule => {
      // eslint-disable-next-line no-underscore-dangle
      const ruleName = rule.__ruleNames[0];

      const confRule = config.module.rule(ruleName);
      // Clear all existing loaders.
      // If you don't do this, the loader below will be appended to
      // existing loaders of the rule.
      confRule.uses.clear();

      // Add replacement loader.
      confRule
        .use(`happypack/loader?id=${ruleName}`)
        .loader(`happypack/loader?id=${ruleName}`);

      // Transform the property 'loader' to 'path'.
      const loaders = rule.use;
      loaders.map(loader => {
        loader.path = loader.loader;
        delete(loader.loader);
        return loader;
      });

      // Add instance of HappyPack plugin.
      config
        .plugin(`HappyPack_${ruleName}`)
          .use(HappyPack, [{
            id: ruleName,
            use: [...loaders],
          }]);
    });
  });
};

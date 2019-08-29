module.exports = ({ chainWebpack, log }, options = []) => {
  chainWebpack((config) => {
    // List of expensive loaders to cache if user does not specify any
    const list = [
      'url-loader',
      'babel-loader',
      'ts-loader',
      'mini-css-extract-plugin',
    ];
    let loadersList;
    if (Object.keys(options).length) {
      loadersList = options;
    } else {
      loadersList = list;
    }
    const rules = config.toConfig().module.rules;

    log.info("Setting up cache-loader");
    rules.forEach(rule => {
      // Checks if current loaders are in the list of expensive loaders
      const match =
        rule.use.some(item => loadersList.some(loader => item.loader.includes(loader)));

      if (match) {
        // eslint-disable-next-line no-underscore-dangle
        const ruleName = rule.__ruleNames[0];

        // Relevant issue: https://github.com/webpack-contrib/cache-loader/issues/40
        if (ruleName.includes("css") ||
            ruleName.includes("scss") ||
            ruleName.includes("less")
            ) {
          // Add cache-loader after MiniCssExtractPlugin loader entry
          config
            .module
              .rule(ruleName)
                .use('cache-loader')
                .loader(require.resolve('cache-loader'))
                // Reference the MiniCssExtractPlugin loader entry
                .after("MiniCssExtractPlugin.loader");
        } else {
          // Add cache-loader as first entry
          config
            .module
              .rule(ruleName)
                .use('cache-loader')
                .loader(require.resolve('cache-loader'))
                // Reference the current loader entry
                .before(ruleName);
        }
      }
    });
  });
}

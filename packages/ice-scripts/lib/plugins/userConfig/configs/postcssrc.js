module.exports = ({ chainWebpack }, postcssrc) => {
  if (postcssrc) {
    chainWebpack(config => {
      // remove postcss-loader plugins in options
      [
        "scss",
        "scss-module",
        "css",
        "css-module",
        "less",
        "less-module",
        "styl",
        "styl-module",
      ].forEach(rule => {
        if (config.module.rules.get(rule)) {
          config.module
            .rule(rule)
            .use("postcss-loader")
            .tap(() => ({}));
        }
      });
    });
  }
};

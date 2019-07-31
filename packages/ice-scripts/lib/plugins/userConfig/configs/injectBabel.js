const path = require('path');

module.exports = ({ chainWebpack, context }, injectBabel) => {
  chainWebpack((config) => {
    if (injectBabel === 'runtime') {
      ['jsx', 'tsx'].forEach((rule) => {
        config.module
          .rule(rule)
          .use('babel-loader')
          .tap((options) => {
            // get @babel/plugin-transform-runtime
            const babelPlugins = options.plugins || [];
            const targetPlugin = require.resolve('@babel/plugin-transform-runtime');
            const plugins = babelPlugins.map((plugin) => {
              if ((typeof plugin === 'string' && plugin === targetPlugin)
                || (Array.isArray(plugin) && plugin[0] === targetPlugin)) {
                return [targetPlugin, {
                  corejs: false,
                  helpers: true,
                  regenerator: true,
                  useESModules: false,
                }];
              }
              return plugin;
            });
            return Object.assign(options, { plugins });
          });
      });
    } else if (injectBabel === 'polyfill') {
      const { rootDir } = context;
      const entries = config.toConfig().entry;
      const rule = config.module.rule('polyfill').test(/\.jsx?|\.tsx?$/);
      Object.keys(entries).forEach((key) => {
        // only include entry path
        rule.include.add(path.resolve(rootDir, entries[key][0]));
      });
      rule.use('polyfill-loader').loader(require.resolve('../utils/polyfillLoader')).options({});

      // add resolve modules for get core-js and regenerator-runtime
      const modulePath = require.resolve('core-js');
      const pathArr = modulePath.split('node_modules');
      pathArr.pop(); // pop file path
      config.resolve.modules.add(path.join(pathArr.join('node_modules'), 'node_modules'));
    }
  });
};

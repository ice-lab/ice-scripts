const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildDll = require('./lib/buildDll');

module.exports = async ({ chainWebpack, context, log }, dllOptions = {}) => {
  const { rootDir, command, pkg, userConfig } = context;
  const { dev, build } = dllOptions;
  if ((command === 'dev' && dev) || (command === 'build' && build)) {
    const defaultAppHtml = path.join(rootDir, 'public', 'index.html');
    await buildDll(rootDir, pkg.dependencies, defaultAppHtml, log);

    const join = path.join.bind(path, rootDir);
    log.info('Dll build complete');

    chainWebpack((config) => {
      config
        .devServer
          .contentBase([
            rootDir,
            join('node_modules', 'plugin-dll', 'public'),
          ])
          .end()
        .plugin('DllReferencePlugin')
          .use(webpack.DllReferencePlugin, [{
            context: join('node_modules', 'plugin-dll'),
            // eslint-disable-next-line import/no-dynamic-require
            manifest: require(join('node_modules', 'plugin-dll', 'vendor-manifest.json')),
          }])
          .end()
        .plugin('CopyWebpackPlugin')
          .tap(([args]) => [[{
            ...(args[0] || {}),
            from: join('node_modules', 'plugin-dll', 'public'),
          }]]);

      // Handle multi entry config
      const value = userConfig.entry;
      let entry;
      if (Array.isArray(value) || typeof value === 'string') {
        entry = {
          index: value,
        };
      } else if (Object.prototype.toString.call(value) === '[object Object]') {
        entry = value;
      }
      const entryNames = Object.keys(entry);
      const isMultiEntry = entryNames.length > 1;

      let pluginConfig = {};
      if (isMultiEntry) {
        pluginConfig = {
          ...config
            .plugin('HtmlWebpackPlugin')
              .get('args')[0],
        };
        // remove default HtmlWebpackPlugin
        config.plugins.delete('HtmlWebpackPlugin');

        // generate multiple html file
        // webpack-chain entry must be [name]: [...values]
        entryNames.forEach((entryName) => {
          const entryValue = entry[entryName];
          entry[entryName] = typeof entryValue === 'string' ? [entryValue] : entryValue;
          if (isMultiEntry) {
            const pluginKey = `HtmlWebpackPlugin_${entryName}`;
            config
              .plugin(pluginKey)
                .use(HtmlWebpackPlugin, [{
                  ...pluginConfig,
                  excludeChunks: entryNames.filter((n) => n !== entryName),
                  filename: `${entryName}.html`,
                  inject: true,
                  template: join('node_modules', 'plugin-dll', 'public', 'index.html'),
                }]);
          }
        });
      } else { // Use template index.html
        config
          .plugin('HtmlWebpackPlugin')
            .tap(([options]) => [{
              ...options,
              template: join('node_modules', 'plugin-dll', 'public', 'index.html'),
            }]);
      }
    });
  }
};

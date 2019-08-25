const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildDll = require('./lib/buildDll');

module.exports = async ({ chainWebpack, context, log }, options = {}) => {
  const { rootDir, command, pkg, userConfig } = context;
  const { dev, build } = options;
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

      // Add new HtmlWebpackPlugin
      if (isMultiEntry) {
        config
          .plugin('HtmlWebpackPlugin')
            .use(HtmlWebpackPlugin, [{
              inject: true,
              templateParameters: {
                NODE_ENV: process.env.NODE_ENV,
              },
              template: join('node_modules', 'plugin-dll', 'public', 'index.html'),
              minify: false,
            }])
      } else { // Use template index.html
        config
          .plugin('HtmlWebpackPlugin')
            .tap(() => [{
              template: join('node_modules', 'plugin-dll', 'public', 'index.html'),
            }]);
      }
    });
  }
};

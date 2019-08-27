const webpack = require('webpack');
const path = require('path');
const buildDll = require('./lib/buildDll');

module.exports = async ({ chainWebpack, context, log }) => {
  const { rootDir, command, pkg } = context;
  // only active in dev mode
  if (command === 'dev') {
    const htmlTemplate = path.join(rootDir, 'public', 'index.html');
    await buildDll({
      webpackConfig: context.getWebpackConfig(),
      rootDir,
      pkg,
      htmlTemplate,
      log,
    });

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
            manifest: join('node_modules', 'plugin-dll', 'vendor-manifest.json'),
          }])
          .end()
        .plugin('CopyWebpackPlugin')
          .tap(([args]) => [[{
            ...(args[0] || {}),
            from: join('node_modules', 'plugin-dll', 'public'),
          }]]);

      // Handle multi entry config
      const entry = config.toConfig().entry;
      const entryNames = Object.keys(entry);
      const isMultiEntry = entryNames.length > 1;

      if (isMultiEntry) {
        // remove default HtmlWebpackPlugin
        config.plugins.delete('HtmlWebpackPlugin');

        // generate multiple html file
        // webpack-chain entry must be [name]: [...values]
        entryNames.forEach((entryName) => {
          if (isMultiEntry) {
            const pluginKey = `HtmlWebpackPlugin_${entryName}`;
            config
              .plugin(pluginKey)
                .tap(([options]) => [{
                  ...options,
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

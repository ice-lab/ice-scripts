const webpack = require('webpack');
const path = require('path');
const buildDll = require('./lib/buildDll');

module.exports = async ({ chainWebpack, context, log }, dllOptions = {}) => {
  const { rootDir, command, pkg } = context;
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

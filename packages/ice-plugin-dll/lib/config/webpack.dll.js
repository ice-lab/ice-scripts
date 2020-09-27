const webpack = require('webpack');
const path = require('path');

module.exports = (defaultConfig, rootDir) => {
  const join = path.join.bind(path, rootDir);

  // merge default config to compile
  return {
    ...defaultConfig,
    entry: {
      vendor: [
        join('node_modules', 'plugin-dll', 'vendor.js'),
      ],
    },
    output: {
      path: join('node_modules', 'plugin-dll', 'public'),
      filename: '[name].dll.js',
      library: '[name]',
    },
    plugins: [
      ...defaultConfig.plugins,
      new webpack.DllPlugin({
        path: join('node_modules', 'plugin-dll', '[name]-manifest.json'),
        name: '[name]',
        context: join('node_modules', 'plugin-dll'),
      }),
    ],
    resolve: {
      modules: [
        join('node_modules', 'plugin-dll'),
        'node_modules',
      ],
    },
  };
};

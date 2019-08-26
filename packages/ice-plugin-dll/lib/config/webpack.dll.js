const webpack = require('webpack');
const path = require('path');

module.exports = (rootDir) => {
  const join = path.join.bind(path, rootDir);

  return {
    entry: {
      vendor: [
        join('node_modules', 'plugin-dll', 'vendor.js'),
      ],
    },
    output: {
      path: join('node_modules', 'plugin-dll', 'public'),
      filename: '[name].js',
      library: '[name]',
    },
    plugins: [
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
  }
};

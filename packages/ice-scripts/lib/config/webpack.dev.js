/* eslint-disable indent */
const webpack = require('webpack');
const getBaseConfig = require('./webpack.base.js');

module.exports = () => {
  const baseConfig = getBaseConfig('development');

  // set source map
  baseConfig.devtool('cheap-module-source-map');

  // set hot reload plugin
  baseConfig
    .plugin('HotModuleReplacementPlugin')
      .use(webpack.HotModuleReplacementPlugin);

  return baseConfig;
};

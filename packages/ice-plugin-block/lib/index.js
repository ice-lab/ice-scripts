const path = require('path');

module.exports = ({ context, chainWebpack }) => {
  const { rootDir } = context;
  chainWebpack((config) => {
    // modify HtmlWebpackPlugin
    config.plugin('HtmlWebpackPlugin').tap((args) => [
      { ...(args[0] || {}), template: require.resolve('./template/index.html') },
    ]);

    // remove default entry
    config.entryPoints.clear();

    // add custom entry file
    config.merge({
      entry: {
        index: [require.resolve('./template/index.js')],
      },
    });

    // update publicPath ./
    config.output.publicPath('./');
    ['scss', 'scss-module', 'css', 'css-module', 'less', 'less-module'].forEach((rule) => {
      if (config.module.rules.get(rule)) {
        config.module.rule(rule).use('MiniCssExtractPlugin.loader').tap(() => ({ publicPath: '../' }));
      }
    });

    // update outputAssetsPath
    config.output.filename('[name].js');
    config.plugin('MiniCssExtractPlugin').tap(([args]) => [Object.assign({}, args, {
      filename: '[name].css',
    })]);

    // add alias for load Block component
    config.merge({
      resolve: {
        alias: {
          '@/block': path.join(rootDir, 'src/index'),
        },
      },
    });

    // delete CopyWebpackPlugin
    config.plugins.delete('CopyWebpackPlugin');

    // add exclude rule for compile template/index.js
    ['jsx', 'tsx'].forEach((rule) => {
      config.module
        .rule(rule)
        .exclude
        .clear()
        .add(/node_modules\/((?!ice-plugin-block\/lib\/template\/index.js).)+/);
    });
  });
};

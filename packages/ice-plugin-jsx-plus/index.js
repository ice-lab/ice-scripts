const path = require('path');

module.exports = ({ chainWebpack }) => {
  // Babel plugins for JSX+
  const plugins = [
    'babel-plugin-transform-jsx-list',
    'babel-plugin-transform-jsx-condition',
    'babel-plugin-transform-jsx-memo',
    'babel-plugin-transform-jsx-slot',
    ['babel-plugin-transform-jsx-fragment', { moduleName: 'react' }],
    'babel-plugin-transform-jsx-class',
  ];
  chainWebpack((config) => {
    // modify babel config
    ['jsx', 'tsx'].forEach((rule) => {
      config.module
        .rule(rule)
        .use('babel-loader')
        .tap((options) => {
          plugins.forEach(plugin => {
            if (typeof plugin === 'string') {
              options.plugins.push(require.resolve(plugin));
            } else if (Array.isArray(plugin)) {
              const [pluginName, pluginOption] = plugin;
              options.plugins.push([
                require.resolve(pluginName),
                pluginOption,
              ]);
            }
          });
          return options;
        });
    });

    // add resolve modules for babel-runtime-jsx-plus
    const runtimePath = require.resolve('babel-runtime-jsx-plus');
    const pathArr = runtimePath.split('node_modules');
    pathArr.pop(); // pop file path
    config.resolve.modules.add(path.join(pathArr.join('node_modules'), 'node_modules'));
  });
};

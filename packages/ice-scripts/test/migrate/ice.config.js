const a = require('a');
const b = require('b');

module.exports = {
  publicPath: "",
  test: a ? '' : false,
  entry: ['', ''],
  devServer: {
    a: "a",
    b: [{}],
    c: 1,
    d: true,
  },
  externals: {
    moment: 'moment',
    react: 'React',
    'react-dom': 'ReactDOM',
    bizcharts: 'BizCharts',
    'babel-standalone': 'Babel',
  },
  plugins: [
    'ice-plugin-component',
    ['ice-plugin-fusion', {
      themePackage: '@icedesign/theme',
      themeConfig: {
        nextPrefix: 'nextfd-',
        primaryColor: '#f60',
        'font-size-body-1': '14px',
      },
      uniteBaseComponent: '@alife/next'
    }],
    ['ice-plugin-load-assets', {
      assets: {
        dev: ['https://unpkg.com/react@16.7.0/umd/react.development.js', 'https://unpkg.com/react-dom@16.7.0/umd/react-dom.development.js'],
        build: ['https://unpkg.com/react@16.7.0/umd/react.production.min.js', 'https://unpkg.com/react-dom@16.7.0/umd/react-dom.production.min.js'],
      },
    }],
    './xx.js',
  ],
  chainWebpack: (chainConfig, { command }) => {
    if (command === 'dev') {
      // do something
      const c = {};
    }
    chainConfig.optimization
    .minimizer('UglifyJsPlugin')
    .tap(([options]) => [
      {
        ...options,
        sourceMap: true,
      },
    ]);
  }
 }

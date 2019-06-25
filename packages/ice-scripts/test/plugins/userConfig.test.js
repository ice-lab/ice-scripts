const Config = require('webpack-chain');
const userConfigPlugin = require('../../lib/plugins/userConfig');

const MockApi = function () {
  this.config = new Config();
  this.chainWebpack = (fn) => {
    fn(this.config);
  };
};

describe('user config', () => {
  describe('entry', () => {
    test('string entry', () => {
      const api = new MockApi();
      api.context = { userConfig: { entry: 'src/index.js' }, commandArgs: {} };
      api.config.entry('index').add('src/test.js');
      userConfigPlugin(api);
      expect(api.config.toConfig().entry.index).toEqual([
        'src/index.js',
      ]);
    });

    test('multi entris', () => {
      const api = new MockApi();
      api.context = {
        userConfig: {
          entry: {
            index: 'src/index.js',
            dashboard: 'src/dashboard.js',
          },
        },
        commandArgs: {},
      };
      // mock HtmlWebpackPlugin
      api.config.plugin('HtmlWebpackPlugin')
        .use(require('html-webpack-plugin'), [{
          inject: true,
          templateParameters: {
            NODE_ENV: process.env.NODE_ENV,
          },
          template: './index.html',
          minify: false,
        }]);
      userConfigPlugin(api);
      expect(api.config.toConfig().entry).toEqual({
        index: ['src/index.js'],
        dashboard: ['src/dashboard.js'],
      });
    });
  });

  describe('hash', () => {
    test('config hash is true', () => {
      const api = new MockApi();
      api.context = {
        userConfig: { hash: true },
      };
      api.config.output.filename('js/[name].js');
      expect(api.config.output.get('filename')).toBe('js/[name].js');
      userConfigPlugin(api);
      expect(api.config.output.get('filename')).toBe('js/[name].[hash:6].js');
    });
  });

  describe('outputAssetsPath', () => {
    test('set up outputAssetsPath', () => {
      const api = new MockApi();
      api.context = {
        userConfig: {
          outputAssetsPath: {
            js: 'test/js',
            css: 'test/css',
          },
        },
      };
      // mock MiniCssExtractPlugin
      api.config.plugin('MiniCssExtractPlugin')
        .use(require('mini-css-extract-plugin'), [{
          filename: '[name].css',
        }]);
      api.config.output.filename('js/[name].[hash:6].js');
      userConfigPlugin(api);
      expect(api.config.output.get('filename')).toBe('test/js/[name].[hash:6].js');
    });
  });
});

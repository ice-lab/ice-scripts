[English](./README.md) | 简体中文

# ice-scripts

[![NPM version](https://img.shields.io/npm/v/ice-scripts.svg?style=flat)](https://npmjs.org/package/ice-scripts)
[![Build Status](https://img.shields.io/travis/ice-lab/ice-scripts.svg?style=flat)](https://travis-ci.org/ice-lab/ice-scripts)
[![NPM downloads](https://img.shields.io/npm/dm/ice-scripts.svg?style=flat)](https://npmjs.org/package/ice-scripts)

> ice-scripts 是 React 项目的工程构建工具，配置简单、插件化能力，参考文档 [ice-scripts](https://ice.work/docs/cli/about)

## 特性

`ice-scripts` 提供了丰富的功能帮助我们开发 React 项目：

* 提供完善基础配置，通过设置 `ice.config.js` 配置文件快捷支持大多数项目的工程配置需求
* 提供插件机制，帮助扩展工程能力，丰富的插件体系，方便社区共建可复用解决方案
* 提供丰富的工程能力，如 ES6+ 语言特性、TypeScript、样式方案（Less/Sass/CSS Modules）等开箱即用支持
* 基于 webpack-chain 提供灵活的自定义 webpack 配置能力
* 支持基于 Jest 的测试能力

## 快速开始

> 建议使用 [iceworks GUI](https://ice.work/iceworks) 工具进行初始化

```bash
# Install deps
$ npm install iceworks -g

# create an empty folder
$ mkdir iceapp && cd iceapp

# create react project
$ iceworks init
```

初始化完成后即使用项目内置命令来开始项目调试开发和项目构建。

```bash
$ npm start
```

开始调试服务后，可以访问 `http://localhost:4444` 进行页面预览。修改源码内容后将自动刷新页面。

```bash
$ npm run build
```

构建项目代码，构建产物默认生成到 `./build` 目录下。

## 配置

`ice-scripts` 提供了开箱即用的能力支持，如果项目需要自定义配置，可以在项目跟目录下创建 `ice.config.js`。`ice-scripts` 将自动进行加载。

**ice.config.js**

```js
const path = require('path');

module.exports = {
  // 基础配置，详见 https://ice.work/docs/cli/config/config
  entry: 'src/index.js',
  publicPath: './',
  alias: {
    '@components': path.resolve(__dirname, 'src/components/')
  },
  // ...

  // 插件配置，详见 https://ice.work/docs/cli/plugin-list/fusion for more infomation
  plugins: [
    ['ice-plugins-fusion', { themePackage: '@icedesign/theme' }],
  ],

  // 通过 webpack-chain 修改 webpack 配置
  chainWebpack: (config) => {
    config.devServer.hot(true);
  }
}
```

## Contributors

欢迎反馈问题 [issue 链接](https://github.com/alibaba/ice/issues/new)
如果对 `ice-scripts` 感兴趣，欢迎参考 [CONTRIBUTING.md](https://github.com/alibaba/ice/blob/master/.github/CONTRIBUTING.md) 学习如何贡献代码。

## License

[MIT](LICENSE)
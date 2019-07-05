# ice-scripts

[![NPM version](https://img.shields.io/npm/v/ice-scripts.svg?style=flat)](https://npmjs.org/package/ice-scripts)
[![Build Status](https://img.shields.io/travis/ice-lab/ice-scripts.svg?style=flat)](https://travis-ci.org/ice-lab/ice-scripts)
[![NPM downloads](https://img.shields.io/npm/dm/ice-scripts.svg?style=flat)](https://npmjs.org/package/ice-scripts)

> 🐒Configurable build tool for React project based on webpack. Find detailed instructions in [its documentation](https://ice.work/docs/cli/about)

## Features

`ice-scripts` have everything you need to build a React app:

* Fully configurable via `ice.config.js`, allow your project to have it's configuration
* The plugin system provides rich features and allow the community to build reusable solutions
* Out of the box support for ES6+, TypeScripts, Less, Sass, CSS Modules
* Easy to modify built-in webpack configuration by webpack-chain
* Delightful JavaScript testing based on Jest

## Getting Started

> Recommend to create a React app via [iceworks](https://ice.work/iceworks)

```bash
# Install deps
$ npm install iceworks -g

# create an empty folder
$ mkdir iceapp && cd iceapp

# create react project
$ iceworks init
```

Once the initialization is done, inside the created project, you can run some built-in commands:

```bash
$ npm start
```

Runs the app in development mode.

It will open `http://localhost:4444` for preview. The page will be automatically reloaded if you make changes to the code.

```bash
$ npm run build
```
Builds the app for prodution.

## Configuration

Out of the box, `ice-scripts` won't require you to use a configuration file. If you need to customize your project confg, you can create a `ice.config.js` file in the root folder and `ice-scripts` will automatically use it.

**ice.confg.js**

```js
const path = require('path');

module.exports = {
  // basic options. see https://ice.work/docs/cli/config/config for more infomation
  entry: 'src/index.js',
  publicPath: './',
  alias: {
    '@components': path.resolve(__dirname, 'src/components/')
  },
  // ...

  // see https://ice.work/docs/cli/plugin-list/fusion for more infomation
  plugins: [
    ['ice-plugins-fusion', { themePackage: '@icedesign/theme' }],
  ],

  // modify webpack configuration via webpack-chain
  chainWebpack: (config) => {
    config.devServer.hot(true);
  }
}
```

## Contributors

Feel free to report any questions as an [issue](https://github.com/alibaba/ice/issues/new), we'd love to have your helping hand on `ice-scripts`.

If you're interested in `ice-scripts`, see [CONTRIBUTING.md](https://github.com/alibaba/ice/blob/master/.github/CONTRIBUTING.md) for more information to learn how to get started.

## License

[MIT](LICENSE)
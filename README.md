# ice-scripts

[![NPM version](https://img.shields.io/npm/v/ice-scripts.svg?style=flat)](https://npmjs.org/package/ice-scripts)
[![Build Status](https://img.shields.io/travis/ice-lab/ice-scripts.svg?style=flat)](https://travis-ci.org/ice-lab/ice-scripts)
[![NPM downloads](https://img.shields.io/npm/dm/ice-scripts.svg?style=flat)](https://npmjs.org/package/ice-scripts)

> ice-scripts 是 React 项目的工程构建工具，配置简单、插件化能力，参考文档 [ice-scripts](https://ice.work/docs/cli/about)

## 快速上手

### 初始化项目

> 也可通过 iceworks GUI 工具进行初始化

安装 `iceworks` 依赖：

```bash
$ npm install iceworks -g
$ iceworks --help
```

创建一个空目录：

```bash
$ mkdir iceapp && cd iceapp
```

初始化项目：

```bash
$ iceworks init
# 或者根据指定模板创建项目
$ iceworks init @icedesign/pro-scaffold

# 向项目里添加区块
$ cd src/components/
$ iceworks add @icedesign/user-landing-block
```

完成项目初始化后既可以开始开始项目调试开发和项目构建。

### 调试开发

项目目录下启动调试服务：

```bash
$ npm start
```

开始调试服务后，可以访问 `http://localhost:4444` 进行页面预览。修改源码内容后将自动刷新页面。

### 构建代码

构建项目代码：

```bash
$ npm run build
```

构建产物默认生成到 `./build` 目录下。

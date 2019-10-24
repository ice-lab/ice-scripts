const path = require('path');
const fse = require('fs-extra');
const clonedeep = require('lodash.clonedeep');
const chokidar = require('chokidar');
const resolveSassImport = require('resolve-sass-import');
const { getPkgJSONSync } = require('./utils/pkgJson');
const getDemoDir = require('./utils/getDemoDir');
const getDemos = require('./utils/getDemos');
const configBabel = require('./utils/configBabel');
const { parseMarkdownParts } = require('./compile/component/markdownHelper');
const buildSrc = require('./compile/component/buildSrc');
const modifyPkgHomePage = require('./compile/component/modifyPkgHomePage');
const ComponentStyleGenerator = require('./compile/fusion/componentStyleGenerator');
const baseConfig = require('./configs/base');
const devConfig = require('./configs/dev');
const buildConfig = require('./configs/build');
const adaptorBuildConfig = require('./configs/adaptorBuild');

let watcher = null;
module.exports = ({ context, chainWebpack, onHook, log }, opts = {}) => {
  const { command, rootDir, reRun } = context;
  const { type = 'fusion', watch } = opts;
  const pkg = getPkgJSONSync(rootDir);
  // store webpack chain config
  let webpackChain;
  // check adaptor folder
  const hasAdaptor = fse.existsSync(path.join(rootDir, 'adaptor')) && type === 'fusion';

  chainWebpack((config) => {
    // expose config
    webpackChain = config;
    // add @babel/plugin-transform-runtime
    // @babel/preset-env modules: commonjs
    configBabel(config, {
      presets: [
        {
          name: '@babel/preset-env',
          opts: {
            modules: 'commonjs',
          },
        },
      ],
      plugins: [
        {
          name: '@babel/plugin-transform-runtime',
          pageBuiltIn: true,
          opts: {
            corejs: false,
            helpers: true,
            regenerator: true,
            useESModules: false,
          },
        },
      ],
    });
    // get babel config for component compile
    const babelConfig = clonedeep(config.module.rule('jsx').use('babel-loader').get('options'));
    // babel option do not known cacheDirectory
    delete babelConfig.cacheDirectory;

    const markdownParser = parseMarkdownParts(babelConfig);
    const demoDir = getDemoDir(rootDir);
    const demos = getDemos(path.join(rootDir, demoDir), markdownParser);
    const params = { markdownParser, demoDir, demos, rootDir, pkg, hasAdaptor };
    baseConfig(config, params);
    if (command === 'dev') {
      // component dev
      devConfig(config, params);
    } else if (command === 'build') {
      // component build
      buildConfig(config, params);
      // adaptor build, only effects when set process.env.BUILD_ADAPTOR is true
      if (process.env.BUILD_AGAIN === JSON.stringify(true) && hasAdaptor) {
        adaptorBuildConfig(config, params);
      }
    }
  });

  const compileLib = () => {
    // get babel config after all plugin had been excuted
    const babelConfig = clonedeep(webpackChain.module.rule('jsx').use('babel-loader').get('options'));
    delete babelConfig.cacheDirectory;
    // component buildSrc
    buildSrc({ babelConfig, rootDir, log });
    if (type === 'fusion') {
      const styleGenerator = new ComponentStyleGenerator({
        cwd: rootDir,
        destPath: path.join(rootDir, 'lib'),
        absoulte: false,
      });

      styleGenerator.writeStyleJSSync();
      log.info('Generated style.js');

      styleGenerator.writeIndexScssSync();
      log.info('Generated index.scss');
    }
  };

  if (!watcher && watch) {
    const srcPath = path.join(rootDir, 'src');
    log.info(`Start watch path: ${srcPath}`);
    watcher = chokidar.watch(srcPath, {
      ignoreInitial: true,
    });

    watcher.on('change', (file) => {
      log.info(`${file} changed, start compile library.`);
      compileLib();
    });

    watcher.on('error', (error) => {
      log.error('fail to watch file', error);
    });
  }
  // flag for run build again, only excute at the first time of load this plugin
  if (!process.env.BUILD_AGAIN) {
    // build src and umd adpator after demo build
    onHook('afterBuild', () => {
      process.env.BUILD_AGAIN = true;
      compileLib();
      modifyPkgHomePage(pkg, rootDir);

      if (hasAdaptor) {
        // generate adaptor index.scss
        const sassContent = resolveSassImport('main.scss', path.resolve(rootDir, 'src'));
        fse.writeFileSync(path.resolve(rootDir, 'build/index.scss'), sassContent, 'utf-8');
        // adaptor build
        reRun();
      }
    });
  }
};

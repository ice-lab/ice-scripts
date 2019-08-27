const { existsSync } = require('fs');
const assert = require('assert');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const chokidar = require('chokidar');
const path = require('path');
const pathToRegexp = require('path-to-regexp');
const multer = require('multer');
const matchMock = require('./matchMock');

const winPath = function(path) {
  return path.replace(/\\/g, '/');
};

const debug = require('debug')('ice:mock');

let error = null;
const cwd = process.cwd();
const mockDir = winPath(path.join(cwd, 'mock'));
const jsConfigFile = path.join(cwd, 'mock', 'index.js');
const tsConfigFile = path.join(cwd, 'mock', 'index.ts');
const configFile = winPath(existsSync(tsConfigFile) ? tsConfigFile : jsConfigFile);

function getConfig() {
  if (existsSync(configFile)) {
    // disable require cache
    Object.keys(require.cache).forEach(file => {
      const withPathFile = withPath(file);

      if (withPathFile === configFile || withPathFile.indexOf(mockDir) > -1) {
        debug(`delete cache ${file}`);
        delete require.cache[file];
      }
    });
    return require(configFile);
  } else {
    return {};
  }
}

function applyMock(app) {
  try {
    realApplyMock(app);
    error = null;
  } catch (e) {
    console.log(e);
    error = e;

    console.log();
    outputError();

    const watcher = chokidar.watch([configFile, mockDir], {
      ignored: /node_modules/,
      ignoreInitial: true,
    });
    watcher.on('change', path => {
      console.log(chalk.green('CHANGED'), path.replace(cwd, '.'));
      watcher.close();
      applyMock(app);
    });
  }
}

function realApplyMock(app) {
  let mockConfig = [];

  function parseMockConfig() {
    const parsedMockConfig = [];

    const config = getConfig();
    Object.keys(config).forEach(key => {
      const handler = config[key];
      assert(
        typeof handler === 'function' ||
          typeof handler === 'object' ||
          typeof handler === 'string',
        `mock value of ${key} should be function or object or string, but got ${typeof handler}`
      );

      Array.prototype.push.apply(parsedMockConfig, parseConfig(key, handler));
    });

    return parsedMockConfig;
  }

  mockConfig = parseMockConfig();

  const watcher = chokidar.watch([configFile, mockDir], {
    ignored: /node_modules/,
    persistent: true,
  });
  watcher.on('change', path => {
    console.log(chalk.green('CHANGED'), path.replace(cwd, '.'));
    mockConfig = parseMockConfig();
  });

  app.use((req, res, next) => {
    const match = mockConfig && matchMock(req, mockConfig);
    if (match) {
      debug(`mock matched: [${match.method}] ${match.path}`);
      return match.handler(req, res, next);
    } else {
      return next();
    }
  });
}

function parseConfig(key, handler) {
  let method = 'get';
  let path = key;

  const keys = [];
  if (key.indexOf(' ') > -1) {
    const splited = key.split(' ');
    method = splited[0].toLowerCase();
    path = splited[1];
    return [
      {
        method,
        path,
        keys,
        re: pathToRegexp(path, keys),
        handler: createHandler(method, path, handler),
        key,
      },
    ];
  }

  return [
    {
      method: 'get',
      path,
      keys,
      re: pathToRegexp(path, keys),
      handler: createHandler(method, path, handler),
      key,
    },
    {
      method: 'post',
      path,
      keys,
      re: pathToRegexp(path, keys),
      handler: createHandler(method, path, handler),
      key,
    },
  ];
}

function createHandler(method, path, handler) {
  return function(req, res, next) {
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      bodyParser.json({ limit: '5mb', strict: false })(req, res, () => {
        bodyParser.urlencoded({ limit: '5mb', extended: true })(req, res, () => {
          sendData();
        });
      });
    } else {
      sendData();
    }

    function sendData() {
      if (typeof handler === 'function') {
        multer().any()(req, res, () => {
          handler(req, res, next);
        });
      } else {
        res.json(handler);
      }
    }
  };
}

function outputError() {
  if (!error) return;

  const filePath = error.message.split(': ')[0];
  const relativeFilePath = filePath.replace(cwd, '.');
  const errors = error.stack
    .split('\n')
    .filter(line => line.trim().indexOf('at ') !== 0)
    .map(line => line.replace(`${filePath}: `, ''));
  errors.splice(1, 0, ['']);

  console.log(chalk.red('Failed to parse mock config.'));
  console.log();
  console.log(`Error in ${relativeFilePath}`);
  console.log(errors.join('\n'));
  console.log();
}

module.exports = applyMock;

const fs = require('fs');
const path = require('path');

const appDirectory = fs.realpathSync(process.cwd());
const hotDevClientPath = require.resolve('react-dev-utils/webpackHotDevClient');

function entryWithApp(entry) {
  if (typeof entry === 'string') {
    // 绝对路径直接返回
    if (path.isAbsolute(entry)) {
      return entry;
    }
    return path.resolve(appDirectory, entry);
  } else if (Array.isArray(entry)) {
    return entry.map((file) => entryWithApp(file));
  }
}

function unshiftEntryChunk(entry, chunk) {
  if (typeof entry === 'string') {
    return [chunk, entry];
  } else if (Array.isArray(entry)) {
    return [chunk, ...entry];
  }
}

function enhanceEntries(entries, chunk) {
  const hotEntries = {};

  Object.keys(entries).forEach((key) => {
    hotEntries[key] = unshiftEntryChunk(entries[key], chunk);
  });

  return hotEntries;
}

module.exports = (config, options = {}) => {
  const entry = config.toConfig().entry;
  // 需要区分项目类型，新版的项目直接返回 src/index.js
  let entries = {};
  if (Array.isArray(entry) || typeof entry === 'string') {
    entries = {
      index: entryWithApp(entry),
    };
  } else {
    Object.keys(entry).forEach((key) => {
      entries[key] = entryWithApp(entry[key]);
    });
  }
  if (options.polyfill) {
    const rule = config.module.rule('polyfill').test(/\.jsx?|\.tsx?$/);
    Object.keys(entries).forEach((key) => {
      let addPolyfill = false;
      // only include entry path
      for (let i = 0; i < entries[key].length; i += 1) {
        // filter node_modules file add by plugin
        if (!/node_modules/.test(entries[key][i])) {
          rule.include.add(entries[key][i]);
          addPolyfill = true;
          break;
        }
      }
      if (!addPolyfill) {
        rule.include.add(entries[key][0]);
      }
    });
    rule.use('polyfill-loader').loader(require.resolve('../utils/polyfillLoader')).options({});

    // add resolve modules for get core-js and regenerator-runtime
    const modulePath = require.resolve('core-js');
    const pathArr = modulePath.split('node_modules');
    pathArr.pop(); // pop file path
    config.resolve.modules.add(path.join(pathArr.join('node_modules'), 'node_modules'));
  }

  if (options.hotDev) {
    entries = enhanceEntries(entries, hotDevClientPath);
  }

  config.entryPoints.clear();
  config.merge({ entry: entries });
};

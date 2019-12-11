const autoprefixer = require('autoprefixer');
const path = require('path');
const fse = require('fs-extra');
const log = require('../utils/log');

module.exports = function getPostcssConfig(context = process.cwd()) {
  let postcssConfig = {
    plugins: [
      autoprefixer({
        // rename browserslist to overrideBrowserslist
        overrideBrowserslist: [
          'last 2 versions',
          'Firefox ESR',
          '> 1%',
          'ie >= 9',
          'iOS >= 8',
          'Android >= 4',
        ],
      }),
    ],
  };

  const userPostcssConfigPath = path.resolve(context, 'postcss.config.js');
  if (fse.existsSync(userPostcssConfigPath)) {
    try {
      // eslint-disable-next-line import/no-dynamic-require
      postcssConfig = require(userPostcssConfigPath);
    } catch (err) {
      log.error(`Fail to load config file ${userPostcssConfigPath}, use default config instead`);
    }
  }

  return postcssConfig;
};

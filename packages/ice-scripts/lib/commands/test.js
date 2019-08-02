const path = require('path');
const fs = require('fs');
const jest = require('jest');

module.exports = (context) => {
  const { commandArgs: { jestArgv }, rootDir, webpackConfig } = context;
  const { config, regexForTestFiles, ...restArgv } = jestArgv;
  // get user jest config
  const jestConfigPath = config
    ? path.join(rootDir, config)
    : path.join(rootDir, 'jest.config.js');
  let userJestConfig = {};
  if (fs.existsSync(jestConfigPath)) {
    userJestConfig = require(jestConfigPath); // eslint-disable-line
  }

  // get webpack.resolve.alias
  const { alias } = webpackConfig.resolve;
  const aliasModuleNameMapper = {};
  Object.keys(alias || {}).forEach((key) => {
    const aliasPath = alias[key];
    // check path if it is a directory
    if (fs.existsSync(aliasPath) && fs.statSync(aliasPath).isDirectory()) {
      aliasModuleNameMapper[`^${key}/(.*)$`] = `${aliasPath}/$1`;
    }
    aliasModuleNameMapper[`^${key}$`] = aliasPath;
  });

  // generate default jest config
  const jestConfig = {
    rootDir,
    setupFiles: [require.resolve('../config/jest/shim.js')],
    testMatch: ['**/?*.(spec|test).(j|t)s?(x)'],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': require.resolve('../config/jest/babelTransform.js'),
      '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': require.resolve('../config/jest/fileTransform.js'),
    },
    transformIgnorePatterns: [
      '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
      '^.+\\.module\\.(css|sass|scss|less)$',
    ],
    moduleNameMapper: {
      '\\.(css|less|sass|scss)$': require.resolve('identity-obj-proxy'),
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': require.resolve('../config/jest/fileMock.js'),
      ...aliasModuleNameMapper,
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
    testPathIgnorePatterns: ['/node_modules/'],
    ...userJestConfig,
    ...(regexForTestFiles ? { testMatch: regexForTestFiles } : {}),
  };

  return new Promise((resolve, reject) => {
    jest.runCLI(
      {
        ...restArgv,
        config: JSON.stringify(jestConfig),
      },
      [rootDir],
    ).then((res) => {
      const { results } = res;
      if (results.success) {
        resolve();
      } else {
        reject(new Error('Jest failed'));
      }
    }).catch((err) => {
      console.log(err);
    });
  });
};

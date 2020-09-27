const babelJest = require('babel-jest');
const getBabelConfig = require('../getBabelConfig');
const formatWinPath = require('../../utils/formatWinPath');

const babelConfig = getBabelConfig();
// options for @babel/preset-env when test
babelConfig.presets = babelConfig.presets.map((preset) => {
  if (Array.isArray(preset) && formatWinPath(preset[0]).indexOf('@babel/preset-env') > -1) {
    return [preset[0], {
      targets: {
        node: 'current',
      },
    }];
  }
  return preset;
});
module.exports = babelJest.createTransformer(babelConfig);

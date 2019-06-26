const babelJest = require('babel-jest');
const babelConfig = require('../getBabelConfig');

module.exports = babelJest.createTransformer({
  ...babelConfig(),
});

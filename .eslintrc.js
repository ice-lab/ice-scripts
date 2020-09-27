const { eslint, deepmerge } = require('@ice/spec');

module.exports = deepmerge(eslint, {
  "env": {
    "jest": true
  },
  "rules": {
    "global-require": 1,
    "comma-dangle": 1
  }
});

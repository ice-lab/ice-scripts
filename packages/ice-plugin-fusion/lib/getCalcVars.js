const path = require('path');
const resolveSassImport = require('resolve-sass-import');
const nodeSass = require('node-sass');

// regex for match sass variables like:
// $color-calculate-xxxx: transparentize($search-simple-dark-bg-color, 1 - $search-simple-dark-bg-opacity) !default;
const SASS_REGEX = /\$color-calculate[\w-]+?:[\s\S]+?;/g;
// regex for match css style like:
// .color-calculate-xxxx {color: rgba(0, 0, 0, 1);}
const CSS_REGEX = /\.color-calculate[\w\s-]+?\{[\s\S]+?\}/g;

module.exports = (varsPath, themePath, themeConfig) => {
  let variablesContent = '';
  try {
    variablesContent = resolveSassImport(varsPath, path.dirname(varsPath));
  } catch (err) {
    throw err;
  }
  
  if (variablesContent) {
    // get all calculate colors by prefix color-calculate
    const calcKeys = [];
    const calcSass = variablesContent.match(SASS_REGEX);
    // get calculate keys
    calcSass.forEach((item) => {
      const [key] = item.split(':');
      calcKeys.push(key.slice(1).trim());
    });
    // create sass content
    const sassContent = `@import '${varsPath}';
@import '${themePath}';
${Object.keys(themeConfig).map((key) => {
  const value = themeConfig[key];
  return `$${key}: ${value};`;
}).join('\n')}
${calcSass.join('\n')}
${calcKeys.map((key) => {
  return `.${key}{color: $${key};}`;
}).join('\n')}`;
    // compile sass content to css
    const cssContent = nodeSass.renderSync({
      data: sassContent,
    }).css.toString('utf8');

    // get calculated css value
    const calcVars = {};
    const calcCss = cssContent.match(CSS_REGEX);
    calcCss.forEach((item) => {
      const [key, value] = item.split('{');
      calcVars[key.replace(/\.|\{/g, '').trim()] = value.replace(/;|\}/g, '').trim();
    });

    return calcVars;
  }
  return {};
};
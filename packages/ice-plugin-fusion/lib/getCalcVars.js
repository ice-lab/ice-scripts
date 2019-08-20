const path = require('path');
const resolveSassImport = require('resolve-sass-import');
const nodeSass = require('node-sass');

module.exports = (variablesPath, themeFile, themeConfig) => {
  let variablesContent = '';
  try {
    variablesContent = resolveSassImport(variablesPath, path.dirname(variablesPath));
  } catch (err) {
    throw err;
  }
  
  if (variablesContent) {
    // get all calculate colors by prefix color-calculate
    const calcKeys = [];
    const calcSass = variablesContent.match(/\$color-calculate[\w-]+?:[\s\S]+?;/g);
    // get calculate keys
    calcSass.forEach((item) => {
      const [key] = item.split(':');
      calcKeys.push(key.slice(1).trim());
    });
    // create sass content
    const sassContent = `@import '${variablesPath}';
@import '${themeFile}';
${Object.keys(themeConfig).map((key) => {
  const value = themeConfig[key];
  return `$${key}: ${value};`;
}).join('\n')}
${calcSass.join('\n')}
${calcKeys.map((key) => {
  return `.${key}{color: $${key};}`;
}).join('\n')}`;
    // compile sass content to css
    const cssContet = nodeSass.renderSync({
      data: sassContent,
    }).css.toString('utf8');

    // get calculated css value
    const calcVars = {};
    const calcCss = cssContet.match(/\.color-calculate[\w\s-]+?\{[\s\S]+?\}/g);
    calcCss.forEach((item) => {
      const [key, value] = item.split('{');
      calcVars[key.replace(/\.|\{/g, '').trim()] = value.replace(/;|\}/g, '').trim();
    });

    return calcVars;
  }
  return {};
};
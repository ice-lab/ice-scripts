const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const cheerio = require('cheerio');
const getDllConfig = require('./config/webpack.dll');

async function checkRebuildDll(outputDir, dependencies, log) {
  // Generate dependencies.json or compare dependencies
  const dependenciesJSON = path.join(outputDir, 'dependencies.json');
  if (!fs.existsSync(dependenciesJSON)){
    fs.writeFileSync(dependenciesJSON, JSON.stringify({
      ...dependencies,
    }));
    return true;
  } else {
    try {
      const currPkgString = fs.readFileSync(path.resolve(outputDir, 'dependencies.json'), 'utf-8');
      if (currPkgString === JSON.stringify(dependencies)) {
        return false;
      }
      return true;
    } catch (err) {
      log.error('Error reading dependencies.json');
      throw err;
    }
  }
}

async function generateDllVendorFile(outputDir, dependencies) {
  // Generate vendor.js
  let data = '';

  const vendor = path.join(outputDir, 'vendor.js');
  Object.keys(dependencies).forEach(dependency => {
    data = data.concat(`require('${dependency}');\n`);
  });
  fs.writeFileSync(vendor, data);
}

async function includeDllInHTML(outputDir, defaultAppHtml, log, rebuild) {
  try {
    const htmlTemplate = path.join(outputDir, 'public', 'index.html');
    const cssFile = path.join(outputDir, 'public', 'css', 'vendor.css');

    // Read html content from default app index.html
    const htmlContent = fs.readFileSync(defaultAppHtml, 'utf-8');
    const $ = cheerio.load(htmlContent);

    // add vendor.css
    if (fs.existsSync(cssFile) && !rebuild) {
      $('head').append('<link href="css/vendor.css" rel="stylesheet">');
    }

    // Check if vendor.js is included inside the HTML file
    const hasVendor = (Array.from($('script')) || []).some(script => script.attribs.src === 'vendor.dll.js');
    if (!hasVendor) {
      $('body').append('<script data-id="dll" src="vendor.dll.js"></script>');
    }
    
    fs.writeFileSync(htmlTemplate, $.root().html());
  } catch (err) {
    log.error('Error opening or writing to file');
  }
}

async function buildDll({
  webpackConfig,
  rootDir,
  pkg,
  htmlTemplate,
  log,
}) {
  // Create directories to store Dll related files
  const outputDir = path.join(rootDir, 'node_modules', 'plugin-dll');
  if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
  }
  if (!fs.existsSync(path.join(outputDir, "public"))){
    fs.mkdirSync(path.join(outputDir, "public"));
  }

  // Check for rebuild Dll status
  const rebuildDll = await checkRebuildDll(outputDir, pkg.dependencies, log);
  // Include vendor.js in HTML file
  await includeDllInHTML(outputDir, htmlTemplate, log, rebuildDll);
  if (rebuildDll) {
    await generateDllVendorFile(outputDir, pkg.dependencies);
    const dllConfig = getDllConfig(webpackConfig, rootDir);
    return new Promise((resolve, reject) => {
      log.info("Building Dll");
      webpack(dllConfig, error => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  }
  log.info("No new changes from dependencies.json")
}

module.exports = buildDll;

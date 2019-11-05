const path = require('path');
const fs = require('fs');
const screenShot = require('./utils/screenShot');

// Update package.json
const updatePackageJson = (packageJsonPath, type, htmls, screenshots) => {
  console.log('htmls', htmls);
  const jsonData = fs.readFileSync(packageJsonPath, 'utf8');
  const jsonObj = JSON.parse(jsonData);
  for (let i = 0; i < htmls.length; i++) {
    jsonObj[type].views[i].html = htmls[i];
    jsonObj[type].views[i].screenshot = screenshots[i];
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(jsonObj, null, '  '));
};

module.exports = ({
  context,
  onHook,
}) => {
  // after the build script finished
  onHook('afterBuild', () => {
    // get package.json and rootDir
    const { pkg, rootDir } = context;
    const packageJsonPath = path.join(rootDir, 'package.json');
    const outputRootPath = path.join(rootDir, 'build', 'views');
    fs.mkdirSync(outputRootPath);
    // get htmls and screenshots if blockConfig.views or scaffoldConfig.views exist
    const htmls = [];
    const screenshots = [];
    if (pkg.blockConfig && pkg.blockConfig.views) {
      // block type
      screenShot(rootDir, '/build/index.html', './build/views/block_view1.png', './build/views/block_view1.html', 2000);
      updatePackageJson(packageJsonPath, 'blockConfig', ['build/views/block_view1.html'], ['build/views/block_view1.png']);
    } 
    else if (pkg.scaffoldConfig && pkg.scaffoldConfig.views) {
      // scaffold type
      for (let i = 0; i < pkg.scaffoldConfig.views.length; i++) {
        screenShot(rootDir, '/build/index.html', `./build/views/page${i}.png`, `./build/views/page${i}.html`, 2000, pkg.scaffoldConfig.views[i].path);
        htmls.push(`build/views/page${i}.html`);
        screenshots.push(`build/views/page${i}.png`);
      }
      updatePackageJson(packageJsonPath, 'scaffoldConfig', htmls, screenshots);
    }
  });
};

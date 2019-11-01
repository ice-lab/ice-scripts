const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// set the default size of screen: 1080p
const screenWidth = 1920;
const screenHeight = 1080;
// set the delay time
const delayTime = 2000;

// Get screenshot and html
const getSSandHTML = async (htmlInputPath, width, height, imgOutputDir, htmlOutputDir) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let imgOutputPath = path.join(outputPath, imgOutputDir);
  let htmlOutputPath = path.join(outputPath, htmlOutputDir);
  // set the size of the screen 
  await page.setViewport({
    width,
    height,
  });
  var htmlContent = fs.readFileSync(htmlInputPath, 'utf8');
  await page.setContent(htmlContent);
  await page.waitFor(delayTime);
  await page.screenshot({
    path: imgOutputPath
  });
  console.log('create screenshot succeed');
  const htmlOutput = await page.evaluate(() => {
    // convert all canvas to img
    for (let i = 0; i < document.getElementsByTagName("canvas").length; i++) {
      document.getElementsByTagName("canvas")[i].outerHTML = '<img src="' + document.getElementsByTagName("canvas")[i].toDataURL("image/png") + '"/>';
    }
    // delete <script> tag
    let SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const htmlOutput = document.body.innerHTML.replace(SCRIPT_REGEX, "");
    return htmlOutput
  })
  // save html in html output path
  fs.writeFileSync(htmlOutputPath, htmlOutput);
  console.log('create file succeed');
  await browser.close();
};

// Update package.json
const updatePackageJson = (packageJsonPath, type, htmls, screenshots) => {
  let jsonData = fs.readFileSync(packageJsonPath, 'utf8');
  let jsonObj = JSON.parse(jsonData);
  for (let i = 0; i < htmls.length; i++) {
    jsonObj[type].views[i].html = htmls[i];
    jsonObj[type].views[i].screenshot = screenshots[i];
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(jsonObj));
}

module.exports = ({
  context,
  chainWebpack,
  log,
  onHook
}, options) => {
  // get package.json and rootDir
  const {
    pkg,
    rootDir
  } = context;
  const packageJsonPath = path.join(rootDir, 'package.json');
  const outputPath = path.join(rootDir, 'build', 'views');
  fs.mkdirSync(outputPath);
  // after the build script finished
  onHook('afterBuild', (stats) => {
    let htmls = [];
    let screenshots = [];
    if (pkg.blockConfig && pkg.blockConfig.views) {
      // block type
      let htmlInputPath = path.join(rootDir, 'build', 'index.html');
      getSSandHTML(htmlInputPath, screenWidth, screenHeight, 'block_view.png', 'block_view.html');
      htmls.push(htmlOutputPath);
      screenshots.push(imgOutputPath);
      updatePackageJson(packageJsonPath, 'blockConfig', htmls, screenshots);
    } else if (pkg.scaffoldConfig && pkg.scaffoldConfig.views) {
      // scaffold type
      for (let i = 0; i < pkg.scaffoldConfig.views.length; i++) {
        let htmlInputPath = path.join(rootDir, 'build', 'index.html') + pkg.scaffoldConfig.views[i].path;
        getSSandHTML(htmlInputPath, screenWidth, screenHeight, `page${i}.png`, `page${i}.html`);
        htmls.push(htmlOutputPath);
        screenshots.push(imgOutputPath);
      }
      updatePackageJson(packageJsonPath, 'scaffoldConfig', htmls, screenshots);
    }
  })
};

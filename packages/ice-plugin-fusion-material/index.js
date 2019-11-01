const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// set the default size of screen: 1080p
const screenWidth = 1920; 
const screenHeight = 1080;
// set the delay time
const delayTime = 2000;

// Get screenshot and html
const getSSandHTML = async (htmlInputPath, width, height, imgOutputPath, htmlOutputPath) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // set the size of the screen 
  await page.setViewport({
    width,
    height,
  });
  var htmlContent = fs.readFileSync(htmlInputPath, 'utf8');
  await page.setContent(htmlContent); // load the local html file
  await page.waitFor(delayTime); // delay 
  await page.screenshot({path: imgOutputPath}); // save screenshot in img output path
  console.log('create screenshot succeed');
  const htmlOutput = await page.evaluate( () => { //return innerHTML
    for (let i = 0; i < document.getElementsByTagName("canvas").length; i++){
      document.getElementsByTagName("canvas")[i].outerHTML = '<img src="' + document.getElementsByTagName("canvas")[i].toDataURL("image/png") + '"/>' // convert all canvas to img
    }
    let SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
    const htmlOutput = document.body.innerHTML.replace(SCRIPT_REGEX, "") // delete <script> tag
    return htmlOutput
  })
  fs.writeFileSync(htmlOutputPath, htmlOutput); // save html in html output path
  console.log('create file succeed');
  await browser.close();
};

module.exports = ({ context, chainWebpack, log, onHook }, options) => {
    // get package.json and rootDir
    const { pkg, rootDir } = context;
    // after the build script finished
    onHook('afterBuild', (stats) => { 
        if (pkg.blockConfig && pkg.blockConfig.views) {
            // block type
            let outputPath = path.join(rootDir, 'build', 'views');
            fs.mkdirSync(outputPath) // mkdir build/views/ 
            let htmlInputPath = path.join(rootDir, 'build', 'index.html');
            let imgOutputPath = path.join(outputPath, 'block_view.png');
            let htmlOutputPath = path.join(outputPath, 'block_view.html');
            getSSandHTML(htmlInputPath, screenWidth, screenHeight, imgOutputPath, htmlOutputPath); // get screenshot and html, save in output path
            pkg.blockConfig.views[0].screenshot = imgOutputPath; // write the path of screenshot in package.json
            pkg.blockConfig.views[0].html = htmlOutputPath; // write the path of html in package.json
        } else if (pkg.scaffoldConfig && pkg.scaffoldConfig.views) {
            // scaffold type
            let outputPath = path.join(rootDir, 'build', 'views');
            fs.mkdirSync(outputPath) // mkdir build/views/ 
            for (let i = 0; i < pkg.scaffoldConfig.views.length; i++){
              let htmlInputPath = path.join(rootDir, 'build', 'index.html') + pkg.scaffoldConfig.views[i].path;
              let imgOutputPath = path.join(outputPath, `page${i}.png`);
              let htmlOutputPath = path.join(outputPath, `page${i}.html`);
              getSSandHTML(htmlInputPath, screenWidth, screenHeight, imgOutputPath, htmlOutputPath); // get screenshot and html, save in output path
              pkg.scaffoldConfig.views[i].screenshot = imgOutputPath; // write the path of screenshot in package.json
              pkg.scaffoldConfig.views[i].html = htmlOutputPath; // write the path of html in package.json
            }
        }
    })
};

/**
 * 构建 src
 *  - src -> lib
 *    - es6 编译
 *    - 生成 style.js 和 index.scss
 */

const { createReadStream, createWriteStream, writeFileSync, ensureDirSync } = require('fs-extra');
const babel = require('@babel/core');
const glob = require('glob');
const mkdirp = require('mkdirp');
const path = require('path');
const rimraf = require('rimraf');
const ts = require('typescript');

module.exports = function componentBuild({ babelConfig, rootDir, log }) {
  const srcDir = path.join(rootDir, 'src');
  const libDir = path.join(rootDir, 'lib');

  rimraf.sync(libDir);
  log.info('Cleaned lib');

  const files = glob.sync('**/*', {
    dot: true,
    nodir: true,
    cwd: srcDir,
  });

  for (let i = 0, l = files.length; i < l; i++) {
    switch (path.extname(files[i])) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        compileSource(files[i]);
        break;
      default:
        copyTask(files[i]);
        break;
    }
  }

  function compileSource(file) {
    const source = path.join(srcDir, file);
    const dest = path.join(libDir, file);
    const destData = path.parse(dest);

    delete destData.base;
    destData.ext = '.js';

    // make sure dir exists
    mkdirp.sync(destData.dir);
    // filename need to expose to @babel/preset-typescript
    const { code } = babel.transformFileSync(source, Object.assign(babelConfig, {
      filename: file,
    }));
    writeFileSync(path.format(destData), code, 'utf-8');
    dtsCompile({ filePath: file, sourceFile: source, destPath: libDir });
    log.info(`Compile ${file}`);
  }

  function copyTask(file) {
    const source = path.join(srcDir, file);
    const dest = path.join(libDir, file);
    // make sure dir exists
    mkdirp.sync(path.dirname(dest));

    createReadStream(source)
      .pipe(createWriteStream(dest))
      .on('close', () => {
        log.info(`Copy ${file}`);
      });
  }
  // https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#getting-the-dts-from-a-javascript-file
  function dtsCompile({ filePath, sourceFile, destPath }) {
    const REG_TS = /\.(tsx?)$/;
    const isTS = REG_TS.test(filePath);
    if (!isTS) return;
    const compilerOptions = {
      allowJs: true,
      declaration: true,
      emitDeclarationOnly: true,
    };
    const dtsPath = filePath.replace(REG_TS, '.d.ts');
    const targetPath = path.join(destPath, dtsPath);
    // Create a Program with an in-memory emit
    let createdFiles = {};
    const host = ts.createCompilerHost(compilerOptions);
    host.writeFile = (fileName, contents) => createdFiles[fileName] = contents;
    // Prepare and emit the d.ts files
    const program = ts.createProgram([sourceFile], compilerOptions, host);
    program.emit();
    const fileNamesDTS = sourceFile.replace(REG_TS, '.d.ts');
    const content = createdFiles[fileNamesDTS];
    // write file
    if (content) {
      ensureDirSync(path.dirname(targetPath));
      writeFileSync(targetPath, content, 'utf-8');
      log.info(`Generate ${path.basename(targetPath)}`);
    }
    // release
    createdFiles = null;
  }
};

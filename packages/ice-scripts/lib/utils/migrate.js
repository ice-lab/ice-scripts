const path = require('path');
const fs = require('fs-extra');
const parser = require('@babel/parser');
const generate = require('@babel/generator');
const traverse = require('@babel/traverse');
const t = require('@babel/types');
const prettier = require('prettier');
const { getLatestVersion } = require('ice-npm-utils');

const pluginMigrateMap = {
  'ice-plugin-fusion': 'build-plugin-fusion',
  'ice-plugin-antd': 'build-plugin-antd',
  'ice-plugin-component': 'build-plugin-component',
  'ice-plugin-css-assets-local': 'build-plugin-css-assets-local',
  'ice-plugin-moment-locales': 'build-plugin-moment-locales',
  'ice-plugin-modular-import': 'build-plugin-modular-import',
  'ice-plugin-load-assets': 'build-plugin-load-assets',
  'ice-plugin-smart-debug': 'build-plugin-smart-debug',
  'ice-plugin-block': 'build-plugin-block',
  '@ali/ice-plugin-def': '@ali/build-plugin-ice-def',
};

(async () => {
  const dir = process.cwd();
  // check ice.config.js
  const configFilePath = path.join(dir, 'build.json');
  const iceConfigPath = path.join(dir, 'ice.config.js');
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(configFilePath)) {
    console.log('当前目录下已存在 build.json 配置，更多配置信息请查看 https://ice.work/')
    return;
  }

  if (!fs.existsSync(iceConfigPath)) {
    console.log('自动迁移工具目前仅支持 ice-scripts 2.x 向 build-scripts 迁移，其他工程迁移，请联系 ICE 团队');
    return;
  }

  if (!fs.existsSync(pkgPath)) {
    console.log('未找到 package.json 文件，请在项目根目录执行迁移');
    return;
  }

  const pkgData = fs.readJSONSync(pkgPath);
  const iceConfigContent = fs.readFileSync(iceConfigPath, 'utf-8');

  // backup
  fs.copyFileSync(iceConfigPath, path.join(dir, 'ice.config.backup.js'));
  fs.copyFileSync(pkgPath, path.join(dir, 'package.backup.json'));

  const configs = {plugins: []};
  let customNode = null;
  let customParam = null;
  let declarations = [];
  const npmCollect = {
    add: ['@alib/build-scripts'],
    remove: ['ice-scripts'],
  };
  const migratePlugin = (add, remove) => {
    configs.plugins.push(add);
    npmCollect.add.push(Array.isArray(add) ? add[0] : add);
    if (remove) {
      npmCollect.remove.push(remove);
    }
  };
  if (!pkgData.componentConfig) {
    migratePlugin('build-plugin-react-app');
  }

  const parseConfig = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'decorators-legacy', 'dynamicImport', 'classProperties'],
  };
  const ast = parser.parse(iceConfigContent, parseConfig);
  traverse.default(ast, {
    Program(nodePath){
      const { node } = nodePath;
      node.body.forEach(bodyNode => {
        if (t.isExpressionStatement(bodyNode) && checkExportNode(bodyNode.expression)) {
          bodyNode.expression.right.properties.forEach(property => {
            const propertyKey = property.key.name;
            if (propertyKey === 'chainWebpack') {
              customNode = property.value.body.body;
              customParam = property.value.params;
            } else if (propertyKey === 'plugins') {
              // 插件配置比为数组形式
              if (t.isArrayExpression(property.value)) {
                const elements = property.value.elements;
                elements.forEach(element => {
                  let pluginInfo;
                  if (t.isArrayExpression(element)) {
                    pluginInfo = element.elements;
                  } else {
                    pluginInfo = [element];
                  }
                  const [nameNode, optionNode] = pluginInfo;
                  const pluginName = nameNode.value;
                  const migrateName = pluginMigrateMap[pluginName];
                  if (migrateName) {
                    if (!optionNode) {
                      migratePlugin(migrateName, pluginName);
                    } else if (['ice-plugin-multi-pages'].includes(pluginName) && optionNode) {
                      // 特殊配置迁移处理，ice-plugin-multi-pages 配置移除
                      console.log(`插件${pluginName}配置迁移，请查看 build-scripts 迁移文档`);
                      migratePlugin(migrateName, pluginName);
                    } else {
                      let options = null;
                      try {
                        options = getNodeValue(optionNode);
                      } catch (error) {
                        console.log(`插件${pluginName}配置无法自定迁移，请手动处理`)
                      }
                      // 特殊配置迁移，ice-plugin-load-assets dev => start
                      if (pluginName === 'ice-plugin-load-assets' && options.assets && options.assets.dev) {
                        options.assets.start = [...options.assets.dev];
                        delete options.assets.dev;
                      }
                      migratePlugin(options ? [migrateName, options] : [migrateName], pluginName);
                    }
                  } else {
                    console.log(`请手动迁移插件${pluginName}`);
                  }
                })
              }
            } else {
              if (checkJsonValue(property.value)) {
                configs[propertyKey] = property.value.value;
              } else {
                try {
                  configs[propertyKey] = getNodeValue(property.value);
                } catch(error) {
                  console.log(`${propertyKey} 无法自动解析到 JSON 请手动处理`);
                }
              }
            }
          });
        } else {
          declarations.push(bodyNode);
        }
      })
    },
  });

  if (customNode) {
    // 写入本地插件
    const ast = parser.parse(`
      module.exports = ({ onGetWebpackConfig, context }) => {
        const { command } = context;
        onGetWebpackConfig((config) => {});
      };`, parseConfig);
    try {
      traverse.default(ast, {
        Program(nodePath) {
          if (declarations.length) {
            const { node } = nodePath;
            node.body = declarations.concat(node.body);
            declarations = [];
          }
        },
        CallExpression(nodePath) {
          const { node } = nodePath;
          if (t.isIdentifier(node.callee, { name: 'onGetWebpackConfig'})) {
            node.arguments[0].body.body = customNode;
            if (customParam && customParam[0]) {
              node.arguments[0].params[0] = customParam[0];
            }
          }
          if (
            t.isMemberExpression(node.callee)
            && t.isIdentifier(node.callee.property, { name: 'minimizer'})
            && node.arguments && node.arguments[0] && t.isStringLiteral(node.arguments[0])
            && node.arguments[0].value === 'UglifyJsPlugin'
          ) {
            // UglifyJsPlugin => TerserPlugin
            node.arguments[0].value = 'TerserPlugin';
          }
        },
        BinaryExpression(nodePath) {
          // 自动迁移 dev => start
          const { node } = nodePath;
          if (
            (node.operator === '===' || node.operator === '==')
            && t.isIdentifier(node.left, { name: 'command'})
            && t.isStringLiteral(node.right)
            && node.right.value === 'dev'
          ) {
            node.right.value = 'start';
          }
        },
      });

      const { code } = generate.default(ast, {});
      const content =  prettierCode(code.replace('\n', ''));
      const localPlugin = 'local-plugin.js';
      fs.writeFileSync(path.join(dir, localPlugin), content, 'utf-8');
      configs.plugins.push(`./${localPlugin}`);
    } catch (error) {
      console.log('自定义 webpack 配置迁移失败，请手动迁移');
      console.log(error);
    }
  }
  // reorder plugin
  const buildPlugins = [...configs.plugins];
  delete configs.plugins;
  // generate build.json
  fs.writeJSONSync(configFilePath, { ...configs, plugins: buildPlugins }, { spaces: 2 });

  // migrate abc.json
  const defConfigPath = path.join(dir, 'abc.json');
  const isDEF = fs.existsSync(defConfigPath);
  if (isDEF) {
    // abc.json 变更无逻辑变化，无需备份
    const jsonString = JSON.stringify({
      type: 'build-scripts',
      builder: '@ali/builder-ice-app'
    }, null, 2);
    fs.writeFileSync(defConfigPath, jsonString, 'utf-8');
  }

  // modify pdgData
  pkgData.scripts = pkgData.scripts || {};
  pkgData.scripts.start = 'build-scripts start';
  pkgData.scripts.build = 'build-scripts build';

  pkgData.devDependencies = pkgData.devDependencies || {};
  const devDependencies = [];
  for (const npm of npmCollect.add) {
    devDependencies.push({ key: npm, version: `^${await getLatestVersion(npm)}` });
  }
  npmCollect.remove.forEach((npm) => {
    delete pkgData.devDependencies[npm];
  });
  Object.keys(pkgData.devDependencies).forEach(key => {
    devDependencies.push({ key, version: pkgData.devDependencies[key] });
  });
  // reorder devDependencies
  devDependencies.sort((a, b) => (a > b));
  pkgData.devDependencies = {};
  devDependencies.forEach(({key, version}) => {pkgData.devDependencies[key] = version;});

  // generate package.json
  fs.writeJSONSync(pkgPath, pkgData, {
    spaces: 2
  });

  console.log('自动迁移完成，更多信息请查看 https://ice.work/');
})()

function checkExportNode(node) {
  return node && t.isAssignmentExpression(node) && t.isMemberExpression(node.left)
    && t.isIdentifier(node.left.object, { name: 'module'})
    && t.isIdentifier(node.left.property, { name: 'exports'});
}

function checkJsonValue(node) {
  return t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node);
}

function getNodeValue(node) {
  if (t.isArrayExpression(node)) {
    return node.elements.map(element => getNodeValue(element));
  } else if (t.isObjectExpression(node)) {
    const value = {};
    node.properties.forEach(property => {
      value[property.key.name || property.key.value] = getNodeValue(property.value);
    });
    return value;
  } else if (checkJsonValue(node)) {
    return node.value;
  } else {
    throw new Error('无法自动解析到 JSON');
  }
}

function prettierCode(code) {
  prettier.format(code, {
    singleQuote: true,
    trailingComma: 'es5',
    parser: 'typescript',
  });
}

const path = require('path');
const Context = require('../../lib/core/Context');

describe('init context', () => {
  const context = new Context({
    rootDir: path.join(__dirname, '../fixtures/service'),
    args: {
      disabledReload: false,
    },
  });
  test('get ice.config.js', () => {
    expect(context.userConfig.publicPath).toBe('/');
  });
  test('load plugins', () => {
    // builtInPlugins length is 2
    expect(context.plugins.length).toBe(6);
  });

  it('plugin with option', async (done) => {
    await context.runPlugins();
    const webpackConfig = context.getWebpackConfig();
    expect(webpackConfig.resolve.alias).toEqual({ react: 'b' });
    done();
  });

  it('require plugin', async (done) => {
    await context.runPlugins();
    const webpackConfig = context.getWebpackConfig();
    expect(webpackConfig.output.filename).toBe('[name].bundle.js');
    done();
  });

  it('plugin defined by string', async (done) => {
    await context.runPlugins();
    const webpackConfig = context.getWebpackConfig();
    expect(webpackConfig.output.path).toBe('custom');
    done();
  });

  it('default values', async (done) => {
    await context.runPlugins();
    const webpackConfig = context.getWebpackConfig();
    expect(webpackConfig.resolve.extensions).toEqual(['.js', '.jsx', '.json', '.html', '.ts', '.tsx']);
    expect(webpackConfig.entry.index).toEqual([
      path.resolve(process.cwd(), 'src/index.js'),
    ]);
    done();
  });
});


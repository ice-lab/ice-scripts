const { execSync } = require('child_process');

describe('jest test', () => {
  test('typescript test', () => {
    execSync('cd test/jest/ts && node ../../../bin/ice-scripts-test.js');
    expect(1).toBe(1);
  });
  test('alias test', () => {
    execSync('cd test/jest/alias && node ../../../bin/ice-scripts-test.js');
    expect(1).toBe(1);
  });
  test('custom config test', () => {
    execSync('cd test/jest/customConfig && node ../../../bin/ice-scripts-test.js');
    expect(1).toBe(1);
  });
  test('specify regexForTestFiles', () => {
    execSync('cd test/jest/testFiles && node ../../../bin/ice-scripts-test.js **/test.e2e.js');
    expect(1).toBe(1);
  });
});

## Install

```bash
npm install resolve-sass-import --save
```

## Usage

```js
const resolveSassImport = require('resolve-sass-import');
const sassContent = resolveSassImport('main.scss', path.resolve(process.cwd(), 'src'));
```
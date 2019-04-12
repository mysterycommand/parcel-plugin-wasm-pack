const path = require('path');

const fs = require('@parcel/fs');

const { loaderTemplate, bindgenTemplate } = require('../templates');

async function generateBrowser() {
  const { dir, initPath, wasmPath } = this;

  const loader = await getBrowserLoaderString(initPath);
  await fs.writeFile(require.resolve('../loader.js'), loader);

  let fromPath = path.relative(dir, wasmPath);
  if (fromPath[0] !== '.') {
    fromPath = `./${fromPath}`;
  }
  fromPath.replace('\\', '/');

  return [
    {
      type: 'js',
      value: getBrowserBindgenString(fromPath, loader),
    },
  ];
}

async function getBrowserLoaderString(initPath) {
  return (await fs.readFile(initPath))
    .toString()
    .replace('(function() {', '')
    .replace(
      'self.wasm_bindgen = Object.assign(init, __exports);',
      loaderTemplate(),
    )
    .replace('})();', '');
}

function* matches(regex, str) {
  let match;
  while ((match = regex.exec(str)) !== null) {
    yield match;
  }
}

function getBrowserBindgenString(fromPath, loader) {
  return bindgenTemplate(
    fromPath,
    Array.from(matches(/__exports.(\w+)/g, loader)),
  );
}

async function generateElectronOrNode() {
  return [];
}

module.exports = { generateBrowser, generateElectronOrNode };

const fs = require('@parcel/fs');

const { loaderTemplate, bindgenTemplate } = require('../templates');

async function generateBrowser() {
  const loader = await getBrowserLoaderString();
  await fs.writeFile(require.resolve('./loader.js'), loader);

  return [
    {
      type: 'js',
      value: getBrowserBindgenString(loader),
    },
  ];
}

async function getBrowserLoaderString() {
  const { initPath } = this;

  return (await fs.readFile(initPath))
    .toString()
    .replace('(function() {', '')
    .replace(
      'self.wasm_bindgen = Object.assign(init, __exports);',
      loaderTemplate,
    )
    .replace('})();', '');
}

function* matches(regex, str) {
  let match;
  while ((match = regex.exec(str)) !== null) {
    yield match;
  }
}

function getBrowserBindgenString(loader) {
  const { dir, wasmPath } = this;

  return bindgenTemplate(
    path.relative(dir, wasmPath),
    Array.from(matches(/__exports.(\w+)/g, loader)),
  );
}

async function generateElectronOrNode() {
  return [];
}

module.exports = { generateBrowser, generateElectronOrNode };

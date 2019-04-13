const path = require('path');

const fs = require('@parcel/fs');

const {
  bindgenTemplate,
  browserLoaderTemplate,
  nodeOrElectronLoaderTemplate,
} = require('../templates');

function rel(from, to) {
  let relativePath = path.relative(from, to);

  if (relativePath[0] !== '.') {
    relativePath = `./${relativePath}`;
  }

  return relativePath.replace('\\', '/');
}

function* matches(regex, str) {
  let match;
  while ((match = regex.exec(str)) !== null) {
    yield match;
  }
}

function getBindgenString(fromPath, loader) {
  return bindgenTemplate(
    fromPath,
    Array.from(matches(/__exports.(\w+)/g, loader)),
  );
}

async function generateBrowser() {
  const { dir, initPath, wasmPath } = this;

  const loader = await getBrowserLoaderString(initPath);
  await fs.writeFile(require.resolve('../loader.js'), loader);

  const fromPath = rel(dir, wasmPath);

  return [
    {
      type: 'js',
      value: getBindgenString(fromPath, loader),
    },
  ];
}

async function getBrowserLoaderString(initPath) {
  return (await fs.readFile(initPath))
    .toString()
    .replace('(function() {', '')
    .replace(
      'self.wasm_bindgen = Object.assign(init, __exports);',
      browserLoaderTemplate(),
    )
    .replace('})();', '');
}

async function generateElectronOrNode() {
  const { rustName, dir, initPath, wasmPath } = this;

  const loader = await getElectronOrNodeLoaderString(initPath, rustName);
  await fs.writeFile(require.resolve('../loader.js'), loader);

  const fromPath = rel(dir, wasmPath);

  return [
    {
      type: 'js',
      value: getBindgenString(fromPath, loader),
    },
  ];
}

const initStart = `^(?:function init\\(module_or_path, maybe_memory\\) {)`;
const thenStart = `return result(\\.then\\(\\({instance, module}\\) => {`;
const thenEnd = `}\\);)`;
const initEnd = `(?:self\\.wasm_bindgen = Object\\.assign\\(init, __exports\\);)$`;
const init = new RegExp(
  `${initStart}.*${thenStart}.*${thenEnd}.*${initEnd}`,
  'gms',
);

async function getElectronOrNodeLoaderString(initPath, rustName) {
  return (await fs.readFile(initPath))
    .toString()
    .replace(
      '(function() {',
      "const { TextEncoder, TextDecoder } = require('util');",
    )
    .replace(init, (_, finalThen) =>
      nodeOrElectronLoaderTemplate(rustName, finalThen),
    )
    .replace('})();', '');
}

module.exports = { generateBrowser, generateElectronOrNode };

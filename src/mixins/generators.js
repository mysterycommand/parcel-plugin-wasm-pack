const fs = require('@parcel/fs');

const { rel, matches } = require('../helpers');
const {
  bindgenTemplate,
  browserLoaderTemplate,
  nodeOrElectronLoaderTemplate,
} = require('../templates');

async function generateBrowser() {
  const { dir, initPath, wasmPath } = this;

  const loader = await getBrowserLoaderString(initPath);
  await fs.writeFile(require.resolve('../loader.js'), loader);

  const fromPath = rel(dir, wasmPath);

  return [
    {
      type: 'js',
      value: bindgenTemplate(
        fromPath,
        Array.from(matches(/__exports.(\w+)/g, loader)),
      ),
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
      value: bindgenTemplate(
        fromPath,
        Array.from(matches(/__exports.(\w+)/g, loader)),
      ),
    },
  ];
}

async function getElectronOrNodeLoaderString(initPath, rustName) {
  const a = `^(?:function init\\(module_or_path, maybe_memory\\) {)`;
  const b = `return result(\\.then\\(\\({instance, module}\\) => {`;
  const c = `}\\);)`;
  const d = `(?:self\\.wasm_bindgen = Object\\.assign\\(init, __exports\\);)$`;

  /**
   * matches everything from `function init(module_or_path, maybe_memory) {` to
   * `self.wasm_bindgen = Object.assign(init, __exports);` and captures the
   * final `then` clause of `wasm-pack`'s `no-modules` initializer, which is
   * what does the assignment to `wasm` ... it looks like this:
   *
   * ```
   * .then(({instance, module}) => {
   *   wasm = instance.exports;
   *   init.__wbindgen_wasm_module = module;
   *
   *   return wasm;
   * });
   * ```
   */
  const init = new RegExp(`${a}.*${b}.*${c}.*${d}`, 'gms');

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

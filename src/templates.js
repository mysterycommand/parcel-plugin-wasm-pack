const loadWasmBundleString = `
module.exports = function loadWasmBundle(bundle) {
  return wasm_bindgen(bundle).then(() => __exports);
};
`;

const bindgenTemplate = (from, lines) => `\
import wasm from '${from}';
export default wasm;
${lines.map(([, name]) => `export const ${name} = wasm.${name};`).join('\n')}
`;

const browserLoaderTemplate = () => `\
const wasm_bindgen = Object.assign(init, __exports);
${loadWasmBundleString}
`;

const nodeOrElectronLoaderTemplate = (rustName, finalThen) => `\
function init(module_or_path, maybe_memory) {
  const path = require('path').join(__dirname, module_or_path);

  return new Promise(function(resolve, reject) {
    require('fs').readFile(path, function(err, data) {
      if (err) {
        reject(err);
      }

      resolve(data.buffer);
    });
  })
    .then(data => WebAssembly.instantiate(data, { './${rustName}': __exports }))
    ${finalThen}
}

const wasm_bindgen = Object.assign(init, __exports);
${loadWasmBundleString}
`;

module.exports = {
  bindgenTemplate,
  browserLoaderTemplate,
  nodeOrElectronLoaderTemplate,
};

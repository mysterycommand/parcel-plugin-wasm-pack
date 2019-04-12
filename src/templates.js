const bindgenTemplate = (from, lines) => `\
import wasm from '${from}';
export default wasm;
${lines.map(([, name]) => `export const ${name} = wasm.${name};`).join('\n')}
`;

const loaderTemplate = `\
const wasm_bindgen = Object.assign(init, __exports);

module.exports = function loadWasmBundle(bundle) {
  return wasm_bindgen(bundle).then(() => __exports);
};
`;

module.exports = { bindgenTemplate, loaderTemplate };

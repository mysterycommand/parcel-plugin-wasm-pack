module.exports = function loadWasmBundle(bundle) {
  const init = require(bundle.replace('_bg.wasm', '.js'));
  return init(bundle).then(wasm => wasm);
};

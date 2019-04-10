import * as importObject from './RUST_NAME';

async function loadWasmBundle(bundlePath) {
  return fetch(bundlePath)
    .then(response =>
      WebAssembly.instantiateStreaming
        ? WebAssembly.instantiateStreaming(response, {
            './RUST_NAME': importObject,
          })
        : response.arrayBuffer().then(data => WebAssembly.instantiate(data), {
            './RUST_NAME': importObject,
          }),
    )
    .then(wasm => wasm.instance.exports);
}

export default loadWasmBundle('./WASM_PATH');

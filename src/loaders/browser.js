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

const wasm = await loadWasmBundle('./WASM_PATH');

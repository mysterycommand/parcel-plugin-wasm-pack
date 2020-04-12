function isFetchable(value) {
  return (
    value instanceof URL ||
    typeof value === 'string' ||
    value instanceof Request
  );
}

function isWasmInstance(value) {
  return value instanceof WebAssembly.Instance;
}

const canInstantiateStreaming =
  typeof WebAssembly.instantiateStreaming === 'function';

const streamErrorMessage = [
  '`WebAssembly.instantiateStreaming` failed. Assuming this is because your',
  'server does not serve wasm with `application/wasm` MIME type. Falling back',
  'to `WebAssembly.instantiate` which is slower. Original error:\n',
].join(' ');

function instantiate(request, imports) {
  return request
    .then((response) => response.arrayBuffer())
    .then((bytes) => WebAssembly.instantiate(bytes, imports));
}

function instantiateRequest(request, imports) {
  return canInstantiateStreaming
    ? WebAssembly.instantiateStreaming(request, imports).catch((e) => {
        console.warn(streamErrorMessage, e);
        return instantiate(request, imports);
      })
    : instantiate(request, imports);
}

async function instantiateModule(module, imports) {
  const result = await WebAssembly.instantiate(module, imports);
  return isWasmInstance(result) ? { instance: result, module } : result;
}

export async function load(wasm, imports) {
  const { instance, module } = await (isFetchable(wasm)
    ? instantiateRequest(fetch(wasm), imports)
    : instantiateModule(wasm, imports));

  load.__wbindgen_wasm_module = module;
  return instance.exports;
}

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

export async function load(wasm, imports) {
  const wasmPath = path.join(__dirname, wasm);
  const bytes = await readFile(wasmPath);

  const wasmModule = new WebAssembly.Module(bytes);
  const wasmInstance = new WebAssembly.Instance(wasmModule, imports);

  load.__wbindgen_wasm_module = wasmModule;
  return wasmInstance.exports;
}

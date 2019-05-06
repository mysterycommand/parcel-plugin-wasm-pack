const path = require('path');

const JSPackager = require('parcel-bundler/src/packagers/JSPackager');

class WasmPackPackager extends JSPackager {
  async writeBundleLoaders() {
    const assets = Array.from(this.bundle.assets.values());
    const wasmAsset = assets.find(({ isWasm }) => isWasm);

    if (!wasmAsset) {
      return await super.writeBundleLoaders();
    }

    const mod = `
require('./lib.rs')
  .then(wasm => {
    module.bundle.register('hi', wasm);
  })
  .then(() => {
    require('./entry.ts');
  });
`;
    const deps = { './lib.rs': 'jBO1', './entry.ts': 'QAnz' };
    await this.writeModule(0, mod, deps);
    return true;
  }

  // async end() {
  //   await super.end();
  //   debugger;
  // }
}

module.exports = WasmPackPackager;

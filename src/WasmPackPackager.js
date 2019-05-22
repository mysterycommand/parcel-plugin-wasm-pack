const path = require('path');

const JSPackager = require('parcel-bundler/src/packagers/JSPackager');

const { rel } = require('./helpers');

const moduleTpl = (wasmName, wasmId, entryName) => `\
require("${wasmName}")
  .then(wasm => {
    // replace the entry in the cache with the loaded wasm module
    module.bundle.cache["${wasmId}"] = null;
    module.bundle.register("${wasmId}", wasm);
  })
  .then(() => {
    require("${entryName}");
  });
`;

class WasmPackPackager extends JSPackager {
  async writeBundleLoaders() {
    const assets = [...this.bundle.assets.values()];
    const wasmAsset = assets.find(({ isWasm }) => isWasm);

    if (!wasmAsset) {
      return await super.writeBundleLoaders();
    }

    const { entryAsset } = this.bundle;

    const wasmName = rel(path.dirname(entryAsset.name), wasmAsset.name);
    const entryName = rel(path.dirname(entryAsset.name), entryAsset.name);

    /**
     * make sure we don't add the original entry to the final bundle's entries
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/packagers/JSPackager.js#L225-L227
     */
    this.externalModules.add('');

    const mod = moduleTpl(wasmName, wasmAsset.id, entryName);
    const deps = {
      [wasmName]: wasmAsset.id,
      [entryName]: entryAsset.id,
    };

    /**
     * asset ids normally start at 1, so this should be safe
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/packagers/JSPackager.js#L204
     */
    await this.writeModule(0, mod, deps);
    return true;
  }
}

module.exports = WasmPackPackager;

const path = require('path');

const JSPackager = require('parcel-bundler/src/packagers/JSPackager');

const { rel } = require('./helpers');

const entryTpl = (entryName, wasmDeps) => `\
function cacheReplace(id, mod) {
  // replace the entry in the cache with the loaded wasm module
  module.bundle.cache[id] = null;
  module.bundle.register(id, mod);
}

Promise.all([
  ${Object.entries(wasmDeps)
    .map(
      ([name, id]) =>
        `require("${name}").then(wasm => cacheReplace("${id}", wasm))`,
    )
    .join(',\n  ')}
]).then(() => {
  require("${entryName}");
});
`;

class WasmPackPackager extends JSPackager {
  async writeBundleLoaders() {
    const assets = [...this.bundle.assets.values()];
    const wasmAssets = assets.filter(({ isWasm }) => isWasm);

    if (wasmAssets.length === 0) {
      return await super.writeBundleLoaders();
    }

    const { entryAsset } = this.bundle;
    const entryName = rel(path.dirname(entryAsset.name), entryAsset.name);
    const wasmDeps = wasmAssets.reduce((acc, { name, id }) => {
      const wasmName = rel(path.dirname(entryAsset.name), name);
      acc[wasmName] = id;
      return acc;
    }, {});

    /**
     * make sure we don't add the original entry to the final bundle's entries
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/packagers/JSPackager.js#L225-L227
     */
    this.externalModules.add('');

    const mod = entryTpl(entryName, wasmDeps);
    const deps = {
      ...wasmDeps,
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

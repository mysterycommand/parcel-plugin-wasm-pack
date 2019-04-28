module.exports = function(bundler) {
  /**
   * Delete the default wasm loader. We need to do our own loading.
   *
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/Bundler.js#L44-L47
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/Bundler.js#L201
   */
  delete bundler.bundleLoaders.wasm;

  bundler.addAssetType('toml', require.resolve('./src/WasmPackAsset'));
  bundler.addAssetType('rs', require.resolve('./src/WasmPackAsset'));

  bundler.addPackager('wasm', require.resolve('./src/WasmPackPackager'));
};

module.exports = function(bundler) {
  delete bundler.bundleLoaders['wasm'];

  bundler.addAssetType('toml', require.resolve('./src/WasmPackTomlAsset'));
  bundler.addAssetType('rs', require.resolve('./src/WasmPackRustAsset'));
};

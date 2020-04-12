module.exports = function (bundler) {
  delete bundler.bundleLoaders.wasm;

  bundler.addAssetType('toml', require.resolve('./src/WasmPackAsset'));
  bundler.addAssetType('rs', require.resolve('./src/WasmPackAsset'));

  bundler.addPackager('js', require.resolve('./src/WasmPackPackager'));
};

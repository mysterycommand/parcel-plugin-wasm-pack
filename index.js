module.exports = function(bundler) {
  bundler.addBundleLoader('wasm', require.resolve('./src/loader.js'));

  bundler.addAssetType('toml', require.resolve('./src/WasmPackAsset'));
  bundler.addAssetType('rs', require.resolve('./src/WasmPackAsset'));
};

module.exports = function(bundler) {
  bundler.addAssetType('toml', require.resolve('./src/WasmPackTomlAsset'));
  bundler.addAssetType('rs', require.resolve('./src/WasmPackRustAsset'));
};

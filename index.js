const { existsSync, writeFileSync } = require('fs');
const { join } = require('path');

const loaderPath = join(__dirname, 'src/loader.js');
if (!existsSync(loaderPath)) {
  writeFileSync(loaderPath, '');
}

module.exports = function(bundler) {
  bundler.addBundleLoader('wasm', require.resolve('./src/loader.js'));

  bundler.addAssetType('toml', require.resolve('./src/WasmPackTomlAsset'));
  bundler.addAssetType('rs', require.resolve('./src/WasmPackRustAsset'));
};

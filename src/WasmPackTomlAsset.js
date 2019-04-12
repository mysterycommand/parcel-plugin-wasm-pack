const path = require('path');

const TomlAsset = require('parcel-bundler/src/assets/TOMLAsset');

class WasmPackTomlAsset extends TomlAsset {
  get isCargoToml() {
    return path.basename(this.name) === 'Cargo.toml';
  }

  async parse(code) {
    if (!this.isCargoToml) {
      return super.parse(code);
    }

    // do wasm-pack stuff
  }

  async generate() {
    if (!this.isCargoToml) {
      return super.generate();
    }

    // other wasm-pack stuff?
  }
}

module.exports = WasmPackTomlAsset;

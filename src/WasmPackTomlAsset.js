const path = require('path');

const TomlAsset = require('parcel-bundler/src/assets/TOMLAsset');

class WasmPackTomlAsset extends TomlAsset {
  get isCargoToml() {
    return path.basename(this.name) === 'Cargo.toml';
  }

  constructor(name, options) {
    super(name, options);

    if (this.isCargoToml) {
      this.type = 'wasm';
    }
  }

  parse(code) {
    if (!this.isCargoToml) {
      return super.parse(code);
    }

    // do wasm-pack stuff
  }

  generate() {
    if (!this.isCargoToml) {
      return super.generate();
    }

    // other wasm-pack stuff?
  }
}

module.exports = WasmPackTomlAsset;

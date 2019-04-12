const path = require('path');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');

const { cargoInstall } = require('./cargo-install');
const { getCargoConfig, ensureCargoConfig } = require('./mixins/cargo-config');
const { wasmPackBuild, postBuild, getDepsPath } = require('./mixins/wasm-pack');
const {
  generateBrowser,
  generateElectronOrNode,
} = require('./mixins/generators');

class WasmPackRustAsset extends RustAsset {
  constructor(name, options) {
    super(name, options);

    this.type = 'js';
    this.dir = path.dirname(this.name);

    Object.entries({
      // @see: './mixins/cargo-config'
      getCargoConfig,
      ensureCargoConfig,

      // @see: './mixins/wasm-pack'
      wasmPackBuild,
      postBuild,
      getDepsPath,

      // @see: './mixins/generators'
      generateBrowser,
      generateElectronOrNode,
    }).forEach(([name, fn]) => {
      this[name] = fn.bind(this);
    });
  }

  async parse() {
    /**
     * checks that 'rustup' is installed, installs the nightly toolchain, and the wasm32-unknown-unknown target
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L66
     */
    await this.installRust();

    /**
     * calling `getCargoConfig` creates:
     *
     * this.cargoConfig = {};
     * this.cargoDir = '';
     * this.isMainFile = false;
     */
    await this.getCargoConfig();
    await cargoInstall('wasm-pack');
    await cargoInstall('wasm-bindgen', 'wasm-bindgen-cli');

    if (this.isMainFile) {
      await this.ensureCargoConfig();
      await this.wasmPackBuild();

      /**
       * calling `postBuild` creates:
       *
       * this.pkgDir = '';
       * this.rustName = '';
       * this.depsPath = '';
       * this.wasmPath = '';
       * this.initPath = '';
       */
      await this.postBuild();
    } else {
      throw new Error(
        `Couldn't figure out what to do with ${
          this.name
        }. It should be a "main file" (lib.rs or main.rs) or a Cargo.toml`,
      );
    }
  }

  async generate() {
    return this.options.target === 'browser'
      ? await this.generateBrowser()
      : await this.generateElectronOrNode();
  }
}

module.exports = WasmPackRustAsset;

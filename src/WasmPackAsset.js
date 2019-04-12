const path = require('path');

const logger = require('@parcel/logger');

const { Asset } = require('parcel-bundler');
const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const TomlAsset = require('parcel-bundler/src/assets/TOMLAsset');

const { cargoInstall } = require('./cargo-install');
const { getCargoConfig, ensureCargoConfig } = require('./mixins/cargo-config');
const { wasmPackBuild, postBuild, getDepsPath } = require('./mixins/wasm-pack');
const {
  generateBrowser,
  generateElectronOrNode,
} = require('./mixins/generators');

class WasmPackAsset extends Asset {
  get isWasm() {
    return (
      path.extname(this.name) === '.rs' ||
      path.basename(this.name) === 'Cargo.toml'
    );
  }

  constructor(name, options) {
    super(name, options);
    this.type = 'js';

    if (!this.isWasm) {
      // if this isn't `*.rs` or `Cargo.toml` then it's just a vanilla `*.toml`
      // file and we don't need to bother with any of this mixin/state stuff
      return;
    }

    logger.verbose(`${this.name} is a wasm target`);
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
      logger.verbose(`binding ${name}`);
      this[name] = fn.bind(this);
    }, this);
  }

  async process() {
    if (!this.isWasm) {
      return super.process();
    }

    return RustAsset.prototype.process.call(this);
  }

  async parse(code) {
    if (!this.isWasm) {
      return TomlAsset.prototype.parse.call(this, code);
    }

    /**
     * checks that 'rustup' is installed, installs the nightly toolchain, and
     * the wasm32-unknown-unknown target
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L66
     */
    await RustAsset.prototype.installRust.call(this);

    /**
     * calling `getCargoConfig` creates:
     *
     * this.cargoConfig = {};
     * this.cargoDir = '';
     * this.isMainFile = false;
     */
    await this.getCargoConfig();
    logger.verbose(`cargoConfig:`);
    JSON.stringify(this.cargoConfig, null, 2)
      .split('\n')
      .forEach(line => logger.verbose(line));
    logger.verbose(`cargoDir: ${this.cargoDir}`);
    logger.verbose(`isMainFile: ${this.isMainFile}`);

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
      logger.verbose(`pkgDir: ${this.pkgDir}`);
      logger.verbose(`rustName: ${this.rustName}`);
      logger.verbose(`depsPath: ${this.depsPath}`);
      logger.verbose(`wasmPath: ${this.wasmPath}`);
      logger.verbose(`initPath: ${this.initPath}`);
    } else {
      throw new Error(
        `Couldn't figure out what to do with ${
          this.name
        }. It should be a "main file" (lib.rs or main.rs) or a Cargo.toml`,
      );
    }
  }

  async collectDependencies() {
    if (!this.isWasm) {
      return super.collectDependencies();
    }

    return RustAsset.prototype.collectDependencies.call(this);
  }

  async generate() {
    if (!this.isWasm) {
      return TomlAsset.prototype.generate.call(this);
    }

    return this.options.target === 'browser'
      ? await this.generateBrowser()
      : await this.generateElectronOrNode();
  }
}

module.exports = WasmPackAsset;

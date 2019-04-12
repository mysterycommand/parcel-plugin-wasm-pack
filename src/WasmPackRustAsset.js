const path = require('path');

const fs = require('@parcel/fs');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');

const { cargoInstall } = require('./cargo-install');
const { loaderTemplate, bindgenTemplate } = require('./templates');
const { getCargoConfig, ensureCargoConfig } = require('./mixins/cargo-config');
const { wasmPackBuild, postBuild, getDepsPath } = require('./mixins/wasm-pack');

function* matches(regex, str) {
  let match;
  while ((match = regex.exec(str)) !== null) {
    yield match;
  }
}

class WasmPackRustAsset extends RustAsset {
  constructor(name, options) {
    super(name, options);

    this.type = 'js';
    this.dir = path.dirname(this.name);

    this.getCargoConfig = getCargoConfig.bind(this);
    /*
    this.cargoConfig = {};
    this.cargoDir = '';
    this.isMainFile = false;
    */

    this.ensureCargoConfig = ensureCargoConfig.bind(this);

    this.wasmPackBuild = wasmPackBuild.bind(this);

    this.postBuild = postBuild.bind(this);
    /*
    this.pkgDir = '';
    this.rustName = '';

    this.depsPath = '';
    this.wasmPath = '';
    this.initPath = '';
    */

    this.getDepsPath = getDepsPath.bind(this);
  }

  async parse() {
    /**
     * checks that 'rustup' is installed, installs the nightly toolchain, and the wasm32-unknown-unknown target
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L66
     */
    await this.installRust();

    await this.getCargoConfig();
    await cargoInstall('wasm-pack');
    await cargoInstall('wasm-bindgen', 'wasm-bindgen-cli');

    if (this.isMainFile) {
      await this.ensureCargoConfig();
      await this.wasmPackBuild();
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

  async generateBrowser() {
    const loader = await this.getBrowserLoaderString();
    await fs.writeFile(require.resolve('./loader.js'), loader);

    return [
      {
        type: 'js',
        value: this.getBrowserBindgenString(loader),
      },
    ];
  }

  async getBrowserLoaderString() {
    const { initPath } = this;

    return (await fs.readFile(initPath))
      .toString()
      .replace('(function() {', '')
      .replace(
        'self.wasm_bindgen = Object.assign(init, __exports);',
        loaderTemplate,
      )
      .replace('})();', '');
  }

  getBrowserBindgenString(loader) {
    const { dir, wasmPath } = this;

    return bindgenTemplate(
      path.relative(dir, wasmPath),
      Array.from(matches(/__exports.(\w+)/g, loader)),
    );
  }

  async generateElectronOrNode() {
    return [];
  }
}

module.exports = WasmPackRustAsset;

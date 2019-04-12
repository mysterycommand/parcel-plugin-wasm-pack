const path = require('path');

const fs = require('@parcel/fs');
const logger = require('@parcel/logger');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');

const { exec, proc } = require('./child-process');
const { cargoInstall, isInstalled } = require('./cargo-install');
const { getCargoConfig, ensureCargoConfig } = require('./mixins/cargo-config');
const { loaderTemplate, bindgenTemplate } = require('./templates');

/**
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L13-L14
 */
const RUST_TARGET = 'wasm32-unknown-unknown';

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
    this.ensureCargoConfig = ensureCargoConfig.bind(this);

    /*
    this.cargoConfig = {};
    this.cargoDir = '';
    this.isMainFile = false;

    this.pkgDir = '';
    this.rustName = '';

    this.depsPath = '';
    this.wasmPath = '';
    this.initPath = '';
    */
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

  async wasmPackBuild() {
    const { cargoDir } = this;

    const args = [
      '--verbose',
      'build',
      ...(isInstalled('wasm-bindgen') ? ['-m', 'no-install'] : []),
      '--target',
      /**
       * valid ParcelJS targets are browser, electron, and node
       * @see: https://parceljs.org/cli.html#target
       *
       * valid wasm-pack targets are bundler, web, nodejs, and no-modules
       * @see: https://rustwasm.github.io/docs/wasm-bindgen/reference/deployment.html#deploying-rust-and-webassembly
       */
      ...(this.options.target === 'browser' ? ['no-modules'] : ['nodejs']),
    ];

    logger.log(`running \`wasm-pack ${args.join(' ')}\``);
    await proc('wasm-pack', args, { cwd: cargoDir });
  }

  async postBuild() {
    const { cargoConfig, cargoDir } = this;

    this.pkgDir = path.join(cargoDir, 'pkg');
    this.rustName = cargoConfig.package.name.replace(/-/g, '_');

    this.depsPath = await this.getDepsPath();

    this.wasmPath = path.join(this.pkgDir, `${this.rustName}_bg.wasm`);
    this.initPath = path.join(this.pkgDir, `${this.rustName}.js`);
  }

  async getDepsPath() {
    const { cargoDir, rustName } = this;

    // Get output file paths
    const { stdout } = await exec(
      'cargo',
      ['--verbose', 'metadata', '--format-version', '1'],
      {
        cwd: cargoDir,
      },
    );

    const { target_directory: targetDir } = JSON.parse(stdout);
    return path.join(targetDir, RUST_TARGET, 'release', `${rustName}.d`);
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

const path = require('path');

const fs = require('@parcel/fs');
const logger = require('@parcel/logger');
const toml = require('@iarna/toml');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const config = require('parcel-bundler/src/utils/config');

const { exec, proc } = require('./child-process');
const { cargoInstall, isInstalled } = require('./cargo-install');

/**
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L13-L14
 */
const RUST_TARGET = 'wasm32-unknown-unknown';
const MAIN_FILES = ['src/lib.rs', 'src/main.rs'];

class WasmPackRustAsset extends RustAsset {
  constructor(name, options) {
    super(name, options);

    this.type = 'js';
    this.dir = path.dirname(this.name);

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
    await super.installRust();

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

  /**
   * pulled out from Parcel's RustAsset class:
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L40-L55
   *
   * @memberof WasmPackRustAsset
   */
  async getCargoConfig() {
    // See if there is a Cargo config in the project
    let cargoConfig = await this.getConfig(['Cargo.toml']);
    let cargoDir;
    let isMainFile = false;

    if (cargoConfig) {
      const mainFiles = MAIN_FILES.slice();
      if (cargoConfig.lib && cargoConfig.lib.path) {
        mainFiles.push(cargoConfig.lib.path);
      }

      cargoDir = path.dirname(await config.resolve(this.name, ['Cargo.toml']));
      isMainFile = mainFiles.some(
        file => path.join(cargoDir, file) === this.name,
      );
    }

    this.cargoConfig = cargoConfig;
    this.cargoDir = cargoDir;
    this.isMainFile = isMainFile;
  }

  /**
   * pulled out from Parcel's RustAsset class:
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L108-L123
   *
   * @memberof WasmPackRustAsset
   */
  async ensureCargoConfig() {
    const { cargoConfig, cargoDir } = this;

    // Ensure the cargo config has cdylib as the crate-type
    if (!cargoConfig.lib) {
      cargoConfig.lib = {};
    }

    if (!Array.isArray(cargoConfig.lib['crate-type'])) {
      cargoConfig.lib['crate-type'] = [];
    }

    if (!cargoConfig.lib['crate-type'].includes('cdylib')) {
      cargoConfig.lib['crate-type'].push('cdylib');

      await fs.writeFile(
        path.join(cargoDir, 'Cargo.toml'),
        toml.stringify(cargoConfig),
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
      ...(this.options.target === 'browser' ? ['web'] : ['nodejs']),
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
    const { dir, wasmPath, initPath } = this;

    const relativePath = path.relative(dir, initPath);
    const requirePath = path.join(
      path.dirname(relativePath),
      path.basename(relativePath, '.js'),
    );
    const bundlePath = this.addURLDependency(path.relative(dir, wasmPath));

    const loader = `\
const { default: init } = require('${requirePath}');
module.exports = init('${bundlePath}');
`;

    return [
      {
        type: 'js',
        value: loader,
      },
    ];
  }
}

module.exports = WasmPackRustAsset;

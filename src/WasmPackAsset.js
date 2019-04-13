const path = require('path');

const toml = require('@iarna/toml');
const fs = require('@parcel/fs');
const logger = require('@parcel/logger');

const { Asset } = require('parcel-bundler');
const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const TomlAsset = require('parcel-bundler/src/assets/TOMLAsset');
const config = require('parcel-bundler/src/utils/config');

const { cargoInstall, isInstalled } = require('./cargo-install');
const { exec, matches, proc, rel } = require('./helpers');
const {
  bindgenTemplate,
  browserLoaderTemplate,
  nodeOrElectronLoaderTemplate,
} = require('./templates');

/**
 * pulled out from Parcel's RustAsset class:
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L13-L14
 */
const RUST_TARGET = 'wasm32-unknown-unknown';
const MAIN_FILES = ['src/lib.rs', 'src/main.rs'];

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
      return;
    }

    logger.verbose(`${this.name} is a wasm target`);
    this.dir = path.dirname(this.name);
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

    const { dir, wasmPath } = this;

    const loader =
      this.options.target === 'browser'
        ? await this.getBrowserLoaderString()
        : await this.getElectronOrNodeLoaderString();

    await fs.writeFile(require.resolve('./loader.js'), loader);

    const fromPath = rel(dir, wasmPath);
    const exportLines = Array.from(matches(/__exports.(\w+)/g, loader));
    const bindgen = bindgenTemplate(fromPath, exportLines);

    return [
      {
        type: 'js',
        value: bindgen,
      },
    ];
  }

  /**
   * pulled out from Parcel's RustAsset class:
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L40-L55
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
      isMainFile =
        mainFiles.some(file => path.join(cargoDir, file) === this.name) ||
        this.basename === 'Cargo.toml';
    }

    this.cargoConfig = cargoConfig;
    this.cargoDir = cargoDir;
    this.isMainFile = isMainFile;
  }

  /**
   * pulled out from Parcel's RustAsset class:
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L108-L123
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
    const { options, cargoDir } = this;

    const args = [
      '--verbose',
      'build',
      ...(options.production ? ['--release'] : ['--dev']),
      ...(isInstalled('wasm-bindgen') ? ['-m', 'no-install'] : []),
      '--target',
      /**
       * valid ParcelJS targets are browser, electron, and node
       * @see: https://parceljs.org/cli.html#target
       *
       * valid wasm-pack targets are bundler, web, nodejs, and no-modules
       * @see: https://rustwasm.github.io/docs/wasm-bindgen/reference/deployment.html#deploying-rust-and-webassembly
       */
      'no-modules',
    ];

    logger.verbose(`running \`wasm-pack ${args.join(' ')}\``);
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

  async getBrowserLoaderString() {
    const { initPath } = this;

    return (await fs.readFile(initPath))
      .toString()
      .replace('(function() {', '')
      .replace(
        'self.wasm_bindgen = Object.assign(init, __exports);',
        browserLoaderTemplate(),
      )
      .replace('})();', '');
  }

  async getElectronOrNodeLoaderString() {
    const { initPath, rustName } = this;

    /**
     * matches everything from `function init(module_or_path, maybe_memory) {`
     * to `self.wasm_bindgen = Object.assign(init, __exports);` and captures the
     * final `then` clause of `wasm-pack`'s `no-modules` initializer, which is
     * what does the assignment to `wasm` ... it looks like this:
     *
     * ```
     * .then(({instance, module}) => {
     *   wasm = instance.exports;
     *   init.__wbindgen_wasm_module = module;
     *
     *   return wasm;
     * });
     * ```
     */
    const init = new RegExp(
      [
        '^(?:function init\\(module_or_path, maybe_memory\\) {)',
        'return result(\\.then\\(\\({instance, module}\\) => {',
        '}\\);)',
        '(?:self\\.wasm_bindgen = Object\\.assign\\(init, __exports\\);)$',
      ].join('.*'),
      'gms',
    );

    return (await fs.readFile(initPath))
      .toString()
      .replace(
        '(function() {',
        "const { TextEncoder, TextDecoder } = require('util');",
      )
      .replace(init, (_, finalThen) =>
        nodeOrElectronLoaderTemplate(rustName, finalThen),
      )
      .replace('})();', '');
  }
}

module.exports = WasmPackAsset;

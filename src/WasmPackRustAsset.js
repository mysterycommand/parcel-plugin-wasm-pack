const path = require('path');
const childProcess = require('child_process');
const { promisify } = require('util');

const fs = require('@parcel/fs');
const logger = require('@parcel/logger');
const toml = require('@iarna/toml');
const commandExists = require('command-exists');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const config = require('parcel-bundler/src/utils/config');

const exec = promisify(childProcess.execFile);

/**
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L13-L14
 */
const RUST_TARGET = 'wasm32-unknown-unknown';
const MAIN_FILES = ['src/lib.rs', 'src/main.rs'];

const installed = {};

class WasmPackRustAsset extends RustAsset {
  constructor(name, options) {
    super(name, options);
    this.type = 'js';
  }

  async parse() {
    /**
     * checks that 'rustup' is installed, installs the nightly toolchain, and the wasm32-unknown-unknown target
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L66
     */
    await super.installRust();

    await this.cargoInstall('wasm-pack');
    await this.cargoInstall('wasm-bindgen', 'wasm-bindgen-cli');

    const { cargoConfig, cargoDir, isMainFile } = await this.getCargoConfig();

    if (isMainFile) {
      await this.ensureCargoConfig(cargoConfig, cargoDir);
      await this.wasmPackBuild(cargoConfig, cargoDir);
    } else {
      throw new Error(
        `Couldn't figure out what to do with ${
          this.name
        }. It should be a "main file" (lib.rs or main.rs) or a Cargo.toml`,
      );
    }
  }

  async cargoInstall(cmd, dep) {
    dep || (dep = cmd);
    logger.log(`installing ${dep}`);

    if (installed[dep]) {
      logger.log(`${dep} already installed, skipping`);
      return;
    }

    await commandExists(cmd)
      .then(() => {
        logger.log(`${dep} already installed, skipping`);
        installed[dep] = true;
      })
      .catch(
        () =>
          new Promise((resolve, reject) => {
            logger.log(`${dep} not installed, trying \`cargo install ${dep}\``);

            exec('cargo', ['install', dep], (err, stdout) => {
              if (err) {
                installed[dep] = false;
                logger.err(`something went wrong, ${dep} not installed`);
                err.split('\n').forEach(line => logger.err(line));
                reject(err);
              }

              installed[dep] = true;
              logger.log(`${dep} installed successfully!`);
              stdout.split('\n').forEach(line => logger.log(line));
              resolve(stdout);
            });
          }),
      );
  }

  /**
   * pulled out from the parent class:
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L40-L55
   *
   * @returns { cargoConfig, cargoDir, isMainFile }
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

    return {
      cargoConfig,
      cargoDir,
      isMainFile,
    };
  }

  /**
   * pulled out from the parent class:
   * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L108-L123
   *
   * @memberof WasmPackRustAsset
   */
  async ensureCargoConfig(cargoConfig, cargoDir) {
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

  async wasmPackBuild(cargoConfig, cargoDir) {
    const args = [
      'build',
      ...(installed['wasm-bindgen-cli'] ? ['-m', 'no-install'] : []),
    ];

    logger.log(`running \`wasm-pack ${args.join(' ')}\``);
    await exec('wasm-pack', args, { cwd: cargoDir });

    this.outDir = path.join(cargoDir, 'pkg');
    this.rustName = cargoConfig.package.name.replace(/-/g, '_');
    this.depsPath = await this.getDepsPath(cargoDir, this.rustName);
    this.wasmPath = path.join(this.outDir, `${this.rustName}_bg.wasm`);
    this.bindgenPath = path.join(this.outDir, `${this.rustName}.js`);
  }

  async getDepsPath(cargoDir, rustName) {
    // Get output file paths
    const { stdout } = await exec(
      'cargo',
      ['metadata', '--format-version', '1'],
      {
        cwd: cargoDir,
      },
    );

    const { target_directory: targetDir } = JSON.parse(stdout);
    return path.join(targetDir, RUST_TARGET, 'release', `${rustName}.d`);
  }

  async generate() {
    const loader = await this.getLoader(
      path.relative(this.outDir, this.wasmPath),
      path.relative(this.outDir, this.bindgenPath),
    );
    await fs.writeFile(path.join(this.outDir, 'loader.js'), loader);

    const bindgen = (await fs.readFile(this.bindgenPath))
      .toString()
      .replace(`import * as wasm from './${this.rustName}_bg';`, 'const wasm;');
    await fs.writeFile(this.bindgenPath, bindgen);

    return [
      {
        type: 'js',
        path: this.bindgenPath,
      },
      {
        type: 'js',
        path: path.join(this.outDir, 'loader.js'),
      },
    ];
  }

  async getLoader(wasmPath, bindgenPath) {
    const loaderTemplate =
      this.options.target === 'node'
        ? await ''
        : (await fs.readFile(
            require.resolve('./loaders/browser.js'),
          )).toString();
    return loaderTemplate
      .replace(/WASM_PATH/g, `${wasmPath}`)
      .replace(/RUST_NAME/g, `${bindgenPath}`);
  }
}

module.exports = WasmPackRustAsset;

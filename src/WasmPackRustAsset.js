const path = require('path');
const childProcess = require('child_process');

const fs = require('@parcel/fs');
const logger = require('@parcel/logger');
const { promisify } = require('@parcel/utils');
const toml = require('@iarna/toml');
const commandExists = require('command-exists');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const config = require('parcel-bundler/src/utils/config');

const exec = promisify(childProcess.execFile);

/**
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L14
 */
const MAIN_FILES = ['src/lib.rs', 'src/main.rs'];

let wasmPackInstalled = false;

class WasmPackRustAsset extends RustAsset {
  constructor(name, options) {
    super(name, options);
    this.buildResult = {};
  }

  async parse() {
    /**
     * checks that 'rustup' is installed, installs the nightly toolchain, and the wasm32-unknown-unknown target
     * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L66
     */
    await super.installRust();

    await this.installWasmPack();
    const wasmBindgenInstalled = await commandExists('wasm-bindgen')
      .then(() => true)
      .catch(() => false);
    const { cargoConfig, cargoDir, isMainFile } = await this.getCargoConfig();

    if (isMainFile) {
      await this.ensureCargoConfig(cargoConfig, cargoDir);

      this.buildResult = {
        ...this.buildResult,
        ...(await this.wasmPackBuild(
          cargoConfig,
          cargoDir,
          wasmBindgenInstalled,
        )),
      };
    } else {
      throw new Error(
        `Couldn't figure out what to do with ${
          this.name
        }. It should be a "main file" (lib.rs or main.rs) or a Cargo.toml`,
      );
    }
  }

  async installWasmPack() {
    logger.log('installing wasm-pack');

    if (wasmPackInstalled) {
      logger.log('wasm-pack already installed, skipping');
      return;
    }

    await commandExists('wasm-pack')
      .then(() => {
        logger.log('wasm-pack already installed, skipping');
        wasmPackInstalled = true;
      })
      .catch(
        () =>
          new Promise((resolve, reject) => {
            logger.log(
              'wasm-pack not installed, trying `cargo install wasm-pack`',
            );

            exec('cargo', ['install', 'wasm-pack'], (err, stdout) => {
              if (err) {
                wasmPackInstalled = false;
                logger.err('something went wrong, wasm-pack not installed');
                err.split('\n').forEach(line => logger.err(line));
                reject(err);
              }

              wasmPackInstalled = true;
              logger.log('wasm-pack installed successfully!');
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

  async wasmPackBuild(cargoConfig, cargoDir, wasmBindgenInstalled) {
    const args = [
      'build',
      ...(wasmBindgenInstalled ? ['-m', 'no-install'] : []),
    ];

    logger.log(
      `wasm-bindgen ${
        wasmBindgenInstalled ? '' : 'not '
      }installed, calling wasm-pack with \`${args}\``,
    );
    await exec('wasm-pack', args, { cwd: cargoDir });

    return {
      outDir: path.join(cargoDir, 'pkg'),
      rustName: cargoConfig.package.name.replace(/-/g, '_'),
    };
  }

  async postProcess(generated) {
    JSON.stringify(generated, null, 2)
      .split('\n')
      .forEach(line => logger.log);

    JSON.stringify(this.buildResult, null, 2)
      .split('\n')
      .forEach(line => logger.log);

    const { outDir, rustName } = this.buildResult;
    let js = (await fs.readFile(
      path.join(outDir, `${rustName}.js`),
    )).toString();

    // let wasmPath = path.relative(
    //   path.dirname(this.name),
    //   path.join(outDir, `${rustName}_bg.wasm`),
    // );

    // if (wasmPath[0] !== '.') {
    //   wasmPath = path.join('.', wasmPath);
    // }

    // wasmPath = wasmPath.replace('\\', '/');

    js.split('\n').forEach(line => logger.log(line));
  }
}

module.exports = WasmPackRustAsset;

const path = require('path');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');

const fs = require('@parcel/fs');
const logger = require('@parcel/logger');
const toml = require('@iarna/toml');
const commandExists = require('command-exists');

const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const config = require('parcel-bundler/src/utils/config');

const exec = promisify(execFile);
function proc(bin, args, opts) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, opts);

    let stdout = '';
    let stdoutLine = '';
    let stderr = '';
    let stderrLine = '';

    p.stdout.on('data', d => {
      stdoutLine += d;

      if (stdoutLine.includes('\n')) {
        stdout += stdoutLine;
        const lines = stdoutLine.split('\n');
        lines.slice(0, -1).forEach(line => logger.log(line));
        stdoutLine = lines.slice(-1)[0];
      }
    });

    p.stderr.on('data', d => {
      stderrLine += d;

      if (stderrLine.includes('\n')) {
        stderr += stderrLine;
        const lines = stderrLine.split('\n');
        lines.slice(0, -1).forEach(line => logger.log(line));
        stderrLine = lines.slice(-1)[0];
      }
    });

    p.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });

    p.on('error', reject);
  });
}

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

    const { cargoConfig, cargoDir, isMainFile } = await this.getCargoConfig();
    await this.cargoInstall('wasm-pack', { cwd: cargoDir });
    await this.cargoInstall('wasm-bindgen', 'wasm-bindgen-cli', {
      cwd: cargoDir,
    });

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

  async cargoInstall(cmd, bin, opts) {
    opts || (opts = bin);
    bin || bin === opts || (bin = cmd);
    logger.log(`installing ${cmd}`);

    if (installed[bin]) {
      logger.log(`${cmd} already installed, skipping`);
      return;
    }

    await commandExists(cmd)
      .then(() => {
        logger.log(`${cmd} already installed, skipping`);
        installed[bin] = true;
      })
      .catch(() =>
        proc('cargo', ['--verbose', 'install', bin])
          .then((/* stdout */) => {
            installed[bin] = true;
            logger.log(`${cmd} installed successfully!`);
            // stdout.split('\n').forEach(line => logger.log(line));
          })
          .catch((/* stderr */) => {
            installed[bin] = false;
            logger.error(`something went wrong, ${cmd} not installed`);
            // stderr.split('\n').forEach(line => logger.error(line));
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
      '--verbose',
      'build',
      ...(installed['wasm-bindgen-cli'] ? ['-m', 'no-install'] : []),
      '--target=web',
    ];

    logger.log(`running \`wasm-pack ${args.join(' ')}\``);
    await proc('wasm-pack', args, { cwd: cargoDir });

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
      ['--verbose', 'metadata', '--format-version', '1'],
      {
        cwd: cargoDir,
      },
    );

    const { target_directory: targetDir } = JSON.parse(stdout);
    return path.join(targetDir, RUST_TARGET, 'release', `${rustName}.d`);
  }

  async generate() {
    const bindgen = (await fs.readFile(this.bindgenPath)).toString();

    const exportFunction = /export function (\w+)/g;
    const importNames = [];
    let a;
    while ((a = exportFunction.exec(bindgen)) !== null) {
      importNames.push(a[1]);
    }

    const basename = path.basename(this.bindgenPath, '.js');
    const relpath = path.relative('./src', path.dirname(this.bindgenPath));
    const loader = `\
import init from '${path.join(relpath, basename)}';
let wasm;

(async function load() {
  wasm = await init('./${path.relative(this.outDir, this.wasmPath)}');
})();

${importNames.map(name => `export const ${name} = wasm.${name};`).join('\n')}
`;
    // await fs.writeFile(path.join(this.outDir, 'loader.js'), loader);

    return {
      /**
       * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L189-L190
       */
      wasm: {
        path: this.wasmPath, // pass output path to RawPackager
        mtime: Date.now(), // force re-bundling since otherwise the hash would never change
      },
      js: {
        path: this.bindgenPath,
        mtime: Date.now(),
      },
      // {
      //   type: 'js',
      //   value: loader,
      // },
    };
  }
}

module.exports = WasmPackRustAsset;

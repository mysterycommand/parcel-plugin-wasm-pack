const path = require('path');

const logger = require('@parcel/logger');

const { exec, proc } = require('../child-process');
const { isInstalled } = require('../cargo-install');

/**
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L13-L14
 */
const RUST_TARGET = 'wasm32-unknown-unknown';

async function wasmPackBuild() {
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

  logger.verbose(`running \`wasm-pack ${args.join(' ')}\``);
  await proc('wasm-pack', args, { cwd: cargoDir });
}

async function postBuild() {
  const { cargoConfig, cargoDir } = this;

  this.pkgDir = path.join(cargoDir, 'pkg');
  this.rustName = cargoConfig.package.name.replace(/-/g, '_');

  this.depsPath = await this.getDepsPath();

  this.wasmPath = path.join(this.pkgDir, `${this.rustName}_bg.wasm`);
  this.initPath = path.join(this.pkgDir, `${this.rustName}.js`);
}

async function getDepsPath() {
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

module.exports = { wasmPackBuild, postBuild, getDepsPath };

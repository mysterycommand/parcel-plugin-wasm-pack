const path = require('path');

const fs = require('@parcel/fs');
const toml = require('@iarna/toml');

const config = require('parcel-bundler/src/utils/config');

/**
 * pulled out from Parcel's RustAsset class:
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L13-L14
 */
const MAIN_FILES = ['src/lib.rs', 'src/main.rs'];

/**
 * pulled out from Parcel's RustAsset class:
 * @see: https://github.com/parcel-bundler/parcel/blob/master/packages/core/parcel-bundler/src/assets/RustAsset.js#L40-L55
 */
async function getCargoConfig() {
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
 */
async function ensureCargoConfig() {
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

module.exports = { getCargoConfig, ensureCargoConfig };

const logger = require('@parcel/logger');

const { Packager } = require('parcel-bundler');

class WasmPackPackager extends Packager {
  constructor(bundle, bundler) {
    super(bundle, bundler);

    // JSON.stringify(bundle, null, 2)
    //   .split('\n')
    logger.log('constructor:');
    Object.keys(bundle).forEach(key => logger.log(`\t${key}`));
  }
  async start() {
    await super.start();
  }

  async addAsset(asset) {
    logger.log('addAsset:');
    Object.keys(asset).forEach(key => logger.log(`\t${key}`));
    await this.dest.write("module.exports = 'bar';");
  }

  async end() {
    await super.end();
  }
}

module.exports = WasmPackPackager;

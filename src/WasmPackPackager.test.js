const JSPackager = require('parcel-bundler/src/packagers/JSPackager');

const WasmPackPackager = require('./WasmPackPackager');

describe('WasmPackPackager', () => {
  it('should write a loader if this package has wasm assets', async () => {
    const writeBundleLoadersSpy = jest.spyOn(
      JSPackager.prototype,
      'writeBundleLoaders',
    );

    const packager = new WasmPackPackager(
      {
        assets: new Set(),
        entryAsset: { name: './index.js' },
        name: './index.js',
      },
      { options: { hmr: false } },
    );

    await packager.setup();
    await packager.start();
    await packager.end();

    expect(writeBundleLoadersSpy).toHaveBeenCalledTimes(1);
  });
});

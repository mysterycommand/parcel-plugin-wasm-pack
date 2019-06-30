const path = require('path');
const RustAsset = require('parcel-bundler/src/assets/RustAsset');

const WasmPackAsset = require('./WasmPackAsset');

const logger = require('@parcel/logger');
jest.mock('@parcel/logger');

describe('WasmPackAsset', () => {
  describe('constructor & isWasm', () => {
    it.each`
      name            | rootDir | value
      ${'some.toml'}  | ${'./'} | ${false}
      ${'Cargo.toml'} | ${'./'} | ${true}
      ${'lib.rs'}     | ${'./'} | ${true}
    `(
      'differentiates between any old .toml and a Cargo.toml',
      ({ name, rootDir, value }) => {
        const asset = new WasmPackAsset(name, { rootDir });
        expect(asset.isWasm).toBe(value);

        if (value) {
          expect(logger.verbose).toHaveBeenCalledTimes(1);
          logger.verbose.mockClear();
        }
      },
    );
  });

  describe('process', () => {
    const assetProcessSpy = jest.spyOn(
      Object.getPrototypeOf(WasmPackAsset.prototype),
      'process',
    );
    const rustAssetProcessSpy = jest.spyOn(RustAsset.prototype, 'process');

    beforeEach(() => {
      assetProcessSpy.mockClear();
      rustAssetProcessSpy.mockClear();
    });

    it('passes non-wasm assets to the Asset.prototype.process', async () => {
      const entryPath = require.resolve(
        './__fixtures__/without-wasm-assets/src/dummy.toml',
      );

      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      await asset.process();
      expect(assetProcessSpy).toHaveBeenCalledTimes(1);
      expect(rustAssetProcessSpy).toHaveBeenCalledTimes(0);
    });

    it('passes wasm assets to RustAsset.prototype.process', async () => {
      const entryPath = require.resolve(
        './__fixtures__/with-wasm-assets/Cargo.toml',
      );

      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      await asset.process();
      expect(assetProcessSpy).toHaveBeenCalledTimes(1);
      expect(rustAssetProcessSpy).toHaveBeenCalledTimes(1);
    });
  });
});

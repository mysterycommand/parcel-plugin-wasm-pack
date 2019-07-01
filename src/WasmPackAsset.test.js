const path = require('path');

const fs = require('@parcel/fs');
const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const TomlAsset = require('parcel-bundler/src/assets/TOMLAsset');

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
      'differentiates between any old .toml and a "main file" (Cargo.toml, lib.rs, or main.rs)',
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

  describe('parse', () => {
    const tomlAssetProcessSpy = jest.spyOn(TomlAsset.prototype, 'parse');

    beforeEach(() => {
      tomlAssetProcessSpy.mockClear();
    });

    it('hands off to TomlAsset.prototype.parse if we somehow got here with a .toml file', async () => {
      const entryPath = require.resolve(
        './__fixtures__/without-wasm-assets/src/dummy.toml',
      );

      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      const toml = `\
[foo]
bar = "baz"
`;

      await asset.parse(toml);
      expect(tomlAssetProcessSpy).toHaveBeenCalledTimes(1);
      expect(tomlAssetProcessSpy).toHaveBeenCalledWith(toml);
    });

    it('collects a bunch of state with a "main" file', async () => {
      const entryPath = require.resolve(
        './__fixtures__/with-wasm-assets/src/lib.rs',
      );

      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      await asset.parse();

      expect(asset.cargoConfig).toEqual({
        dependencies: {
          'wasm-bindgen': '0.2.47',
          'web-sys': { features: ['console'], version: '0.3.24' },
          console_error_panic_hook: {
            optional: true,
            version: '0.1.6',
          },
        },
        features: {
          default: ['console_error_panic_hook'],
        },
        lib: { 'crate-type': ['cdylib', 'rlib'] },
        package: { edition: '2018', name: 'output', version: '0.0.0' },
      });
      expect(asset.cargoDir).toBe(path.join(entryPath, '../..'));
      expect(asset.isMainFile).toBe(true);
      expect(asset.pkgDir).toBe(path.join(entryPath, '../../pkg'));
      expect(asset.rustName).toBe('output');
      expect(asset.depsPath).toBe(
        path.join(
          entryPath,
          '../../target/wasm32-unknown-unknown/debug/output.d',
        ),
      );
      expect(asset.wasmPath).toBe(
        path.join(entryPath, '../../pkg/output_bg.wasm'),
      );
      expect(asset.initPath).toBe(path.join(entryPath, '../../pkg/output.js'));
    });

    it('throws an error with a non-"main" file', async () => {
      const entryPath = require.resolve(
        './__fixtures__/with-wasm-assets/src/utils.rs',
      );

      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      try {
        await asset.parse();
      } catch (error) {
        expect(error.message).toBe(
          `Couldn't figure out what to do with ${entryPath}. It should be a "main file" (lib.rs or main.rs) or a Cargo.toml`,
        );
      } finally {
        expect(asset.isMainFile).toBe(false);
      }
    });
  });

  describe('generate, generateLoader, and generateInitializer', () => {
    const writeFileSpy = jest.spyOn(fs, 'writeFile');
    const entryPath = require.resolve(
      './__fixtures__/with-wasm-assets/src/lib.rs',
    );
    const pkgDir = path.join(path.dirname(entryPath), '../pkg');
    const outputPath = path.join(pkgDir, 'output.js');
    const wasmLoaderPath = path.join(pkgDir, 'wasm-loader.js');

    beforeEach(() => {
      writeFileSpy.mockClear();
    });

    it('generate returns an asset that imports init and exports a call with the wasmPath', async () => {
      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      await asset.parse();
      const generated = await asset.generate();

      expect(writeFileSpy).toHaveBeenCalledTimes(2);
      expect(generated).toEqual([
        {
          type: 'js',
          value: `\
import init from '../pkg/output.js';
module.exports = init(require('../pkg/output_bg.wasm'));
`,
        },
      ]);
    });

    it('generateInitializer augments the module generated by wasm-pack', async () => {
      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      await asset.parse();
      asset.loadPath = path.join(
        path.dirname(asset.initPath),
        'wasm-loader.js',
      );
      await asset.generateInitializer();

      expect(writeFileSpy).toHaveBeenCalledTimes(1);
      const wasmLoaderStr = (await fs.readFile(wasmLoaderPath)).toString();
      expect(wasmLoaderStr).toMatchSnapshot();
    });

    it('generateInitializer augments the module generated by wasm-pack', async () => {
      const asset = new WasmPackAsset(entryPath, {
        rootDir: path.dirname(entryPath),
      });

      await asset.parse();
      asset.loadPath = path.join(
        path.dirname(asset.initPath),
        'wasm-loader.js',
      );
      await asset.generateInitializer();

      expect(writeFileSpy).toHaveBeenCalledTimes(1);
      const outputStr = (await fs.readFile(outputPath)).toString();
      expect(outputStr).toMatchSnapshot();
    });
  });
});

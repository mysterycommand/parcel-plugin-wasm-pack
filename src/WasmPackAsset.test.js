const path = require('path');

const fs = require('@parcel/fs');
const RustAsset = require('parcel-bundler/src/assets/RustAsset');
const TomlAsset = require('parcel-bundler/src/assets/TOMLAsset');

const WasmPackAsset = require('./WasmPackAsset');

const logger = require('@parcel/logger');
jest.mock('@parcel/logger');

const { isInstalled } = require('./cargo-install');
jest.mock('./cargo-install');

jest.mock('parcel-bundler/src/utils/config', () => {
  const actualConfig = jest.requireActual('parcel-bundler/src/utils/config');
  return {
    ...actualConfig,
    resolve: (name, filenames) =>
      name.includes('not-main.rs')
        ? undefined
        : actualConfig.resolve(name, filenames),
  };
});

const timeout = 5 * 60 * 1000; // 5 minutes without the cache

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

    it(
      'passes non-wasm assets to the Asset.prototype.process',
      async () => {
        const entryPath = require.resolve(
          './__fixtures__/asset/without-wasm-assets/src/dummy.toml',
        );

        const asset = new WasmPackAsset(entryPath, {
          rootDir: path.dirname(entryPath),
        });

        await asset.process();
        expect(assetProcessSpy).toHaveBeenCalledTimes(1);
        expect(rustAssetProcessSpy).toHaveBeenCalledTimes(0);
      },
      timeout,
    );

    it(
      'passes wasm assets to RustAsset.prototype.process',
      async () => {
        const entryPath = require.resolve(
          './__fixtures__/asset/with-wasm-assets/Cargo.toml',
        );

        const asset = new WasmPackAsset(entryPath, {
          rootDir: path.dirname(entryPath),
        });

        await asset.process();
        expect(assetProcessSpy).toHaveBeenCalledTimes(1);
        expect(rustAssetProcessSpy).toHaveBeenCalledTimes(1);
      },
      timeout,
    );
  });

  describe('parse', () => {
    const tomlAssetProcessSpy = jest.spyOn(TomlAsset.prototype, 'parse');

    beforeEach(() => {
      tomlAssetProcessSpy.mockClear();
    });

    it(
      'hands off to TomlAsset.prototype.parse if we somehow got here with a .toml file',
      async () => {
        const entryPath = require.resolve(
          './__fixtures__/asset/without-wasm-assets/src/dummy.toml',
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
      },
      timeout,
    );

    it.each([true, false])(
      'collects a bunch of state with a "main" file, when production is %s',
      async (production) => {
        const entryPath = require.resolve(
          './__fixtures__/asset/with-wasm-assets/src/lib.rs',
        );

        const asset = new WasmPackAsset(entryPath, {
          rootDir: path.dirname(entryPath),
          production,
        });

        await asset.parse();

        expect(asset.cargoConfig).toEqual({
          dependencies: {
            'wasm-bindgen': '0.2.63',
            'web-sys': { features: ['console'], version: '0.3.40' },
            console_error_panic_hook: {
              optional: true,
              version: '0.1.6',
            },
          },
          features: {
            default: ['console_error_panic_hook'],
          },
          lib: { 'crate-type': ['cdylib', 'rlib'] },
          package: {
            edition: '2018',
            name: 'asset-with-wasm-assets',
            version: '0.0.0',
          },
        });
        expect(asset.cargoDir).toBe(path.join(entryPath, '../..'));
        expect(asset.isMainFile).toBe(true);
        expect(asset.pkgDir).toBe(path.join(entryPath, '../../pkg'));
        expect(asset.rustName).toBe('asset_with_wasm_assets');
        expect(asset.depsPath).toBe(
          path.join(
            __dirname,
            `../target/wasm32-unknown-unknown/${
              production ? 'release' : 'debug'
            }/asset_with_wasm_assets.d`,
          ),
        );
        expect(asset.wasmPath).toBe(
          path.join(entryPath, '../../pkg/asset_with_wasm_assets_bg.wasm'),
        );
        expect(asset.initPath).toBe(
          path.join(entryPath, '../../pkg/asset_with_wasm_assets_bg.js'),
        );
      },
      timeout,
    );

    it(
      'throws an error with a non-"main" file',
      async () => {
        const entryPath = require.resolve(
          './__fixtures__/asset/without-wasm-assets/src/not-main.rs',
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
      },
      timeout,
    );
  });

  describe('generate, generateLoader, and generateInitializer', () => {
    const writeFileSpy = jest.spyOn(fs, 'writeFile');
    const entryPath = require.resolve(
      './__fixtures__/asset/with-wasm-assets/src/lib.rs',
    );
    const pkgDir = path.join(path.dirname(entryPath), '../pkg');
    const outputPath = path.join(pkgDir, 'asset_with_wasm_assets_bg.js');
    const wasmLoaderPath = path.join(pkgDir, 'wasm-loader.js');

    beforeEach(() => {
      writeFileSpy.mockClear();
    });

    it(
      'generate returns an asset that imports init and exports a call with the wasmPath',
      async () => {
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
import init from '../pkg/asset_with_wasm_assets_bg.js';
module.exports = init(require('../pkg/asset_with_wasm_assets_bg.wasm'));
`,
          },
        ]);
      },
      timeout,
    );

    it(
      'generateLoader writes a file called wasm-loader.js depending on the target',
      async () => {
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
      },
      timeout,
    );

    it.each(['browser', 'electron', 'node'])(
      'generateInitializer augments the module generated by wasm-pack based on the target: %s',
      async (target) => {
        const asset = new WasmPackAsset(entryPath, {
          rootDir: path.dirname(entryPath),
          target,
        });

        await asset.parse();
        asset.loadPath = path.join(
          path.dirname(asset.initPath),
          'wasm-loader.js',
        );
        await asset.generateInitializer();

        expect(writeFileSpy).toHaveBeenCalledTimes(1);
        const outputStr = (await fs.readFile(outputPath))
          .toString()
          .split('\n')
          .slice(0, 3)
          .join('\n');
        expect(outputStr).toMatchSnapshot();
      },
      timeout,
    );
  });

  describe(
    'getCargoConfig and ensureCargoConfig',
    () => {
      it(
        'getCargoConfig honors lib.path in Cargo.toml',
        async () => {
          const entryPath = require.resolve(
            './__fixtures__/asset/with-wasm-assets-and-custom-lib-path/src/entry.rs',
          );

          const asset = new WasmPackAsset(entryPath, {
            rootDir: path.dirname(entryPath),
          });

          await asset.getCargoConfig();

          expect(asset.cargoConfig.lib.path).toBe('src/entry.rs');
          expect(asset.isMainFile).toBe(true);
        },
        timeout,
      );

      it('ensureCargoConfig adds a lib and lib.crate-type = cdylib if missing', async () => {
        const cargoPath = require.resolve(
          './__fixtures__/asset/with-wasm-assets-missing-lib-crate-type-cdylib/Cargo.toml',
        );
        const cargoDir = path.dirname(cargoPath);

        const asset = new WasmPackAsset(path.join(cargoDir, 'src/lib.rs'), {
          rootDir: path.join(cargoDir, 'src'),
        });

        asset.cargoDir = cargoDir;
        asset.cargoConfig = {
          // lib: { 'crate-type': ['cdylib', 'rlib'] },
          package: {
            edition: '2018',
            name: 'asset-with-wasm-assets',
            version: '0.0.0',
          },
        };
        await asset.ensureCargoConfig();

        expect(asset.cargoConfig.lib['crate-type']).toEqual(['cdylib']);
        const cargoStr = (await fs.readFile(cargoPath)).toString();
        expect(cargoStr).toMatchSnapshot();
      });
    },
    timeout,
  );

  describe('wasmPackBuild', () => {
    it.each([true, false])(
      'runs even if wasm-bindgen shows up as not installed, when production is %s',
      async (production) => {
        isInstalled.mockImplementationOnce(() => false);

        const entryPath = require.resolve(
          './__fixtures__/asset/with-wasm-assets/src/lib.rs',
        );

        const asset = new WasmPackAsset(entryPath, {
          rootDir: path.dirname(entryPath),
          production,
        });
        asset.cargoDir = path.join(entryPath, '../..');

        logger.verbose.mockClear();
        asset.wasmPackBuild();

        const args = [
          '--verbose',
          'build',
          ...(production ? ['--release'] : ['--dev']),
          // ...(isInstalled('wasm-bindgen') ? ['-m', 'no-install'] : []),
          '--target',
          'bundler',
        ];

        expect(logger.verbose).toHaveBeenCalledWith(
          `running \`wasm-pack ${args.join(' ')}\``,
        );
      },
      timeout,
    );
  });
});

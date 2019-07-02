const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Bundler = require('parcel-bundler');
const WasmPackPackager = require('./WasmPackPackager');
const registerPlugin = require('../');

const readFile = promisify(fs.readFile);

const logger = require('@parcel/logger');
jest.mock('@parcel/logger');

async function bundle(entryPath) {
  const outDir = path.join(path.dirname(entryPath), '../dist');
  const outFile = 'output.js';

  const bundler = new Bundler(entryPath, {
    outDir,
    outFile,
    hmr: false,
    minify: false,
    cache: false,
    sourceMaps: false,
  });

  registerPlugin(bundler);
  await bundler.bundle();

  return path.join(outDir, outFile);
}

describe('WasmPackPackager', () => {
  const writeBundleLoadersSpy = jest.spyOn(
    Object.getPrototypeOf(WasmPackPackager.prototype),
    'writeBundleLoaders',
  );

  beforeEach(() => {
    writeBundleLoadersSpy.mockClear();
    logger.success.mockClear();
  });

  it('should not write a loader if this package has no wasm assets', async () => {
    const entryPath = require.resolve(
      './__fixtures__/packager/without-wasm-assets/src/entry.js',
    );

    const outputPath = await bundle(entryPath);
    const outputStr = (await readFile(outputPath)).toString();

    expect(writeBundleLoadersSpy).toHaveBeenCalledTimes(1);
    expect(outputStr).not.toContain('function cacheReplace(id, mod) {');

    expect(logger.success).toHaveBeenCalledTimes(1);
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining('Built in'),
    );
  });

  it('should write a loader if this package has wasm assets', async () => {
    const entryPath = require.resolve(
      './__fixtures__/packager/with-wasm-assets/src/entry.js',
    );

    const outputPath = await bundle(entryPath);
    const outputStr = (await readFile(outputPath)).toString();

    expect(writeBundleLoadersSpy).toHaveBeenCalledTimes(0);
    expect(outputStr).toContain('function cacheReplace(id, mod) {');

    expect(logger.success).toHaveBeenCalledTimes(1);
    expect(logger.success).toHaveBeenCalledWith(
      expect.stringContaining('Built in'),
    );
  }, 60000);
});

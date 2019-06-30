const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Bundler = require('parcel-bundler');
const WasmPackPackager = require('./WasmPackPackager');
const registerPlugin = require('../');

const readFile = promisify(fs.readFile);

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
  });

  it('should not write a loader if this package has no wasm assets', async () => {
    const entryPath = require.resolve(
      './__fixtures__/without-wasm-assets/src/entry.js',
    );

    const outputPath = await bundle(entryPath);
    const outputStr = (await readFile(outputPath)).toString();

    expect(writeBundleLoadersSpy).toHaveBeenCalledTimes(1);
    expect(outputStr).not.toContain('function cacheReplace(id, mod) {');
  });

  it('should write a loader if this package has wasm assets', async () => {
    const entryPath = require.resolve(
      './__fixtures__/with-wasm-assets/src/entry.js',
    );

    const outputPath = await bundle(entryPath);
    const outputStr = (await readFile(outputPath)).toString();

    expect(writeBundleLoadersSpy).toHaveBeenCalledTimes(0);
    expect(outputStr).toContain('function cacheReplace(id, mod) {');
  }, 20000);
});

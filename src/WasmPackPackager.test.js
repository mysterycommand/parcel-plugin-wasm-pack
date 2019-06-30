const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const Bundler = require('parcel-bundler');
const WasmPackPackager = require('./WasmPackPackager');
const registerPlugin = require('../');

const readFile = promisify(fs.readFile);

describe('WasmPackPackager', () => {
  it('should not write a loader if this package has no wasm assets', async () => {
    const writeBundleLoadersSpy = jest.spyOn(
      Object.getPrototypeOf(WasmPackPackager.prototype),
      'writeBundleLoaders',
    );

    const entryPath = require.resolve(
      './__fixtures__/without-wasm-assets/src/entry.js',
    );

    const outDir = path.join(path.dirname(entryPath), '../dist');
    const outFile = 'output.js';
    const outPath = path.join(outDir, outFile);

    const bundler = new Bundler(entryPath, {
      outDir: path.dirname(outPath),
      outFile: 'output.js',
      hmr: false,
      minify: false,
      cache: false,
      sourceMaps: false,
    });
    registerPlugin(bundler);

    await bundler.bundle();
    const outputStr = (await readFile(outPath)).toString();

    expect(writeBundleLoadersSpy).toHaveBeenCalledTimes(1);
    expect(outputStr).not.toContain('function cacheReplace(id, mod) {');
  });
});

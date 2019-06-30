const path = require('path');

const { exec, matches, proc, rel } = require('./helpers');

describe('exec', () => {
  it('should exist', () => {
    expect(exec).toBeDefined();
  });
});

describe('proc', () => {
  it('should exist', () => {
    expect(proc).toBeDefined();
  });
});

describe('rel', () => {
  it('returns a relative path', () => {
    const cwd = process.cwd();
    const helpers = path.join(__dirname, 'helpers.js');
    const pkg = require.resolve('../package.json');

    expect(rel(cwd, helpers)).toBe('./src/helpers.js');
    expect(rel(cwd, __dirname)).toBe('./src');
    expect(rel(helpers, cwd)).toBe('../..');
    expect(rel(__dirname, pkg)).toBe('../package.json');
  });
});

describe('matches', () => {
  it('creates an iterator of regex matches over a string', () => {
    const str = `\
let wasm;

export function run() {
  return wasm.run();
}

const heap = new Array(32);

export class Sim() {
  static new() {
    return Sim.__wrap(wasm.sim_new());
  }
}

function getObject(idx) { return heap[idx]; }

export function __widl_f_y_DOMRect(arg0) {
  return getObject(arg0).y;
}
`;
    const regex = /export (?:class|const|function) (\w+)/g;
    const iterator = matches(regex, str);

    expect(Array.from(iterator).map(([_, name]) => name)).toEqual([
      'run',
      'Sim',
      '__widl_f_y_DOMRect',
    ]);
  });
});

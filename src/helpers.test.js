const EventEmitter = require('events');
const path = require('path');

const { spawn } = require('child_process');
const logger = require('@parcel/logger');

const { exec, matches, proc, rel } = require('./helpers');

jest.mock('child_process');
jest.mock('@parcel/logger');

describe('exec', () => {
  it('should exist', () => {
    /**
     * it's just a promisified execFile, not sure it's worth testing
     * @see: https://nodejs.org/api/util.html#util_util_promisify_original
     * @see: https://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback
     */
    expect(exec).toBeDefined();
  });
});

describe('proc', () => {
  let mockSpawn;

  beforeEach(() => {
    spawn.mockImplementationOnce(() => {
      mockSpawn = new EventEmitter();
      mockSpawn.stdout = new EventEmitter();
      mockSpawn.stderr = new EventEmitter();

      return mockSpawn;
    });
  });

  it('handles data and close events', async () => {
    setTimeout(() => {
      mockSpawn.stdout.emit('data', 'hello from stdout\n');
      mockSpawn.stdout.emit('data', 'hello again from stdout\n');
      mockSpawn.stdout.emit('data', 'goodbye from stdout');

      mockSpawn.stderr.emit('data', 'hello from stderr\n');
      mockSpawn.emit('close', 0);
    }, 1);

    const stdout = await proc();

    expect(stdout).toBe(`\
hello from stdout
hello again from stdout
goodbye from stdout`);

    expect(logger.progress).toBeCalledTimes(3);
    expect(logger.progress).toBeCalledWith('hello from stderr');
    expect(logger.progress).toBeCalledWith('hello from stdout');
  });

  it('handles non-zero exit codes', async () => {
    setTimeout(() => {
      mockSpawn.stderr.emit('data', 'goodbye from stderr\n');
      mockSpawn.emit('close', 1);
    }, 1);

    try {
      await proc();
    } catch (error) {
      expect(error).toBe('goodbye from stderr\n');
    }
  });

  it('handles the error event', async () => {
    setTimeout(() => {
      mockSpawn.emit('error', 'mock error');
    }, 1);

    try {
      await proc();
    } catch (error) {
      expect(error).toBe('mock error');
    }
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

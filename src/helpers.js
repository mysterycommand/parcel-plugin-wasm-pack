const path = require('path');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');

const logger = require('@parcel/logger');

const exec = promisify(execFile);

function proc(bin, args, opts) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, opts);

    let stdout = '';
    let stdoutLine = '';
    let stderr = '';
    let stderrLine = '';

    p.stdout.on('data', d => {
      stdoutLine += d;

      if (stdoutLine.includes('\n')) {
        stdout += stdoutLine;
        const lines = stdoutLine.split('\n');
        lines.slice(0, -1).forEach(line => logger.progress(line));
        stdoutLine = lines.slice(-1)[0];
      }
    });

    p.stderr.on('data', d => {
      stderrLine += d;

      if (stderrLine.includes('\n')) {
        stderr += stderrLine;
        const lines = stderrLine.split('\n');
        lines.slice(0, -1).forEach(line => logger.progress(line));
        stderrLine = lines.slice(-1)[0];
      }
    });

    p.on('close', code => {
      logger.clear();

      if (code === 0) {
        resolve(stdout);
      } else {
        reject(stderr);
      }
    });

    p.on('error', e => {
      logger.clear();
      reject(e);
    });
  });
}

module.exports = { exec, proc };

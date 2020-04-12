const path = require('path');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');

const logger = require('@parcel/logger');

const exec = promisify(execFile);

function logProgress(line) {
  const lines = line.split('\n');
  lines.slice(0, -1).forEach((line) => logger.progress(line));
  return lines.slice(-1)[0];
}

function createDataHandler(stream) {
  return (data) => {
    stream.currentLine += data;
    if (stream.currentLine.includes('\n')) {
      stream.totalLines += stream.currentLine;
      stream.currentLine = logProgress(stream.currentLine);
    }
  };
}

function createStream() {
  return {
    currentLine: '',
    totalLines: '',
  };
}

function proc(bin, args, opts) {
  return new Promise((resolve, reject) => {
    const process = spawn(bin, args, opts);

    const stdout = createStream();
    const stderr = createStream();

    process.stdout.on('data', createDataHandler(stdout));
    process.stderr.on('data', createDataHandler(stderr));

    process
      .on('close', (code) => {
        logger.clear();
        code === 0
          ? resolve(stdout.totalLines + stdout.currentLine)
          : reject(stderr.totalLines + stderr.currentLine);
      })
      .on('error', (error) => {
        logger.clear();
        reject(error);
      });
  });
}

function rel(from, to) {
  let relativePath = path.relative(from, to);

  if (relativePath[0] !== '.') {
    relativePath = `./${relativePath}`;
  }

  return relativePath.replace(/\\/g, '/');
}

function* matches(regex, str) {
  let match;
  while ((match = regex.exec(str)) !== null) {
    yield match;
  }
}

module.exports = { exec, proc, rel, matches };

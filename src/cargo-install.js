const commandExists = require('command-exists');
const logger = require('@parcel/logger');

const { proc } = require('./child-process');

const installed = {};

const isInstalled = cmdOrBin => installed[cmdOrBin];

function cargoInstall(cmd, bin) {
  bin || (bin = cmd);
  logger.log(`installing ${bin} for ${cmd}`);

  if (installed[bin]) {
    logger.log(`${cmd} already installed, skipping`);
    return;
  }

  return commandExists(cmd)
    .then(() => {
      logger.log(`${cmd} already installed, skipping`);
      installed[cmd] = installed[bin] = true;
    })
    .catch(() =>
      proc('cargo', ['--verbose', 'install', bin])
        .then((/* stdout */) => {
          installed[cmd] = installed[bin] = true;
          logger.log(`${cmd} installed successfully!`);
          // stdout.split('\n').forEach(line => logger.log(line));
        })
        .catch((/* stderr */) => {
          installed[cmd] = installed[bin] = false;
          logger.error(`something went wrong, ${cmd} not installed`);
          // stderr.split('\n').forEach(line => logger.error(line));
        }),
    );
}

module.exports = { isInstalled, cargoInstall };

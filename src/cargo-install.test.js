const { cargoInstall, isInstalled } = require('./cargo-install');

const { proc } = require('./helpers');
const commandExists = require('command-exists');
const logger = require('@parcel/logger');

jest.mock('./helpers');
jest.mock('command-exists');
jest.mock('@parcel/logger');

describe('cargoInstall', () => {
  it('should not call anything if the command has already been installed', async () => {
    commandExists.mockImplementationOnce(() => Promise.resolve());

    await cargoInstall('boozie');

    expect(isInstalled('boozie')).toBe(true);
    expect(commandExists).toHaveBeenCalledTimes(1);
    expect(logger.verbose).toHaveBeenCalledTimes(2);
    expect(logger.verbose).toHaveBeenCalledWith(
      'boozie already installed, skipping',
    );

    await cargoInstall('boozie');

    expect(isInstalled('boozie')).toBe(true);
    expect(commandExists).toHaveBeenCalledTimes(1);
    expect(logger.verbose).toHaveBeenCalledTimes(4);
    expect(logger.verbose).toHaveBeenCalledWith(
      'boozie already installed, skipping',
    );
  });

  it('should not call proc if the command exists', async () => {
    commandExists.mockImplementationOnce(() => Promise.resolve());

    await cargoInstall('hoozle');

    expect(isInstalled('hoozle')).toBe(true);
    expect(proc).toHaveBeenCalledTimes(0);
  });

  it('should call proc if the command does not exist', async () => {
    commandExists.mockImplementationOnce(() => Promise.reject());
    proc.mockImplementationOnce(() => Promise.resolve());

    await cargoInstall('ding-dong');

    expect(isInstalled('ding-dong')).toBe(true);
    expect(proc).toHaveBeenCalledTimes(1);
    expect(proc).toHaveBeenCalledWith('cargo', [
      '--verbose',
      'install',
      'ding-dong',
    ]);
  });

  it('should not mark the command as installed if something went wrong', async () => {
    commandExists.mockImplementationOnce(() => Promise.reject());
    proc.mockImplementationOnce(() => Promise.reject());

    await cargoInstall('golly');

    expect(isInstalled('golly')).toBe(false);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'something went wrong, golly not installed',
    );
  });
});

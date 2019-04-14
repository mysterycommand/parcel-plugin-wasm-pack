const { cargoInstall, isInstalled } = require('./cargo-install');

describe('cargoInstall', () => {
  it('should exist', () => {
    expect(cargoInstall).toBeDefined();
  });
});

describe('isInstalled', () => {
  it('should exist', () => {
    expect(isInstalled).toBeDefined();
  });
});

const {
  bindgenTemplate,
  browserLoaderTemplate,
  nodeOrElectronLoaderTemplate,
} = require('./templates');

describe('bindgenTemplate', () => {
  it('should exist', () => {
    expect(bindgenTemplate).toBeDefined();
  });
});

describe('browserLoaderTemplate', () => {
  it('should exist', () => {
    expect(browserLoaderTemplate).toBeDefined();
  });
});

describe('nodeOrElectronLoaderTemplate', () => {
  it('should exist', () => {
    expect(nodeOrElectronLoaderTemplate).toBeDefined();
  });
});

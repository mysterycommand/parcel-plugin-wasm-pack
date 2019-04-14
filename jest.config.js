module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/*.js'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};

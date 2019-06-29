module.exports = {
  extends: ['plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 9,
  },
  overrides: [
    {
      files: 'examples/**/*.js',
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};

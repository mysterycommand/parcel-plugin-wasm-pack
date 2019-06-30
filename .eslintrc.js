module.exports = {
  extends: ['plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 9,
  },
  overrides: [
    {
      files: ['examples/**/*.js', 'src/loaders/*.js'],
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};

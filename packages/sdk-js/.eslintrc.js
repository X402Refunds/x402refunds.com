module.exports = {
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'off', // TypeScript handles this
    'no-undef': 'off', // TypeScript handles this
  },
};

export default {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: ['tsconfig.json'],
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'prettier', '@nestjs'],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:@nestjs/recommended',
      'plugin:prettier/recommended',
    ],
    env: {
      node: true,
      jest: true,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-types': 'warn',
      'prettier/prettier': 'warn',
      '@nestjs/no-lifecycle-call': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  };
  
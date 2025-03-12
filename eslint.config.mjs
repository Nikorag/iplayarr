import pluginJs from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['**/*.js'] },

  // Enable sorting and enforce single quotes
  {
    plugins: {
      import: importPlugin,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-useless-catch': 'off',
      'no-async-promise-executor': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'quotes': ['error', 'single'],
    }
  }
];

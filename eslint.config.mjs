import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{ts,vue}', 'frontend/src/**/*.{js}'] },
    { languageOptions: { globals: { ...globals.node, ...globals.browser } } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    { ignores: ['**/dist/**', '**/node_modules/**'] },
    {
        plugins: {
            import: importPlugin,
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            indent: ['error', 4],
            '@typescript-eslint/no-explicit-any': 'off',
            'no-useless-catch': 'off',
            'no-async-promise-executor': 'off',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'vue/max-attributes-per-line': 'off',
            'vue/require-default-prop': 'off',
        },
    },
    eslintConfigPrettier,
    {
        // Override Prettier disabling specific rules
        rules: {
            quotes: ['error', 'single'],
        },
    },
];

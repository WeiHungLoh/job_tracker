import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    globalIgnores(['dist/**']),
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: globals.node,
        },
        rules: {
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-trailing-spaces': 'error',
            'space-before-function-paren': ['error', 'always'],
            'eol-last': ['error', 'always'],
            'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
        },
    },
]);

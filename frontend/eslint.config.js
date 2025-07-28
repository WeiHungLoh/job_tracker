// Taken from: https://eslint.org/docs/latest/use/configure/configuration-files
import { defineConfig, globalIgnores } from 'eslint/config';
import babelParser from '@babel/eslint-parser';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react'

export default defineConfig([
  globalIgnores([
    'src/UserGuide/**'
  ]),

  {
    files: ['**/*.js'],
    plugins: {
      js,
      react: reactPlugin
    },
    languageOptions: {
      // Enables parsing of div of every component
      // Taken from: https://eslint.org/docs/latest/use/configure/parser#configure-a-custom-parser
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          babelrc: false,
          configFile: false,
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: ['@babel/plugin-syntax-jsx']
        },
      },
      // Ignores errors pertaining to 'console', 'process' etc not being defined
      globals: {
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        setTimeout: 'readonly',
        document: 'readonly',
        location: 'readonly',
        // Ignores globals for jest/react testing library
        jest: 'readonly',
        global: 'readonly',
        beforeEach: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      // [rule severity, style to enforce]
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'warn',
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'space-before-function-paren': ['error', {
        anonymous: 'always',      // for () => {} or function () {}
        named: 'never',           // for function myUser() {}
        asyncArrow: 'always'      // for async () => {}
      }],
      'eol-last': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      // Taken from: https://eslint.org/docs/latest/rules/sort-imports#rule-details
      'sort-imports': ['error', {
        'ignoreCase': false,
        'ignoreDeclarationSort': false,
        'ignoreMemberSort': false,
        'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
        'allowSeparatedGroups': false
      }]
    },
  },
]);

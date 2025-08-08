// Taken from: https://eslint.org/docs/latest/use/configure/configuration-files
import { defineConfig } from 'eslint/config'
import js from '@eslint/js'

export default defineConfig([
  {
    files: ['**/*.js'],
    plugins: {
      js
    },
    languageOptions: {
      // ignores errors pertaining to 'console' or 'process' not defined
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // [rule severity, style to enforce]
      'no-unused-vars': 'warn',
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'space-before-function-paren': ['error', 'always'],
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
])

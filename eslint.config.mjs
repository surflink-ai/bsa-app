import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'workers/**',
      'public/**',
    ],
  },
  {
    // Pre-existing stylistic/advisory debt is surfaced as warnings so CI can
    // enforce genuine correctness (rules-of-hooks, etc.) without failing the
    // build on legacy code. Tighten these back to "error" as files are cleaned.
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@next/next/no-img-element': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/error-boundaries': 'warn',
    },
  },
]

import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const config = {
    ...eslintPluginPrettierRecommended,
    rules: {
        'prefer-const': 'error',
        'no-var': 'error',
        'prefer-template': 'warn',
        'prefer-rest-params': 'warn',
        'prefer-spread': 'warn',
        'no-implicit-globals': 'error',
        'no-undef': 'error',
        'no-global-assign': 'error',
    },
    globals: {
        'window': 'readonly',
        'require': 'readonly'
    },
    ignores: [
        '/node_modules/',
        '**/node_modules/**',
        '/libs/',
        '**/libs/**',
        '**/dist/**',
        'studio/ost/index.js',
    ],
};

export default [config];

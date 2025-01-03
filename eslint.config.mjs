import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const config = {
    rules: {
        'prefer-const': 'error',
        'no-var': 'error',
        'prefer-template': 'warn',
        'prefer-rest-params': 'warn',
        'prefer-spread': 'warn',
    },
    ignores: [
        '/node_modules/',
        '**/node_modules/**',
        '/libs/',
        '**/libs/**',
        '**/dist/**',
        'studio/ost/products.js',
        'studio/ost/index.js',
    ],
    ...eslintPluginPrettierRecommended,
};

export default [config];

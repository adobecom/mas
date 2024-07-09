import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const config = {
    ...eslintPluginPrettierRecommended,
    ignores: [
        '/node_modules/',
        '**/node_modules/**',
        '/lib/',
        '**/lib/**',
        '**/dist/**',
        'mas.js',
    ],
};

export default [config];

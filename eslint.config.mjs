import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import mochaPlugin from 'eslint-plugin-mocha';
import globals from 'globals';

// Define shared globals that will be used across configs
const sharedGlobals = {
    ...globals.browser,
    ...globals.node,
};

const config = {
    ...eslintPluginPrettierRecommended,
    rules: {
        ...eslintPluginPrettierRecommended.rules,
        'prefer-const': 'error',
        'no-var': 'error',
        'prefer-template': 'warn',
        'prefer-rest-params': 'warn',
        'prefer-spread': 'warn',
        'no-implicit-globals': 'error',
        'no-undef': 'error',
        'no-global-assign': 'error',
    },
    languageOptions: {
        globals: sharedGlobals,
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

// Use Mocha plugin for test files with flat config
const testConfig = {
    ...mochaPlugin.configs.flat.recommended,
    files: ['**/*.test.js', '**/*.spec.js'],
    languageOptions: {
        globals: {
            ...sharedGlobals,
            ...globals.mocha,
        },
    },
};

export default [config, testConfig];

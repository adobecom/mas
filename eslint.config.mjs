import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

const ignoresConfig = {
    ignores: [
        '/node_modules/',
        '**/node_modules/**',
        '/libs/',
        '**/libs/**',
        '**/dist/**',
        'studio/ost/index.js',
        '**/nala/libs/auth.setup.cjs',
        '**/nala/libs/webutil.js',
    ],
};

const config = {
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
    languageOptions: {
        globals: {
            window: 'readonly',
            require: 'readonly',
        },
    },
    ...eslintPluginPrettierRecommended,
};

export default [ignoresConfig, config];

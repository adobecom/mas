import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginImport from 'eslint-plugin-import';
import globals from 'globals';

const ignoresConfig = {
    ignores: [
        '/node_modules/',
        '**/node_modules/**',
        '/deps/',
        '**/deps/**',
        '/libs/',
        '**/libs/**',
        '**/dist/**',
        'studio/ost/index.js',
        '**/nala/libs/auth.setup.cjs',
        '**/nala/libs/webutil.js',
    ],
};

const baseConfig = {
    plugins: {
        import: eslintPluginImport,
    },
    rules: {
        'prefer-const': 'error',
        'no-var': 'error',
        'prefer-template': 'warn',
        'prefer-rest-params': 'warn',
        'prefer-spread': 'warn',
        'no-implicit-globals': 'error',
        'no-undef': 'error',
        'no-global-assign': 'error',
        'import/prefer-default-export': 'off',
        'import/no-unresolved': 'off',
        'import/no-cycle': 'off',
        'import/no-default-export': 'off',
    },
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.mocha,
            ...globals.jest,
            __ENV: 'readonly',
            __VU: 'readonly',
            __ITER: 'readonly',
            STEP: 'readonly',
            RAMP: 'readonly',
            window: 'readonly',
            require: 'readonly',
        },
    },
};

const config = {
    ...eslintPluginPrettierRecommended,
    plugins: {
        ...(eslintPluginPrettierRecommended.plugins || {}),
        ...baseConfig.plugins,
    },
    rules: {
        ...(eslintPluginPrettierRecommended.rules || {}),
        ...baseConfig.rules,
    },
    languageOptions: {
        ...(eslintPluginPrettierRecommended.languageOptions || {}),
        globals: {
            ...(eslintPluginPrettierRecommended.languageOptions?.globals || {}),
            ...baseConfig.languageOptions.globals,
        },
    },
};

export default [ignoresConfig, config];

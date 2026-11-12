import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { cssLoader } from '../css-loader.mjs';

export const absWorkingDir = fileURLToPath(new URL('..', import.meta.url));

const priceLiterals = readFileSync(
    new URL('../price-literals.json', import.meta.url),
    'utf-8',
);

export const priceLiteralsBanner = {
    js: `window.masPriceLiterals = ${priceLiterals}.data;`,
};

export const defaults = {
    absWorkingDir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    plugins: [cssLoader()],
};

export const commerceOptions = {
    ...defaults,
    alias: {
        react: 'test/mocks/react.js',
    },
    entryPoints: ['./src/commerce.js'],
    banner: priceLiteralsBanner,
};

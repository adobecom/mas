import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plan } from './run-affected-tests.mjs';

const studioTests = {
    'studio/test/constants/icon-library.test.js': "import '../../src/constants/icon-library.js'",
    'studio/test/fields/icon-picker-field.test.js': "import '../../src/fields/icon-picker-field.js'",
    'studio/test/other.test.js': "import '../src/other.js'",
};
const argvs = (changed) => plan(changed, studioTests).map(({ argv }) => argv.join(' '));

test('nothing to test', () => assert.deepEqual(argvs(['README.md']), []));

test('non-studio workspace runs its own suite', () =>
    assert.deepEqual(argvs(['web-components/src/merch-badge.js', 'io/studio/x.js']), [
        'npm run test:ci -w web-components',
        'npm run test:ci -w io/studio',
    ]));

test('studio src runs the node tests and the tests that mention it', () =>
    assert.deepEqual(argvs(['studio/src/constants/icon-library.js']), [
        'npm run test:node -w studio',
        'npx wtr --config ./web-test-runner.config.mjs --files test/constants/icon-library.test.js',
    ]));

test('changed studio tests run alongside the ones mentioning changed src', () =>
    assert.deepEqual(argvs(['studio/src/fields/icon-picker-field.js', 'studio/test/other.test.js']), [
        'npm run test:node -w studio',
        'npx wtr --config ./web-test-runner.config.mjs --files test/fields/icon-picker-field.test.js test/other.test.js',
    ]));

test('studio src no test mentions runs only the node tests', () =>
    assert.deepEqual(argvs(['studio/src/unmentioned.js']), ['npm run test:node -w studio']));

test('studio libs run the whole studio suite', () =>
    assert.deepEqual(argvs(['studio/libs/swc.js']), [
        'npm run test:node -w studio',
        'npx wtr --config ./web-test-runner.config.mjs',
    ]));

test('whole studio suite runs from the studio directory', () =>
    assert.equal(plan(['studio/libs/swc.js'], studioTests)[1].cwd, 'studio'));

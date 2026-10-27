import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    getLocaleFromPath,
    swapLocale,
    selectTargetLocales,
    isSourceFragment,
    planTitleUpdate,
    buildTitleUpdateBody,
    summarize,
    formatSummary,
} from '../content/copy-fragment-titles.mjs';
import { CARD_MODEL_ID, COLLECTION_MODEL_ID } from '../content/common.js';

const base = '/content/dam/mas/adobe-home';

test('swapLocale swaps a plain card path', () => {
    assert.equal(swapLocale(`${base}/en_US/cards/ps`, 'fr_FR'), `${base}/fr_FR/cards/ps`);
});

test('swapLocale keeps pzn suffix', () => {
    assert.equal(swapLocale(`${base}/en_US/pzn/group/ps`, 'de_DE'), `${base}/de_DE/pzn/group/ps`);
});

test('swapLocale keeps promotions suffix', () => {
    assert.equal(
        swapLocale(`${base}/en_US/promotions/black-friday/cards/ps`, 'fr_FR'),
        `${base}/fr_FR/promotions/black-friday/cards/ps`,
    );
});

test('swapLocale returns null for a non-matching path', () => {
    assert.equal(swapLocale('/content/dam/other/en_US/x', 'fr_FR'), null);
});

test('getLocaleFromPath returns the locale segment', () => {
    assert.equal(getLocaleFromPath(`${base}/en_US/cards/ps`), 'en_US');
    assert.equal(getLocaleFromPath('/nope'), null);
});

test('selectTargetLocales excludes en_US and keeps region locales', () => {
    const codes = new Set(['en_US', 'fr_FR', 'fr_CA']);
    assert.deepEqual(selectTargetLocales(codes), ['fr_FR', 'fr_CA']);
});

test('selectTargetLocales narrows to one locale', () => {
    const codes = new Set(['en_US', 'fr_FR', 'de_DE']);
    assert.deepEqual(selectTargetLocales(codes, { localeFilter: 'fr_FR' }), ['fr_FR']);
});

test('selectTargetLocales throws for invalid or source filter', () => {
    const codes = new Set(['en_US', 'fr_FR']);
    assert.throws(() => selectTargetLocales(codes, { localeFilter: 'xx_XX' }));
    assert.throws(() => selectTargetLocales(codes, { localeFilter: 'en_US' }));
});

test('isSourceFragment filters by title, model and locale', () => {
    const card = { model: { id: CARD_MODEL_ID }, path: `${base}/en_US/cards/ps`, title: 'Photoshop' };
    assert.equal(isSourceFragment(card), true);
    assert.equal(isSourceFragment({ ...card, model: { id: COLLECTION_MODEL_ID } }), true);
    assert.equal(isSourceFragment({ ...card, title: '   ' }), false);
    assert.equal(isSourceFragment({ ...card, title: '' }), false);
    assert.equal(isSourceFragment({ ...card, model: { id: 'dictionary' } }), false);
    assert.equal(isSourceFragment({ ...card, path: `${base}/fr_FR/cards/ps` }), false);
});

test('planTitleUpdate decides missing, unchanged and update', () => {
    assert.equal(planTitleUpdate('A', null), 'missing');
    assert.equal(planTitleUpdate('A', { title: 'A' }), 'unchanged');
    assert.equal(planTitleUpdate('A', { title: 'B' }), 'update');
});

test('buildTitleUpdateBody changes only the title', () => {
    const target = { title: 'Old', description: 'd', fields: [{ name: 'x', values: ['1'] }] };
    const body = buildTitleUpdateBody(target, 'Photoshop');
    assert.deepEqual(body, { title: 'Photoshop', description: 'd', fields: target.fields });
});

test('summarize counts per locale and in total', () => {
    const summary = summarize([
        { locale: 'fr_FR', outcome: 'updated' },
        { locale: 'de_DE', outcome: 'updated' },
        { locale: 'de_DE', outcome: 'failed' },
    ]);
    assert.deepEqual(summary.totals, { updated: 2, unchanged: 0, missing: 0, failed: 1 });
    assert.deepEqual(summary.byLocale.de_DE, { updated: 1, unchanged: 0, missing: 0, failed: 1 });
});

test('formatSummary prints a sorted table and labels dry runs', () => {
    const summary = summarize([
        { locale: 'fr_FR', outcome: 'updated' },
        { locale: 'de_DE', outcome: 'missing' },
    ]);
    assert.equal(
        formatSummary(summary, false),
        'locale\twould update\tunchanged\tmissing\tfailed\nde_DE\t0\t0\t1\t0\nfr_FR\t1\t0\t0\t0\ntotal\t1\t0\t1\t0',
    );
    assert.match(formatSummary(summary, true), /^locale\tupdated\t/);
});

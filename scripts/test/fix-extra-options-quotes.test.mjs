import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixExtraOptionsQuotes, repairFragment, studioLink, buildReport, run } from '../content/fix-extra-options-quotes.mjs';
import { fixDataExtraOptionsInValue } from '../../io/www/src/fragment/transformers/corrector.js';

test('escapes literal inner quotes', () => {
    assert.equal(
        fixExtraOptionsQuotes('<a data-extra-options="{"actionId":"try"}">Test</a>'),
        '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
    );
});

test('escapes backslash-escaped inner quotes', () => {
    assert.equal(
        fixExtraOptionsQuotes('<a data-extra-options="{\\"actionId\\":\\"try\\"}">Test</a>'),
        '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
    );
});

test('fixes multiple attributes in one value', () => {
    assert.equal(
        fixExtraOptionsQuotes(
            '<a data-extra-options="{"actionId":"try"}">T</a><a data-extra-options="{"actionId":"buy"}">B</a>',
        ),
        '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">T</a><a data-extra-options="{&quot;actionId&quot;:&quot;buy&quot;}">B</a>',
    );
});

test('is idempotent on already-correct value', () => {
    const good = '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>';
    assert.equal(fixExtraOptionsQuotes(good), good);
});

test('leaves &quot; outside the attribute untouched', () => {
    const input = '<p>She said &quot;hi&quot;</p><a data-extra-options="{"x":"y"}">L</a>';
    const expected = '<p>She said &quot;hi&quot;</p><a data-extra-options="{&quot;x&quot;:&quot;y&quot;}">L</a>';
    assert.equal(fixExtraOptionsQuotes(input), expected);
});

test('matches corrector output when no stray &quot; is present', () => {
    const input = '<a data-extra-options="{"actionId":"try"}">Test</a>';
    assert.equal(fixExtraOptionsQuotes(input), fixDataExtraOptionsInValue(input));
});

test('no data-extra-options present is a no-op', () => {
    const input = '<p>Plain "quoted" copy</p>';
    assert.equal(fixExtraOptionsQuotes(input), input);
});

test('repairFragment fixes ctas and reports the field', () => {
    const fragment = {
        fields: [
            { name: 'ctas', type: 'text', values: ['<a data-extra-options="{"actionId":"try"}">T</a>'] },
            { name: 'title', type: 'text', values: ['Untouched "title"'] },
        ],
    };
    const changed = repairFragment(fragment);
    assert.deepEqual(changed, ['ctas']);
    assert.equal(fragment.fields[0].values[0], '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">T</a>');
    assert.equal(fragment.fields[1].values[0], 'Untouched "title"');
});

test('repairFragment returns empty when nothing matches', () => {
    const fragment = { fields: [{ name: 'ctas', type: 'text', values: ['<a>ok</a>'] }] };
    assert.deepEqual(repairFragment(fragment), []);
});

test('repairFragment ignores non-string field values', () => {
    const fragment = { fields: [{ name: 'ctas', type: 'boolean', values: [true] }] };
    assert.deepEqual(repairFragment(fragment), []);
});

test('studioLink builds a studio query deep link', () => {
    assert.equal(studioLink('a1b2'), 'https://mas.adobe.com/studio.html#query=a1b2');
});

test('buildReport lists one link per hit', () => {
    const report = buildReport([{ id: 'a1' }, { id: 'b2' }]);
    assert.equal(report, 'https://mas.adobe.com/studio.html#query=a1\n' + 'https://mas.adobe.com/studio.html#query=b2');
});

const broken = () => ({
    id: 'id1',
    path: '/content/dam/mas/ccd/de_DE/card',
    etag: 'e1',
    title: 't',
    description: 'd',
    status: 'PUBLISHED',
    fields: [{ name: 'ctas', type: 'text', values: ['<a data-extra-options="{"actionId":"try"}">T</a>'] }],
});
const clean = () => ({
    id: 'id2',
    path: '/content/dam/mas/ccd/de_DE/ok',
    etag: 'e2',
    title: 't',
    description: 'd',
    status: 'PUBLISHED',
    fields: [{ name: 'ctas', type: 'text', values: ['<a>ok</a>'] }],
});

function stubFetch(items) {
    const puts = [];
    globalThis.fetch = async (url, init) => {
        if (init?.method === 'PUT') {
            puts.push({ url, body: JSON.parse(init.body) });
            return { ok: true, headers: { get: () => 'e-new' } };
        }
        return { ok: true, json: async () => ({ items, cursor: null }) };
    };
    return puts;
}
const runOpts = { authorHost: 'h', folder: '/content/dam/mas/ccd/de_DE', token: 't', apiKey: 'k' };

test('repairs broken fragments and PUTs them', async () => {
    const puts = stubFetch([broken(), clean()]);
    const { scanned, hits } = await run(runOpts);
    assert.equal(scanned, 2);
    assert.deepEqual(
        hits.map((h) => h.id),
        ['id1'],
    );
    assert.equal(puts.length, 1);
    assert.equal(puts[0].url, 'https://h/adobe/sites/cf/fragments/id1');
    assert.match(puts[0].body.fields[0].values[0], /&quot;actionId&quot;/);
});

test('dry-run performs no PUT', async () => {
    const puts = stubFetch([broken()]);
    const { hits } = await run({ ...runOpts, dryRun: true });
    assert.deepEqual(
        hits.map((h) => h.id),
        ['id1'],
    );
    assert.equal(puts.length, 0);
});

test('limit stops after N hits', async () => {
    const puts = stubFetch([broken(), { ...broken(), id: 'id3' }]);
    const { hits } = await run({ ...runOpts, limit: 1 });
    assert.equal(hits.length, 1);
    assert.equal(puts.length, 1);
});

test('search query fulltext targets the broken data-extra-options signature only', async () => {
    let searchUrl;
    globalThis.fetch = async (url, init) => {
        if (init?.method === 'PUT') return { ok: true, headers: { get: () => 'e' } };
        searchUrl = url;
        return { ok: true, json: async () => ({ items: [], cursor: null }) };
    };
    await run(runOpts);
    const query = JSON.parse(new URL(searchUrl).searchParams.get('query'));
    assert.equal(query.filter.fullText.text, 'data-extra-options="{"');
});

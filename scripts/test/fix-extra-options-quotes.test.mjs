import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixExtraOptionsQuotes, repairFragment, studioLink, buildReport } from '../content/fix-extra-options-quotes.mjs';
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
        fixExtraOptionsQuotes('<a data-extra-options="{"actionId":"try"}">T</a><a data-extra-options="{"actionId":"buy"}">B</a>'),
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

test('studioLink builds a fragment-editor deep link', () => {
    assert.equal(
        studioLink('a1b2'),
        'https://main--mas--adobecom.aem.live/studio.html#page=fragment-editor&fragmentId=a1b2',
    );
});

test('buildReport lists one link per hit', () => {
    const report = buildReport([{ id: 'a1' }, { id: 'b2' }]);
    assert.equal(
        report,
        'https://main--mas--adobecom.aem.live/studio.html#page=fragment-editor&fragmentId=a1\n' +
        'https://main--mas--adobecom.aem.live/studio.html#page=fragment-editor&fragmentId=b2',
    );
});

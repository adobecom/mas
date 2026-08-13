import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixExtraOptionsQuotes } from '../content/fix-extra-options-quotes.mjs';
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

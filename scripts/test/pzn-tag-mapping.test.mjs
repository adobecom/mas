import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    FLAGS,
    RULES,
    LOCALE_TO_COUNTRY_MARKETS,
    UMBRELLA_EXPANSIONS,
    applyBoth,
    applyLocaleToCountry,
    applyUmbrellaExpansion,
    requiredCountryTags,
    tagCountry,
} from '../pzn-tags-locale-to-country/pzn-tag-mapping.mjs';

test('applyLocaleToCountry: plain locale collapses to its market country tag', () => {
    const result = applyLocaleToCountry(['mas:locale/es_EC'], 'es_EC');
    assert.deepEqual(result.tags, ['mas:pzn/country/ec']);
    assert.deepEqual(result.markets, ['EC']);
    assert.equal(result.flags.includes(FLAGS.AMBIGUOUS_CH), false);
});

test('applyLocaleToCountry: AU converts while out-of-market en_AU-tree APAC locales pass through untouched', () => {
    const tags = ['mas:locale/en_AU', 'mas:locale/en_NZ', 'mas:locale/en_SG', 'mas:locale/TH/en_TH', 'mas:locale/MY/en_MY'];
    const result = applyLocaleToCountry(tags, 'en_AU');
    assert.deepEqual(result.tags, [
        'mas:pzn/country/au',
        'mas:locale/en_NZ',
        'mas:locale/en_SG',
        'mas:locale/TH/en_TH',
        'mas:locale/MY/en_MY',
    ]);
    assert.deepEqual(result.markets, ['AU']);
});

test('applyLocaleToCountry: CH collapses 4 locale forms to one country tag and flags AMBIGUOUS_CH + MERGED', () => {
    const tags = ['mas:locale/de_CH', 'mas:locale/fr_CH', 'mas:locale/it_CH', 'mas:locale/en_CH'];
    const result = applyLocaleToCountry(tags, 'de_CH');
    assert.deepEqual(result.tags, ['mas:pzn/country/ch']);
    assert.ok(result.flags.includes(FLAGS.AMBIGUOUS_CH));
    assert.ok(result.flags.includes(FLAGS.MERGED));
});

test('applyLocaleToCountry: out-of-market locale tags and non-geo tags pass through untouched', () => {
    const tags = ['mas:locale/fr_BE', 'mas:pzn/segment/commercial'];
    const result = applyLocaleToCountry(tags, 'fr_BE');
    assert.deepEqual(result.tags, tags);
    assert.deepEqual(result.mapped, []);
});

test('applyLocaleToCountry: GB/AU/IN authoring tree flags EN_GB_TREE', () => {
    const result = applyLocaleToCountry(['mas:locale/en_AU'], 'en_GB');
    assert.ok(result.flags.includes(FLAGS.EN_GB_TREE));
});

test("applyUmbrellaExpansion: MU/TM/DZ expand into exactly their spec'd children, added in country form", () => {
    assert.deepEqual(UMBRELLA_EXPANSIONS.MU, ['KE', 'TZ', 'GH']);
    assert.deepEqual(UMBRELLA_EXPANSIONS.TM, ['AM', 'AZ', 'GE', 'MD', 'KZ', 'KG', 'TJ', 'UZ']);
    assert.deepEqual(UMBRELLA_EXPANSIONS.DZ, ['OM', 'MA', 'LB', 'JO', 'IQ', 'BH']);

    const result = applyUmbrellaExpansion(['mas:pzn/country/mu']);
    assert.deepEqual(result.tags, ['mas:pzn/country/mu', 'mas:pzn/country/ke', 'mas:pzn/country/tz', 'mas:pzn/country/gh']);
    assert.deepEqual(result.expanded, [{ parent: 'MU', children: ['KE', 'TZ', 'GH'] }]);
});

test('applyUmbrellaExpansion: already-present children are not duplicated', () => {
    const result = applyUmbrellaExpansion(['mas:pzn/country/mu', 'mas:pzn/country/ke']);
    assert.deepEqual(result.tags, ['mas:pzn/country/mu', 'mas:pzn/country/ke', 'mas:pzn/country/tz', 'mas:pzn/country/gh']);
});

test('applyUmbrellaExpansion: non-English-only parent is skipped and flagged PARENT_NON_EN', () => {
    const result = applyUmbrellaExpansion(['mas:locale/ru_TM']);
    assert.deepEqual(result.tags, ['mas:locale/ru_TM']);
    assert.ok(result.flags.includes(FLAGS.PARENT_NON_EN));
    assert.deepEqual(result.skipped, ['TM']);
});

test('tagCountry: detects country regardless of tag form', () => {
    assert.equal(tagCountry('mas:pzn/country/tm'), 'TM');
    assert.equal(tagCountry('mas:locale/ru_TM'), 'TM');
    assert.equal(tagCountry('mas:pzn/segment/commercial'), null);
});

test('applyBoth: rule classification (NOOP / LOCALE_TO_COUNTRY / UMBRELLA_EXPANSION / BOTH)', () => {
    assert.equal(applyBoth(['mas:pzn/segment/commercial']).rule, RULES.NOOP);
    assert.equal(applyBoth(['mas:locale/es_EC'], { locale: 'es_EC' }).rule, RULES.LOCALE_TO_COUNTRY);
    assert.equal(applyBoth(['mas:pzn/country/mu'], { locale: 'en_US' }).rule, RULES.UMBRELLA_EXPANSION);
    assert.equal(applyBoth(['mas:locale/es_EC', 'mas:pzn/country/mu'], { locale: 'en_US' }).rule, RULES.BOTH);
});

test('applyBoth: idempotent — re-applying to the output is a no-op', () => {
    const tags = ['mas:locale/es_EC', 'mas:pzn/country/mu'];
    const first = applyBoth(tags, { locale: 'en_US' });
    const second = applyBoth(first.tags, { locale: 'en_US' });
    assert.deepEqual(second.tags, first.tags);
    assert.equal(second.rule, RULES.NOOP);
});

test('requiredCountryTags: union of all 40 localeToCountry markets and 17 umbrella children, deduped', () => {
    const required = requiredCountryTags();
    assert.equal(required.length, 40 + 17);
    assert.ok(required.includes('mas:pzn/country/ec'));
    assert.ok(required.includes('mas:pzn/country/ke'));
    assert.equal(new Set(required).size, required.length);
});

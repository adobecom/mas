import { expect } from 'chai';
import { collectSettingEntries, extractValue, resolveSettingEntry } from '../../src/fragment/transformers/settings.js';

const PLAN_TYPE_TAG = 'mas:plan_type/abm';

const settingRef = (fields) => ({ type: 'content-fragment', value: { fields } });

// Overrides scoped to the plan_type tag and the `plans` template, as authored in the settings fragment.
const settings = collectSettingEntries({
    references: {
        planTypeDefault: settingRef({ name: 'displayPlanType', valuetype: 'boolean', booleanValue: false }),
        planTypeOverride: settingRef({
            name: 'displayPlanType',
            valuetype: 'boolean',
            booleanValue: true,
            tags: [PLAN_TYPE_TAG],
            templates: ['plans'],
        }),
        secureDefault: settingRef({
            name: 'secureLabel',
            valuetype: 'optional-text',
            booleanValue: false,
            textValue: '{{secure-label}}',
        }),
        secureOverride: settingRef({
            name: 'secureLabel',
            valuetype: 'optional-text',
            booleanValue: true,
            textValue: '{{secure-label}}',
            tags: [PLAN_TYPE_TAG],
            templates: ['plans'],
        }),
    },
});

const releaseCard = (variant, tags) => ({
    fields: {
        variant,
        tags: ['mas:product_code/ANTR', 'mas:pa/PA-2543', 'mas:customer_segment/TEAM', 'mas:market_segments/COM', ...tags],
    },
});

const resolve = (card, name) => extractValue(resolveSettingEntry(card, 'en_US', settings[name], undefined), card);

describe('release card plan_type tag drives per-surface settings', () => {
    it('applies the ABM label and secure label to a tagged card on a supporting template', () => {
        const card = releaseCard('plans', [PLAN_TYPE_TAG]);
        expect(resolve(card, 'displayPlanType')).to.equal(true);
        expect(resolve(card, 'secureLabel')).to.equal('{{secure-label}}');
    });

    it('does not apply them to a tagged card on a template outside the override', () => {
        const card = releaseCard('catalog', [PLAN_TYPE_TAG]);
        expect(resolve(card, 'displayPlanType')).to.equal(false);
        expect(resolve(card, 'secureLabel')).to.equal('');
    });

    it('keeps the defaults for a card without a plan_type tag', () => {
        const card = releaseCard('plans', []);
        expect(resolve(card, 'displayPlanType')).to.equal(false);
        expect(resolve(card, 'secureLabel')).to.equal('');
    });
});

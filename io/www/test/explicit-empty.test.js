import { expect } from 'chai';
import {
    coerceValuesWithoutExplicitEmpty,
    EXPLICIT_EMPTY_SENTINEL,
    fieldAllowsExplicitEmpty,
    fieldValuesArePersistedExplicitEmpty,
    isExplicitEmptySentinel,
    normalizeExplicitEmptyInAuthorFields,
    normalizeExplicitEmptyInFields,
    toPersistedExplicitEmptyValues,
} from '../src/fragment/utils/explicit-empty.js';
import { deepMerge } from '../src/fragment/transformers/customize.js';
import { transformBody } from '../src/fragment/utils/odinSchemaTransform.js';

describe('explicit-empty sentinel', () => {
    it('identifies persisted sentinel values', () => {
        expect(isExplicitEmptySentinel(EXPLICIT_EMPTY_SENTINEL)).to.be.true;
        expect(fieldValuesArePersistedExplicitEmpty(toPersistedExplicitEmptyValues())).to.be.true;
    });

    it('disallows explicit_empty on structural metadata fields', () => {
        expect(fieldAllowsExplicitEmpty('badge')).to.be.true;
        expect(fieldAllowsExplicitEmpty('compatVersion')).to.be.false;
        expect(coerceValuesWithoutExplicitEmpty('compatVersion', toPersistedExplicitEmptyValues())).to.deep.equal(['']);
        expect(coerceValuesWithoutExplicitEmpty('tags', toPersistedExplicitEmptyValues(), { multiple: true })).to.deep.equal(
            [],
        );
    });

    it('disallows explicit_empty on boolean fields', () => {
        for (const booleanField of ['locReady', 'showSecureLabel', 'showPlanType']) {
            expect(fieldAllowsExplicitEmpty(booleanField)).to.be.false;
            expect(coerceValuesWithoutExplicitEmpty(booleanField, toPersistedExplicitEmptyValues())).to.deep.equal(['']);
        }
    });

    it('normalizeExplicitEmptyInAuthorFields strips sentinel from disallowed fields', () => {
        const fields = normalizeExplicitEmptyInAuthorFields([
            { name: 'compatVersion', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
            { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
        ]);
        expect(fields.find((field) => field.name === 'compatVersion').values).to.deep.equal(['']);
        expect(fields.find((field) => field.name === 'badge').values).to.deep.equal(['']);
    });

    it('normalizes flat fields for publish', () => {
        const fields = {
            promoCode: EXPLICIT_EMPTY_SENTINEL,
            mnemonicIcon: [EXPLICIT_EMPTY_SENTINEL],
            title: 'Keep me',
        };
        normalizeExplicitEmptyInFields(fields);
        expect(fields.promoCode).to.equal('');
        expect(fields.mnemonicIcon).to.deep.equal([]);
        expect(fields.title).to.equal('Keep me');
    });

    it('deepMerge applies explicit_empty overrides like empty string', () => {
        const left = { fields: { promoCode: 'PARENT' } };
        const right = { fields: { promoCode: EXPLICIT_EMPTY_SENTINEL } };
        const merged = deepMerge(left, right);
        expect(merged.fields.promoCode).to.equal(EXPLICIT_EMPTY_SENTINEL);
        normalizeExplicitEmptyInFields(merged.fields);
        expect(merged.fields.promoCode).to.equal('');
    });

    it('normalizeExplicitEmptyInAuthorFields maps sentinel rows for preview cache', () => {
        const fields = normalizeExplicitEmptyInAuthorFields([
            { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
            { name: 'mnemonicIcon', values: [EXPLICIT_EMPTY_SENTINEL], multiple: true },
            { name: 'title', values: ['Keep me'], multiple: false },
        ]);
        expect(fields.find((field) => field.name === 'badge').values).to.deep.equal(['']);
        expect(fields.find((field) => field.name === 'mnemonicIcon').values).to.deep.equal([]);
        expect(fields.find((field) => field.name === 'title').values).to.deep.equal(['Keep me']);
    });

    it('transformBody maps sentinel values to empty strings', () => {
        const body = transformBody({
            fields: [
                { name: 'promoCode', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
                { name: 'mnemonicIcon', values: [EXPLICIT_EMPTY_SENTINEL], multiple: true },
            ],
            references: [],
        });
        expect(body.fields.promoCode).to.equal('');
        expect(body.fields.mnemonicIcon).to.deep.equal(['']);
    });
});

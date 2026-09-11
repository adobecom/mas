import { expect } from 'chai';
import {
    EXPLICIT_EMPTY_SENTINEL,
    fieldValuesArePersistedExplicitEmpty,
    isExplicitEmptyField,
    isExplicitEmptySentinel,
    normalizeExplicitEmptyInFields,
    parentValuesHaveContent,
    toPersistedExplicitEmptyValues,
} from '../src/fragment/utils/explicit-empty.js';
import { deepMerge } from '../src/fragment/transformers/customize.js';
import { transformBody } from '../src/fragment/utils/odinSchemaTransform.js';

describe('explicit-empty sentinel', () => {
    describe('parentValuesHaveContent', () => {
        it('returns true when values contain non-empty strings', () => {
            expect(parentValuesHaveContent(['Hello'])).to.be.true;
            expect(parentValuesHaveContent(['  trimmed  '])).to.be.true;
        });

        it('returns false for empty, null, undefined, or whitespace-only values', () => {
            expect(parentValuesHaveContent([])).to.be.false;
            expect(parentValuesHaveContent([''])).to.be.false;
            expect(parentValuesHaveContent([null])).to.be.false;
            expect(parentValuesHaveContent([undefined])).to.be.false;
            expect(parentValuesHaveContent(['   '])).to.be.false;
            expect(parentValuesHaveContent(undefined)).to.be.false;
        });
    });

    describe('isExplicitEmptyField', () => {
        it('returns true for allowed fields', () => {
            expect(isExplicitEmptyField('badge')).to.be.true;
        });

        it('returns false for non-allowed fields', () => {
            expect(isExplicitEmptyField('promoCode')).to.be.false;
            expect(isExplicitEmptyField('')).to.be.false;
        });
    });

    it('identifies persisted sentinel values', () => {
        expect(isExplicitEmptySentinel(EXPLICIT_EMPTY_SENTINEL)).to.be.true;
        expect(isExplicitEmptySentinel('')).to.be.false;
        expect(fieldValuesArePersistedExplicitEmpty(toPersistedExplicitEmptyValues())).to.be.true;
        expect(fieldValuesArePersistedExplicitEmpty([''])).to.be.false;
        expect(fieldValuesArePersistedExplicitEmpty(undefined)).to.be.false;
    });

    describe('normalizeExplicitEmptyInFields — flat object format', () => {
        it('returns non-object inputs unchanged', () => {
            expect(normalizeExplicitEmptyInFields(null)).to.be.null;
            expect(normalizeExplicitEmptyInFields(undefined)).to.be.undefined;
        });

        it('normalizes badge scalar sentinel', () => {
            const result = normalizeExplicitEmptyInFields({ badge: EXPLICIT_EMPTY_SENTINEL });
            expect(result.badge).to.equal('');
        });

        it('normalizes persisted badge array sentinel to empty array', () => {
            const result = normalizeExplicitEmptyInFields({ badge: [EXPLICIT_EMPTY_SENTINEL] });
            expect(result.badge).to.deep.equal([]);
        });

        it('normalizes badge object value sentinel', () => {
            const result = normalizeExplicitEmptyInFields({
                badge: { value: EXPLICIT_EMPTY_SENTINEL, mimeType: 'text/html' },
            });
            expect(result.badge.value).to.equal('');
        });

        it('maps sentinels in badge multi-value arrays', () => {
            const result = normalizeExplicitEmptyInFields({ badge: ['Visible', EXPLICIT_EMPTY_SENTINEL] });
            expect(result.badge).to.deep.equal(['Visible', '']);
        });

        it('clears sentinel on disallowed field object values', () => {
            const result = normalizeExplicitEmptyInFields({
                promoCode: { value: EXPLICIT_EMPTY_SENTINEL, mimeType: 'text/html' },
            });
            expect(result.promoCode.value).to.equal('');
        });

        it('does not mutate the input', () => {
            const fields = { promoCode: EXPLICIT_EMPTY_SENTINEL, badge: [EXPLICIT_EMPTY_SENTINEL] };
            normalizeExplicitEmptyInFields(fields);
            expect(fields.promoCode).to.equal(EXPLICIT_EMPTY_SENTINEL);
            expect(fields.badge).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
        });
    });

    describe('normalizeExplicitEmptyInFields — author array format', () => {
        it('returns non-array inputs unchanged', () => {
            expect(normalizeExplicitEmptyInFields(undefined)).to.be.undefined;
            expect(normalizeExplicitEmptyInFields(null)).to.be.null;
        });

        it('maps sentinels in badge multiple field values', () => {
            const fields = normalizeExplicitEmptyInFields([
                { name: 'badge', values: ['Keep', EXPLICIT_EMPTY_SENTINEL], multiple: true },
            ]);
            expect(fields[0].values).to.deep.equal(['Keep', '']);
        });

        it('returns allowed fields unchanged when no sentinel normalization applies', () => {
            const input = [{ name: 'badge', values: ['Hello'], multiple: false }];
            const fields = normalizeExplicitEmptyInFields(input);
            expect(fields[0]).to.equal(input[0]);
        });

        it('returns fields without a values property unchanged', () => {
            const input = [{ name: 'promoCode', multiple: false }];
            const fields = normalizeExplicitEmptyInFields(input);
            expect(fields[0]).to.equal(input[0]);
        });

        it('maps persisted badge sentinel to empty array when multiple', () => {
            const fields = normalizeExplicitEmptyInFields([
                { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL], multiple: true },
            ]);
            expect(fields[0].values).to.deep.equal([]);
        });

        it('maps persisted badge sentinel to single-element empty array when non-multiple', () => {
            const fields = normalizeExplicitEmptyInFields([
                { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
            ]);
            expect(fields[0].values).to.deep.equal(['']);
        });
    });

    it('normalizes flat fields for publish', () => {
        const result = normalizeExplicitEmptyInFields({
            promoCode: EXPLICIT_EMPTY_SENTINEL,
            mnemonicIcon: [EXPLICIT_EMPTY_SENTINEL],
            title: 'Keep me',
        });
        expect(result.promoCode).to.equal('');
        expect(result.mnemonicIcon).to.deep.equal([]);
        expect(result.title).to.equal('Keep me');
    });

    it('deepMerge preserves explicit_empty override for badge', () => {
        const left = { fields: { badge: 'PARENT' } };
        const right = { fields: { badge: EXPLICIT_EMPTY_SENTINEL } };
        const merged = deepMerge(left, right);
        expect(merged.fields.badge).to.equal(EXPLICIT_EMPTY_SENTINEL);
        const normalized = normalizeExplicitEmptyInFields(merged.fields);
        expect(normalized.badge).to.equal('');
    });

    it('normalizeExplicitEmptyInFields (author) maps sentinel rows for preview cache', () => {
        const fields = normalizeExplicitEmptyInFields([
            { name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL], multiple: false },
            { name: 'mnemonicIcon', values: [EXPLICIT_EMPTY_SENTINEL], multiple: true },
            { name: 'title', values: ['Keep me'], multiple: false },
        ]);
        expect(fields.find((field) => field.name === 'badge').values).to.deep.equal(['']);
        expect(fields.find((field) => field.name === 'mnemonicIcon').values).to.deep.equal([]);
        expect(fields.find((field) => field.name === 'title').values).to.deep.equal(['Keep me']);
    });
});

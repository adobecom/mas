import { expect } from '@esm-bundle/chai';
import {
    EXPLICIT_EMPTY_SENTINEL,
    authorFieldValueForHydrate,
    fieldValuesArePersistedExplicitEmpty,
} from '../src/explicit-empty.js';

describe('explicit-empty (web-components)', () => {
    it('identifies persisted sentinel values', () => {
        expect(fieldValuesArePersistedExplicitEmpty([EXPLICIT_EMPTY_SENTINEL]))
            .to.be.true;
    });

    it('authorFieldValueForHydrate maps sentinel rows for aem-fragment author mode', () => {
        expect(
            authorFieldValueForHydrate(false, [EXPLICIT_EMPTY_SENTINEL]),
        ).to.equal('');
        expect(
            authorFieldValueForHydrate(true, [EXPLICIT_EMPTY_SENTINEL]),
        ).to.deep.equal([]);
        expect(authorFieldValueForHydrate(false, ['Badge text'])).to.equal(
            'Badge text',
        );
    });
});

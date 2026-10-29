import { expect } from 'chai';
import { enrichContextWithSurface } from '../../src/ai-chat/index.js';

describe('enrichContextWithSurface', () => {
    it('returns an assignable object when context is missing so later enrichment cannot crash', () => {
        const result = enrichContextWithSurface(undefined);

        expect(result).to.be.an('object');
        expect(() => {
            result.ragContext = 'docs';
        }).to.not.throw();
    });

    it('derives surface and locale from a provided context', () => {
        const result = enrichContextWithSurface({
            currentPath: '/content/dam/mas/acom/en_US/card',
            currentLocale: 'fr_FR',
        });

        expect(result.surface).to.equal('acom');
        expect(result.locale).to.equal('fr_FR');
    });
});

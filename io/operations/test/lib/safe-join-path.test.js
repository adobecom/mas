import { expect } from 'chai';
import { safeJoinPath } from '../../src/lib/studio-operations.js';

const BASE = '/content/dam/mas/sandbox/en_US';

describe('safeJoinPath', () => {
    it('returns the base unchanged when no relative path is given', () => {
        expect(safeJoinPath(BASE)).to.equal(BASE);
        expect(safeJoinPath(BASE, '')).to.equal(BASE);
        expect(safeJoinPath(BASE, null)).to.equal(BASE);
    });

    it('joins a relative subfolder under the base', () => {
        expect(safeJoinPath(BASE, 'promotions')).to.equal(`${BASE}/promotions`);
        expect(safeJoinPath(BASE, 'promotions/summer-sale')).to.equal(`${BASE}/promotions/summer-sale`);
    });

    it('strips surrounding slashes so a leading-slash path stays relative to the base', () => {
        expect(safeJoinPath(BASE, '/promotions/')).to.equal(`${BASE}/promotions`);
    });

    it('rejects parent traversal so a search can never escape the surface', () => {
        expect(() => safeJoinPath(BASE, '..')).to.throw(/path/i);
        expect(() => safeJoinPath(BASE, 'promotions/../../acom')).to.throw(/path/i);
        expect(() => safeJoinPath(BASE, 'a/./b')).to.throw(/path/i);
    });
});

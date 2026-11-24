import { expect } from '@esm-bundle/chai';
import { addRecent, parseRecent, readRecent, writeRecent, RECENT_PRODUCTS_KEY } from '../../src/utils/recent-products.js';

describe('recent-products', () => {
    afterEach(() => {
        localStorage.removeItem(RECENT_PRODUCTS_KEY);
    });

    it('addRecent adds to an empty list', () => {
        expect(addRecent([], 'a')).to.deep.equal(['a']);
    });

    it('addRecent dedupes and moves the id to the front', () => {
        expect(addRecent(['a', 'b', 'c'], 'b')).to.deep.equal(['b', 'a', 'c']);
    });

    it('addRecent caps at 12 by default and honors a custom max', () => {
        const list = Array.from({ length: 12 }, (_, index) => `id${index}`);
        const next = addRecent(list, 'new');
        expect(next.length).to.equal(12);
        expect(next[0]).to.equal('new');
        expect(addRecent(['a', 'b', 'c'], 'd', 2)).to.deep.equal(['d', 'a']);
    });

    it('parseRecent tolerates bad input', () => {
        expect(parseRecent(null)).to.deep.equal([]);
        expect(parseRecent('not json')).to.deep.equal([]);
        expect(parseRecent('{"a":1}')).to.deep.equal([]);
        expect(parseRecent('["a",1,"b"]')).to.deep.equal(['a', 'b']);
    });

    it('writeRecent and readRecent round trip', () => {
        writeRecent(['a', 'b']);
        expect(localStorage.getItem(RECENT_PRODUCTS_KEY)).to.equal('["a","b"]');
        expect(readRecent()).to.deep.equal(['a', 'b']);
    });

    it('readRecent returns an empty list for invalid stored values', () => {
        localStorage.setItem(RECENT_PRODUCTS_KEY, 'oops');
        expect(readRecent()).to.deep.equal([]);
    });

    it('readRecent and writeRecent survive storage errors', () => {
        const getItem = Storage.prototype.getItem;
        const setItem = Storage.prototype.setItem;
        Storage.prototype.getItem = () => {
            throw new Error('blocked');
        };
        Storage.prototype.setItem = () => {
            throw new Error('blocked');
        };
        try {
            expect(readRecent()).to.deep.equal([]);
            expect(() => writeRecent(['a'])).to.not.throw();
        } finally {
            Storage.prototype.getItem = getItem;
            Storage.prototype.setItem = setItem;
        }
    });
});

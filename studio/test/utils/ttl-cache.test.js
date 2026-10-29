import { expect } from '@esm-bundle/chai';
import { createTtlCache } from '../../src/utils/ttl-cache.js';

describe('createTtlCache', () => {
    let realNow;
    let time;
    beforeEach(() => {
        realNow = Date.now;
        time = 1000;
        Date.now = () => time;
    });
    afterEach(() => {
        Date.now = realNow;
    });

    it('shares one load per key until the ttl expires', async () => {
        const cache = createTtlCache(100);
        let loads = 0;
        const load = async () => ++loads;
        expect(await cache('a', load)).to.equal(1);
        expect(await cache('a', load)).to.equal(1);
        expect(await cache('b', load)).to.equal(2);
        time += 100;
        expect(await cache('a', load)).to.equal(3);
    });

    it('evicts a failed load so the next call retries', async () => {
        const cache = createTtlCache(100);
        let loads = 0;
        const load = async () => {
            if (++loads === 1) throw new Error('boom');
            return loads;
        };
        let error;
        await cache('a', load).catch((e) => (error = e));
        expect(error.message).to.equal('boom');
        expect(await cache('a', load)).to.equal(2);
    });
});

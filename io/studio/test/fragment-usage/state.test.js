const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const zlib = require('zlib');

const { PAGE_RETENTION_HOURS } = require('../../src/fragment-usage/pages');

const FRAGMENT = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';
const USAGE_KEY = `fragment-usage.${FRAGMENT}`;
const LEASE_KEY = 'fragment-usage-rollup.lease';
const RECORD = {
    version: 1,
    updatedAt: '2026-10-15T12:00:00.000Z',
    pages: { 493512: { 'https://www.adobe.com/express/#en_US': { requests: 42, countries: { US: 42 } } } },
};

/** Loads the real State module over an in-memory State client that records every put and honours its TTL. */
function loadState(entries = {}) {
    const puts = [];
    const expiries = {};
    const client = {
        get: async (key) => (key in entries && !(expiries[key] <= Date.now()) ? { value: entries[key] } : undefined),
        put: async (key, value, options) => {
            entries[key] = value;
            if (options?.ttl) expiries[key] = Date.now() + options.ttl * 1000;
            puts.push({ key, value, options });
            return key;
        },
        delete: async (key) => {
            delete entries[key];
            return key;
        },
    };
    const init = sinon.stub().resolves(client);
    const state = proxyquire('../../src/fragment-usage/state', {
        '@adobe/aio-lib-state': { init, '@noCallThru': true },
    });
    return { state, client, entries, puts, init };
}

const noWait = async () => {};

/** A settle that holds every claimant until `count` are waiting, so all claims land before any re-read. */
function settleTogether(count) {
    let waiting = 0;
    let release;
    const settled = new Promise((resolve) => {
        release = resolve;
    });
    return async () => {
        waiting += 1;
        if (waiting === count) release();
        return settled;
    };
}

describe('fragment-usage state', () => {
    it('reads null for a fragment that has never been stored', async () => {
        const { state, client } = loadState();
        expect(await state.readUsage(FRAGMENT, client)).to.equal(null);
    });

    it('stores each fragment under its own key', async () => {
        const { state, client, entries } = loadState();
        await state.writeUsage(FRAGMENT, RECORD, client);
        expect(Object.keys(entries)).to.deep.equal([USAGE_KEY]);
    });

    it('stores the record brotli-compressed and base64-encoded', async () => {
        const { state, client, entries } = loadState();
        await state.writeUsage(FRAGMENT, RECORD, client);
        const decoded = JSON.parse(zlib.brotliDecompressSync(Buffer.from(entries[USAGE_KEY], 'base64')).toString());
        expect(decoded).to.deep.equal(RECORD);
    });

    it('expires a record a day after the oldest data it can hold ages out', async () => {
        const { state, client, puts } = loadState();
        await state.writeUsage(FRAGMENT, RECORD, client);
        expect(puts[0].options).to.deep.equal({ ttl: (PAGE_RETENTION_HOURS + 24) * 60 * 60 });
    });

    it('reads back the record it wrote', async () => {
        const { state, client } = loadState();
        await state.writeUsage(FRAGMENT, RECORD, client);
        expect(await state.readUsage(FRAGMENT, client)).to.deep.equal(RECORD);
    });

    it('initialises its own State client when none is passed in', async () => {
        const { state, init } = loadState();
        await state.writeUsage(FRAGMENT, RECORD);
        expect(await state.readUsage(FRAGMENT)).to.deep.equal(RECORD);
        expect(init.callCount).to.equal(2);
    });

    it('starts an empty record with no pages', () => {
        const { state } = loadState();
        expect(state.emptyRecord()).to.deep.equal({ version: 1, updatedAt: null, pages: {} });
    });
});

describe('fragment-usage rollup lease', () => {
    afterEach(() => sinon.restore());

    it('grants the lease when no rollup holds it', async () => {
        const { state, client, entries } = loadState();
        expect(await state.acquireRollupLease('run-a', client, noWait)).to.equal(true);
        expect(entries[LEASE_KEY]).to.equal('run-a');
    });

    it('lets the lease lapse when the rollup action would have timed out', async () => {
        const { state, client, puts } = loadState();
        await state.acquireRollupLease('run-a', client, noWait);
        expect(puts[0].options).to.deep.equal({ ttl: 300 });
    });

    it('grants the lease to only one of two runs that both read it as free', async () => {
        const { state, client } = loadState();
        const settle = settleTogether(2);

        const granted = await Promise.all([
            state.acquireRollupLease('run-a', client, settle),
            state.acquireRollupLease('run-b', client, settle),
        ]);

        expect(granted.filter(Boolean)).to.have.length(1);
    });

    it('abandons a claim that landed too long after the lease was read as free', async () => {
        // A slow claim can land after a competing run has already confirmed its own.
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        const { state, client } = loadState();
        const put = client.put;
        client.put = async (...args) => {
            clock.tick(5000);
            return put(...args);
        };

        expect(await state.acquireRollupLease('run-a', client, noWait)).to.equal(false);
    });

    it('refuses the lease while another rollup holds it', async () => {
        const { state, client, entries, puts } = loadState({ [LEASE_KEY]: 'run-a' });
        expect(await state.acquireRollupLease('run-b', client)).to.equal(false);
        expect(entries[LEASE_KEY]).to.equal('run-a');
        expect(puts).to.have.length(0);
    });

    describe('after a claim is abandoned', () => {
        let clock;
        let state;
        let client;

        beforeEach(async () => {
            clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
            ({ state, client } = loadState());
            const put = client.put;
            client.put = async (...args) => {
                clock.tick(5000);
                return put(...args);
            };
            await state.acquireRollupLease('run-a', client, noWait);
            client.put = put;
        });

        it('refuses a retry while the abandoned claim is still live', async () => {
            expect(await state.acquireRollupLease('run-b', client, noWait)).to.equal(false);
        });

        it('grants a retry once the abandoned claim lapses', async () => {
            clock.tick(300 * 1000);
            expect(await state.acquireRollupLease('run-b', client, noWait)).to.equal(true);
        });
    });
});

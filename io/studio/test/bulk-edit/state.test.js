const { expect } = require('chai');
const proxyquire = require('proxyquire');

function load(store = {}) {
    const fakeState = {
        put: async (key, value) => {
            store[key] = value;
        },
        get: async (key) => (store[key] === undefined ? undefined : { value: store[key] }),
        delete: async (key) => {
            delete store[key];
        },
    };
    const mod = proxyquire('../../src/bulk-edit/state.js', {
        '@adobe/aio-lib-state': { init: async () => fakeState, '@noCallThru': true },
    });
    return { mod, store };
}

describe('bulk-edit/state: writeJob + readJob', () => {
    it('round-trips a job record by jobId', async () => {
        const { mod } = load();
        await mod.writeJob('abc', { status: 'RUNNING', results: [], total: 0 });
        expect(await mod.readJob('abc')).to.deep.equal({ status: 'RUNNING', results: [], total: 0 });
    });
    it('keys state as bulk-edit.{jobId}', async () => {
        const { mod, store } = load();
        await mod.writeJob('abc', { x: 1 });
        expect(store['bulk-edit.abc']).to.equal(JSON.stringify({ x: 1 }));
    });
    it('returns null for an unknown jobId', async () => {
        const { mod } = load();
        expect(await mod.readJob('missing')).to.equal(null);
    });
});

describe('bulk-edit/state: patchJob', () => {
    it('shallow-merges a patch over the existing record', async () => {
        const { mod } = load();
        await mod.writeJob('abc', { status: 'RUNNING', results: [], total: 0 });
        await mod.patchJob('abc', { status: 'DONE', total: 3 });
        expect(await mod.readJob('abc')).to.deep.equal({ status: 'DONE', results: [], total: 3 });
    });
    it('creates the record when none exists', async () => {
        const { mod } = load();
        await mod.patchJob('new', { status: 'FAILED' });
        expect(await mod.readJob('new')).to.deep.equal({ status: 'FAILED' });
    });
});

describe('bulk-edit/state: user CSV', () => {
    it('keys user CSV as bulk-edit.{jobId}.csv', async () => {
        const { mod, store } = load();
        await mod.writeUserCsv('abc', { jobId: 'abc', rows: [] });
        expect(store['bulk-edit.abc.csv']).to.equal(JSON.stringify({ jobId: 'abc', rows: [] }));
    });
    it('round-trips user CSV records', async () => {
        const { mod } = load();
        const value = { jobId: 'abc', uploadedAt: '2026-01-01T00:00:00.000Z', rows: [{ fragment_id: 'f1' }] };
        await mod.writeUserCsv('abc', value);
        expect(await mod.readUserCsv('abc')).to.deep.equal(value);
    });
    it('uses MAX_TTL for user CSV writes', async () => {
        const puts = [];
        const fakeState = {
            put: async (key, value, opts) => {
                puts.push({ key, value, opts });
            },
            get: async () => undefined,
            delete: async () => {},
        };
        const mod = proxyquire('../../src/bulk-edit/state.js', {
            '@adobe/aio-lib-state': { init: async () => fakeState, MAX_TTL: 31536000, '@noCallThru': true },
        });
        await mod.writeUserCsv('abc', { rows: [] });
        expect(puts[0].key).to.equal('bulk-edit.abc.csv');
        expect(puts[0].opts.ttl).to.equal(31536000);
    });
});

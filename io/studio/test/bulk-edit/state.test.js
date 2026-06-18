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

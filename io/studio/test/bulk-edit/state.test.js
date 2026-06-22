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

const sampleJob = {
    status: 'DONE',
    total: 2,
    results: [
        {
            id: 'frag-1',
            path: '/content/dam/mas/sandbox/en_US/foo',
            locale: 'en_US',
            status: 'PUBLISHED',
            etag: 'e1',
            matches: [{ field: 'subtitle', value: 'firefly' }],
        },
        {
            id: 'frag-2',
            path: '/content/dam/mas/sandbox/en_US/bar',
            locale: 'en_US',
            status: 'PUBLISHED',
            etag: 'e2',
            matches: [{ field: 'title', value: 'firefly pro' }],
        },
    ],
};

describe('bulk-edit/state: encodeStateValue + decodeStateValue', () => {
    it('round-trips a job-shaped object', () => {
        const { mod } = load();
        const encoded = mod.encodeStateValue(sampleJob);
        expect(mod.decodeStateValue(encoded)).to.deep.equal(sampleJob);
    });
    it('throws on invalid base64 payload', () => {
        const { mod } = load();
        expect(() => mod.decodeStateValue('not-valid-base64!!!')).to.throw();
    });
});

describe('bulk-edit/state: writeJob + readJob', () => {
    it('round-trips a job record by jobId', async () => {
        const { mod } = load();
        await mod.writeJob('abc', { status: 'RUNNING', results: [], total: 0 });
        expect(await mod.readJob('abc')).to.deep.equal({ status: 'RUNNING', results: [], total: 0 });
    });
    it('stores brotli-compressed base64, not plain JSON', async () => {
        const { mod, store } = load();
        const value = { x: 1 };
        await mod.writeJob('abc', value);
        expect(store['bulk-edit.abc']).to.not.equal(JSON.stringify(value));
        expect(mod.decodeStateValue(store['bulk-edit.abc'])).to.deep.equal(value);
    });
    it('round-trips a realistic job with results', async () => {
        const { mod } = load();
        await mod.writeJob('job-1', sampleJob);
        expect(await mod.readJob('job-1')).to.deep.equal(sampleJob);
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
    it('uses JOB_CACHE_TTL for user CSV writes', async () => {
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
        expect(puts[0].opts.ttl).to.equal(mod.JOB_CACHE_TTL);
    });
    it('deleteUserCsv removes the stored upload', async () => {
        const { mod, store } = load();
        await mod.writeUserCsv('abc', { rows: [{ fragment_id: 'f1' }] });
        await mod.deleteUserCsv('abc');
        expect(store['bulk-edit.abc.csv']).to.equal(undefined);
        expect(await mod.readUserCsv('abc')).to.equal(null);
    });
});

describe('bulk-edit/state: report', () => {
    it('keys the report as bulk-edit.{jobId}.report and stores plain JSON', async () => {
        const { mod, store } = load();
        const report = { dryRun: true, totalFragments: 3, failed: 0 };
        await mod.writeReport('abc', report);
        expect(store['bulk-edit.abc.report']).to.equal(JSON.stringify(report));
        expect(await mod.readReport('abc')).to.deep.equal(report);
    });
    it('returns null for an unknown report', async () => {
        const { mod } = load();
        expect(await mod.readReport('missing')).to.equal(null);
    });
});

describe('bulk-edit/state: results', () => {
    it('keys results as bulk-edit.{jobId}.results and stores brotli', async () => {
        const { mod, store } = load();
        const items = [{ id: 'f1', matches: [{ field: 'subtitle', value: 'x' }] }];
        await mod.writeResults('abc', items);
        expect(store['bulk-edit.abc.results']).to.not.equal(JSON.stringify(items));
        expect(await mod.readResults('abc')).to.deep.equal(items);
    });
    it('uses JOB_CACHE_TTL for terminal patchJob', async () => {
        const puts = [];
        const fakeState = {
            put: async (key, value, opts) => {
                puts.push({ key, value, opts });
            },
            get: async () => ({ value: mod.encodeStateValue({ status: 'RUNNING' }) }),
            delete: async () => {},
        };
        const mod = proxyquire('../../src/bulk-edit/state.js', {
            '@adobe/aio-lib-state': { init: async () => fakeState, '@noCallThru': true },
        });
        await mod.patchJob('abc', { status: 'DONE' }, mod.JOB_CACHE_TTL);
        expect(puts[puts.length - 1].opts.ttl).to.equal(mod.JOB_CACHE_TTL);
    });
});

describe('bulk-edit/state: dry-run list', () => {
    it('keys the list as bulk-edit.{jobId}.dry-run and stores brotli, not plain JSON', async () => {
        const { mod, store } = load();
        const list = [{ id: 'f1', status: 'WOULD_REPLACE', matches: [{ field: 'subtitle', value: 'x' }] }];
        await mod.writeDryRun('abc', list);
        expect(store['bulk-edit.abc.dry-run']).to.not.equal(JSON.stringify(list));
        expect(mod.decodeStateValue(store['bulk-edit.abc.dry-run'])).to.deep.equal(list);
        expect(await mod.readDryRun('abc')).to.deep.equal(list);
    });
    it('returns null for an unknown dry-run list', async () => {
        const { mod } = load();
        expect(await mod.readDryRun('missing')).to.equal(null);
    });
});

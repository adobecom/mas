const { expect } = require('chai');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const { toEpochHour, PAGE_RETENTION_HOURS } = require('../../src/fragment-usage/pages');

const FRAGMENT = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';
const PAGE = 'https://www.adobe.com/express/';

/** Builds a stored page entry in the shape the rollup writes. */
const entry = (requests, countries = {}) => ({ requests, countries });

/**
 * Loads the rollup with Grafana and State stubbed, backing State with a plain object so a run can
 * be replayed against the records the previous run wrote.
 */
function loadRollup({ pagesByFragment = {}, store = {}, pagesError = null } = {}) {
    const fetchHourlyPages = pagesError ? sinon.stub().rejects(pagesError) : sinon.stub().resolves(pagesByFragment);
    const readUsage = sinon.stub().callsFake(async (fragmentId) => store[fragmentId] || null);
    const writeUsage = sinon.stub().callsFake(async (fragmentId, record) => {
        store[fragmentId] = record;
        return record;
    });

    const rollup = proxyquire('../../src/fragment-usage/rollup', {
        '@adobe/aio-sdk': { Core: { Logger: () => ({ info() {}, warn() {}, error() {} }) } },
        '@adobe/aio-lib-state': { init: async () => ({}) },
        './grafana': { fetchHourlyPages },
        './state': {
            readUsage,
            writeUsage,
            emptyRecord: () => ({ version: 1, updatedAt: null, pages: {} }),
        },
    });

    return { rollup, store, fetchHourlyPages, readUsage, writeUsage };
}

describe('fragment-usage rollup', () => {
    it('refuses to run without the Grafana service token', async () => {
        const { rollup, fetchHourlyPages } = loadRollup();
        const response = await rollup.main({});
        expect(response.statusCode).to.equal(503);
        expect(fetchHourlyPages).to.not.have.been.called;
    });

    it('stores the consuming pages it fetched', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const { rollup, store } = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [hour]: { [PAGE]: entry(42, { US: 42 }) } } },
        });

        await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT].pages[hour]).to.deep.equal({ [PAGE]: entry(42, { US: 42 }) });
    });

    it('is idempotent: replaying the same window does not double count', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const pagesByFragment = { [FRAGMENT]: { [hour]: { [PAGE]: entry(42, { US: 42 }) } } };
        const store = {};

        const first = loadRollup({ pagesByFragment, store });
        await first.rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        const second = loadRollup({ pagesByFragment, store });
        await second.rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT].pages[hour][PAGE]).to.deep.equal(entry(42, { US: 42 }));
    });

    it('corrects an hour whose earlier counts were still incomplete', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const store = {};

        const partial = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [hour]: { [PAGE]: entry(10, { US: 10 }) } } },
            store,
        });
        await partial.rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        const settled = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [hour]: { [PAGE]: entry(90, { US: 90 }) } } },
            store,
        });
        await settled.rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT].pages[hour][PAGE]).to.deep.equal(entry(90, { US: 90 }));
    });

    it('keeps hours recorded by earlier runs', async () => {
        const nowHour = toEpochHour(Date.now());
        const store = {
            [FRAGMENT]: { version: 1, updatedAt: 'earlier', pages: { [nowHour - 5]: { [PAGE]: entry(7) } } },
        };
        const { rollup } = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [nowHour - 1]: { 'https://b.com': entry(3) } } },
            store,
        });

        await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT].pages[nowHour - 5]).to.deep.equal({ [PAGE]: entry(7) });
        expect(store[FRAGMENT].pages[nowHour - 1]).to.deep.equal({ 'https://b.com': entry(3) });
    });

    it('drops hours that have aged past the retention window', async () => {
        const nowHour = toEpochHour(Date.now());
        const stale = nowHour - PAGE_RETENTION_HOURS - 1;
        const store = {
            [FRAGMENT]: { version: 1, updatedAt: 'earlier', pages: { [stale]: { [PAGE]: entry(99) } } },
        };
        const { rollup } = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [nowHour - 1]: { [PAGE]: entry(3) } } },
            store,
        });

        await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT].pages).to.not.have.property(String(stale));
    });

    it('drops the hourly count map left by records written for the traffic panel', async () => {
        // Those records are still inside the retention window. Spreading the stored record would
        // copy the map forward on every run instead of letting it age out.
        const nowHour = toEpochHour(Date.now());
        const store = {
            [FRAGMENT]: { version: 1, updatedAt: 'earlier', hours: { [nowHour - 2]: 500 }, pages: {} },
        };
        const { rollup } = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [nowHour - 1]: { [PAGE]: entry(3) } } },
            store,
        });

        await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT]).to.not.have.property('hours');
    });

    it('re-reads more than one hour so a missed run repairs itself', async () => {
        expect(rollupLookback()).to.be.at.least(2);
    });

    it('returns only a summary, never the per-fragment grid', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const pagesByFragment = {};
        for (let index = 0; index < 500; index += 1) {
            pagesByFragment[`fragment-${index}`] = { [hour]: { [PAGE]: entry(index) } };
        }
        const { rollup } = loadRollup({ pagesByFragment });

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(response.body.fragments).to.equal(500);
        expect(response.body).to.not.have.property('pagesByFragment');
        expect(JSON.stringify(response.body).length).to.be.below(1000);
    });

    it('never echoes the service token', async () => {
        const { rollup } = loadRollup();
        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_secret' });
        expect(JSON.stringify(response)).to.not.contain('glsa_secret');
    });

    it('returns 500 rather than throwing when Grafana is unreachable', async () => {
        const { rollup } = loadRollup({ pagesError: new Error('grafana down') });
        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });
        expect(response.statusCode).to.equal(500);
    });
});

function rollupLookback() {
    return loadRollup().rollup.LOOKBACK_HOURS;
}

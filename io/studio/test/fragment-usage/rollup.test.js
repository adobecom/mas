const { expect } = require('chai');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const { toEpochHour, PAGE_RETENTION_HOURS, HOUR_MS } = require('../../src/fragment-usage/pages');

const FRAGMENT = '5c6e5bdb-161b-4d8d-a3c7-3ea3f843cfb4';
const OTHER_FRAGMENT = '9a1f7c2e-3b4d-4e5f-8a6b-7c8d9e0f1a2b';
const PAGE = 'https://www.adobe.com/express/';

/** Builds a stored page entry in the shape the rollup writes. */
const entry = (requests, countries = {}) => ({ requests, countries });

/**
 * Loads the rollup with Grafana and State stubbed, backing State with a plain object so a run can
 * be replayed against the records the previous run wrote.
 */
function loadRollup({ pagesByFragment = {}, store = {}, pagesError = null } = {}) {
    const logger = { info: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
    const fetchHourlyPages = pagesError ? sinon.stub().rejects(pagesError) : sinon.stub().resolves(pagesByFragment);
    const readUsage = sinon.stub().callsFake(async (fragmentId) => store[fragmentId] || null);
    const writeUsage = sinon.stub().callsFake(async (fragmentId, record) => {
        store[fragmentId] = record;
        return record;
    });

    const rollup = proxyquire('../../src/fragment-usage/rollup', {
        '@adobe/aio-sdk': { Core: { Logger: () => logger } },
        '@adobe/aio-lib-state': { init: async () => ({}) },
        './grafana': { fetchHourlyPages },
        './state': {
            readUsage,
            writeUsage,
            emptyRecord: () => ({ version: 1, updatedAt: null, pages: {} }),
        },
    });

    return { rollup, store, fetchHourlyPages, readUsage, writeUsage, logger };
}

describe('fragment-usage rollup', () => {
    afterEach(() => sinon.restore());

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

    it('starts its window on an hour boundary so the oldest hour it rewrites is complete', async () => {
        // Stored hours are replaced whole. A window starting mid-hour would overwrite a complete
        // hour with only its tail, and every hour is last written by the run that sees its tail.
        const { rollup, fetchHourlyPages } = loadRollup();

        await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        const [fromMs, toMs] = fetchHourlyPages.firstCall.args;
        expect(fromMs % HOUR_MS).to.equal(0);
        expect(toMs - fromMs).to.be.at.least(rollup.LOOKBACK_HOURS * HOUR_MS);
    });

    it('keeps going when one fragment cannot be stored', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const { rollup, store, writeUsage } = loadRollup({
            pagesByFragment: {
                [FRAGMENT]: { [hour]: { [PAGE]: entry(1) } },
                [OTHER_FRAGMENT]: { [hour]: { [PAGE]: entry(2) } },
            },
        });
        writeUsage.withArgs(FRAGMENT).rejects(new Error('state write failed'));

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(response.statusCode).to.equal(200);
        expect(store[OTHER_FRAGMENT].pages[hour]).to.deep.equal({ [PAGE]: entry(2) });
    });

    it('counts the fragments it could not store in the summary', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const { rollup, readUsage } = loadRollup({
            pagesByFragment: {
                [FRAGMENT]: { [hour]: { [PAGE]: entry(1) } },
                [OTHER_FRAGMENT]: { [hour]: { [PAGE]: entry(2) } },
            },
        });
        readUsage.withArgs(FRAGMENT).rejects(new Error('state read failed'));

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(response.body.fragments).to.equal(1);
        expect(response.body.failures).to.equal(1);
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

    it('bounds storage attempts and reports fragments left unprocessed', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const pagesByFragment = {};
        for (let index = 0; index < 2001; index += 1) {
            const id = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
            pagesByFragment[id] = { [hour]: { [PAGE]: entry(1) } };
        }
        const { rollup, store, logger } = loadRollup({ pagesByFragment });

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(Object.keys(store)).to.have.length(2000);
        expect(store).to.not.have.property('00000000-0000-4000-8000-000000002000');
        expect(response.body.skipped).to.equal(1);
        expect(logger.warn).to.have.been.calledOnce;
    });

    it('counts failed storage attempts towards the workload bound', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const pagesByFragment = {};
        for (let index = 0; index < 2001; index += 1) {
            const id = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
            pagesByFragment[id] = { [hour]: { [PAGE]: entry(1) } };
        }
        const { rollup, readUsage } = loadRollup({ pagesByFragment });
        readUsage.rejects(new Error('state read failed'));

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(response.body.failures).to.equal(2000);
        expect(response.body.skipped).to.equal(1);
        expect(readUsage.callCount).to.equal(2000);
    });

    it('stops starting new fragments when the run reaches its time budget', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        const hour = toEpochHour(Date.now()) - 1;
        const { rollup, store, writeUsage } = loadRollup({
            pagesByFragment: {
                [FRAGMENT]: { [hour]: { [PAGE]: entry(1) } },
                [OTHER_FRAGMENT]: { [hour]: { [PAGE]: entry(2) } },
            },
        });
        writeUsage.callsFake(async (fragmentId, record) => {
            store[fragmentId] = record;
            clock.tick(240000);
            return record;
        });

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store[FRAGMENT].pages[hour]).to.deep.equal({ [PAGE]: entry(1) });
        expect(store).to.not.have.property(OTHER_FRAGMENT);
        expect(response.body.skipped).to.equal(1);
        expect(response.body.durationMs).to.equal(240000);
    });

    it('includes Grafana query time in the run budget', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        const hour = toEpochHour(Date.now()) - 1;
        const pagesByFragment = { [FRAGMENT]: { [hour]: { [PAGE]: entry(1) } } };
        const { rollup, store, fetchHourlyPages } = loadRollup({ pagesByFragment });
        fetchHourlyPages.callsFake(async () => {
            clock.tick(240000);
            return pagesByFragment;
        });

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(store).to.deep.equal({});
        expect(response.body.skipped).to.equal(1);
    });

    it('reports no skipped fragments when all updates fit within the bounds', async () => {
        const hour = toEpochHour(Date.now()) - 1;
        const { rollup } = loadRollup({
            pagesByFragment: { [FRAGMENT]: { [hour]: { [PAGE]: entry(1) } } },
        });

        const response = await rollup.main({ GRAFANA_SERVICE_TOKEN: 'glsa_test' });

        expect(response.body.skipped).to.equal(0);
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

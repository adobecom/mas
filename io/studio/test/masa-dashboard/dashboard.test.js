const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fixture = require('../../../../studio/test/masa-dashboard/snapshot.json');
const { validSnapshot, CACHE_KEY, SNAPSHOT_TTL_SECONDS } = require('../../src/masa-dashboard/snapshot.js');

const SECRET = 'dashboard-test-secret';
const NOW = Date.parse(fixture.generatedAt);
const payload = (snapshot = fixture) => ({
    __ow_method: 'post',
    __ow_headers: { authorization: `Bearer ${SECRET}`, 'content-type': 'application/json' },
    __ow_body: Buffer.from(JSON.stringify(snapshot)).toString('base64'),
    MAS_AGENT_DASHBOARD_PUSH_SECRET: SECRET,
});
const caller = { __ow_method: 'get', __ow_headers: { authorization: 'Bearer studio-test-token' } };

describe('MASA dashboard', () => {
    let state;
    let initialize;
    let ingest;
    let read;
    let validate;
    let fetchStub;
    let originalFetch;
    let clock;

    beforeEach(() => {
        clock = sinon.useFakeTimers({ now: NOW, toFake: ['Date'] });
        state = { get: sinon.stub().resolves(undefined), put: sinon.stub().resolves() };
        initialize = sinon.stub().resolves(state);
        ingest = proxyquire('../../src/masa-dashboard/ingest.js', { '@adobe/aio-lib-state': { init: initialize } });
        validate = sinon.stub().resolves(true);
        originalFetch = global.fetch;
        fetchStub = sinon.stub().resolves({ ok: true, json: async () => ({ email: 'Admin@example.com' }) });
        global.fetch = fetchStub;
        read = proxyquire('../../src/masa-dashboard/read.js', {
            '@adobe/aio-lib-state': { init: initialize },
            '../../utils.js': { isAllowed: validate },
        });
        state.get
            .withArgs('mas-users')
            .resolves({ value: JSON.stringify([{ userPrincipalName: 'admin@example.com', groups: ['grp-odin-mas-admins'] }]) });
    });

    afterEach(() => {
        clock.restore();
        sinon.restore();
        global.fetch = originalFetch;
    });

    it('accepts a real publisher fixture and stores only its aggregate contract with expiry', async () => {
        expect(validSnapshot(fixture)).to.equal(true);
        expect((await ingest.main(payload())).statusCode).to.equal(200);
        expect(state.put.firstCall.args).to.deep.equal([CACHE_KEY, JSON.stringify(fixture), { ttl: SNAPSHOT_TTL_SECONDS }]);
    });

    for (const [name, change] of [
        [
            'question text',
            (s) => {
                s.windows[7].question = 'private question';
            },
        ],
        [
            'user identity',
            (s) => {
                s.windows[7].summary.requester = 'private user';
            },
        ],
        [
            'missing window',
            (s) => {
                delete s.windows[30];
            },
        ],
        [
            'mismatched window',
            (s) => {
                s.windows[7].days = 30;
            },
        ],
        [
            'mismatched timestamp',
            (s) => {
                s.windows[7].generatedAt = '2026-10-28T11:59:00.000Z';
            },
        ],
        [
            'invalid count',
            (s) => {
                s.windows[7].summary.questions = -1;
            },
        ],
        [
            'invalid rate',
            (s) => {
                s.windows[7].summary.answeredShare = 1.2;
            },
        ],
        [
            'missing section',
            (s) => {
                delete s.windows[7].queue;
            },
        ],
    ]) {
        it(`rejects ${name} without storing it`, async () => {
            const snapshot = structuredClone(fixture);
            change(snapshot);
            expect((await ingest.main(payload(snapshot))).statusCode).to.equal(400);
            expect(state.put.called).to.equal(false);
        });
    }

    it('rejects invalid JSON, wrong content type and oversized payloads', async () => {
        expect((await ingest.main({ ...payload(), __ow_body: 'broken' })).statusCode).to.equal(400);
        expect(
            (
                await ingest.main({
                    ...payload(),
                    __ow_headers: { authorization: `Bearer ${SECRET}`, 'content-type': 'text/plain' },
                })
            ).statusCode,
        ).to.equal(415);
        expect((await ingest.main({ ...payload(), __ow_body: 'a'.repeat(400000) })).statusCode).to.equal(413);
    });

    it('does not accept missing or wrong secrets, including configuration supplied in the body', async () => {
        expect((await ingest.main({ ...payload(), MAS_AGENT_DASHBOARD_PUSH_SECRET: '' })).statusCode).to.equal(503);
        const forged = payload({ ...fixture, MAS_AGENT_DASHBOARD_PUSH_SECRET: 'attacker' });
        forged.__ow_headers.authorization = 'Bearer attacker';
        expect((await ingest.main(forged)).statusCode).to.equal(401);
        expect((await ingest.main({ ...payload(), __ow_headers: {} })).statusCode).to.equal(401);
        expect(initialize.called).to.equal(false);
    });

    it('rejects snapshots outside the clock allowance and retention period', () => {
        clock.setSystemTime(NOW - 300001);
        expect(validSnapshot(fixture)).to.equal(false);
        clock.setSystemTime(NOW + 86400001);
        expect(validSnapshot(fixture)).to.equal(false);
    });

    it('ignores duplicate and older snapshots without extending retention', async () => {
        state.get.withArgs(CACHE_KEY).resolves({ value: JSON.stringify(fixture) });
        expect((await ingest.main(payload())).body).to.deep.equal({ accepted: false });
        expect(state.put.called).to.equal(false);
    });

    it('returns only dashboard data to a verified MAS admin', async () => {
        state.get.withArgs(CACHE_KEY).resolves({ value: JSON.stringify(fixture) });
        const result = await read.main({ ...caller, email: 'untrusted@example.com', allowedClientId: 'other-client' });
        expect(result.statusCode).to.equal(200);
        expect(result.body.windows).to.deep.equal(fixture.windows);
        expect(validate.firstCall.args).to.deep.equal(['studio-test-token', 'mas-studio']);
        expect(fetchStub.firstCall.args[0]).to.equal('https://ims-na1.adobelogin.com/ims/profile/v1');
        expect(fetchStub.firstCall.args[1].redirect).to.equal('error');
        expect(JSON.stringify(result)).not.to.include('admin@example.com');
        expect(JSON.stringify(result)).not.to.include('studio-test-token');
        expect(result.headers['Cache-Control']).to.equal('no-store');
    });

    it('reports a snapshot older than ten minutes as stale', async () => {
        state.get.withArgs(CACHE_KEY).resolves({ value: JSON.stringify(fixture) });
        clock.setSystemTime(NOW + 600001);
        const result = await read.main(caller);
        expect(result.body.stale).to.equal(true);
        expect(result.body.ageMs).to.equal(600001);
    });

    it('denies missing, invalid or unverifiable tokens before accessing state', async () => {
        expect((await read.main({})).statusCode).to.equal(401);
        validate.resolves(false);
        expect((await read.main(caller)).statusCode).to.equal(401);
        validate.rejects(new Error('secret'));
        expect((await read.main(caller)).statusCode).to.equal(401);
        expect(initialize.called).to.equal(false);
    });

    it('denies non-admins even when the caller supplies an admin email and groups', async () => {
        fetchStub.resolves({ ok: true, json: async () => ({ email: 'editor@example.com' }) });
        const result = await read.main({ ...caller, email: 'admin@example.com', groups: ['GRP-ODIN-MAS-ADMINS'] });
        expect(result.statusCode).to.equal(403);
        expect(state.get.calledWith(CACHE_KEY)).to.equal(false);
    });

    it('denies missing profile identity and unavailable membership', async () => {
        fetchStub.resolves({ ok: true, json: async () => ({}) });
        expect((await read.main(caller)).statusCode).to.equal(403);
        fetchStub.resolves({ ok: true, json: async () => ({ email: 'admin@example.com' }) });
        state.get.withArgs('mas-users').resolves(undefined);
        expect((await read.main(caller)).statusCode).to.equal(503);
        expect(state.get.calledWith(CACHE_KEY)).to.equal(false);
    });

    it('reports missing snapshots only after admin authorization', async () => {
        expect((await read.main(caller)).statusCode).to.equal(404);
    });

    it('contains storage and identity-service failures without leaking errors', async () => {
        state.put.rejects(new Error(SECRET));
        const push = await ingest.main(payload());
        expect(push.statusCode).to.equal(503);
        expect(JSON.stringify(push)).not.to.include(SECRET);
        fetchStub.rejects(new Error('studio-test-token'));
        const result = await read.main(caller);
        expect(result.statusCode).to.equal(502);
        expect(JSON.stringify(result)).not.to.include('studio-test-token');
    });

    it('rejects unsupported methods before making service calls', async () => {
        expect((await ingest.main({ ...payload(), __ow_method: 'get' })).statusCode).to.equal(405);
        expect((await read.main({ ...caller, __ow_method: 'post' })).statusCode).to.equal(405);
        expect(initialize.called).to.equal(false);
        expect(validate.called).to.equal(false);
    });
});

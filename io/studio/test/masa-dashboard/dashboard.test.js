const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fixture = require('../../../../studio/test/masa-dashboard/snapshot.json');
const { validSnapshot, safeRejectionKey, CACHE_KEY, SNAPSHOT_TTL_SECONDS } = require('../../src/masa-dashboard/snapshot.js');

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
            'ignored outcome',
            (s) => {
                s.outcomes.kinds.ignored = 1;
                s.costliest[0].outcome = 'ignored';
            },
        ],
        [
            'repository learning job',
            (s) => {
                s.summary.jobKinds['repo-learn'] = 1;
            },
        ],
        [
            'conversation learning job',
            (s) => {
                s.summary.jobKinds['conversation-learn'] = 1;
            },
        ],
        [
            'unverified page rejection',
            (s) => {
                s.rejections = [{ key: 'page-unverified · browser_inspect', count: 1 }];
            },
        ],
        [
            'documentation intent signal',
            (s) => {
                s.intents.signals.document = 1;
            },
        ],
        [
            'documentation answer',
            (s) => {
                s.outcomes.answerTypes.document = 1;
                s.intents.rows[0].answerTypes.document = 1;
                s.costliest[0].outcome = 'document';
            },
        ],
    ]) {
        it(`accepts the publisher's ${name} aggregate`, async () => {
            const snapshot = structuredClone(fixture);
            change(snapshot.windows[7]);
            expect((await ingest.main(payload(snapshot))).statusCode).to.equal(200);
            expect(JSON.parse(state.put.firstCall.args[1]).windows[7]).to.deep.equal(snapshot.windows[7]);
        });
    }

    it('accepts estimated spending without weakening the legacy snapshot contract', async () => {
        const snapshot = structuredClone(fixture);
        const amounts = { inputUsd: 0.05, outputUsd: 0.94, estimatedUsd: 0.99, pricedCalls: 1, unpricedCalls: 0 };
        snapshot.windows[7].spending = {
            currency: 'USD',
            inputUsdPerMillion: 0.05,
            outputUsdPerMillion: 0.47,
            ...amounts,
            daily: [{ day: '2026-10-28', ...amounts }],
            models: [{ model: 'aifoundry/Qwen/Qwen-latest', ...amounts }],
        };
        expect((await ingest.main(payload(snapshot))).statusCode).to.equal(200);
        expect(JSON.parse(state.put.firstCall.args[1]).windows[7].spending.estimatedUsd).to.equal(0.99);
        for (const window of Object.values(snapshot.windows)) delete window.spending;
        expect(validSnapshot(snapshot)).to.equal(true);
    });

    for (const [name, change] of [
        [
            'private metadata',
            (s) => {
                s.note = 'private question';
            },
        ],
        [
            'non-USD currency',
            (s) => {
                s.currency = 'private-account';
            },
        ],
        [
            'negative amount',
            (s) => {
                s.estimatedUsd = -1;
            },
        ],
        [
            'non-numeric amount',
            (s) => {
                s.inputUsd = 'secret';
            },
        ],
        [
            'invalid call count',
            (s) => {
                s.pricedCalls = 1.5;
            },
        ],
        [
            'excessive rate',
            (s) => {
                s.inputUsdPerMillion = 1000001;
            },
        ],
        [
            'private model name',
            (s) => {
                s.models[0].model = 'private-project';
            },
        ],
        [
            'private date',
            (s) => {
                s.daily[0].day = 'private question';
            },
        ],
        [
            'unexpected nested data',
            (s) => {
                s.models[0].question = 'private question';
            },
        ],
    ]) {
        it(`rejects spending with ${name}`, async () => {
            const snapshot = structuredClone(fixture);
            const amounts = { inputUsd: 0.05, outputUsd: 0.94, estimatedUsd: 0.99, pricedCalls: 1, unpricedCalls: 0 };
            snapshot.windows[7].spending = {
                currency: 'USD',
                inputUsdPerMillion: 0.05,
                outputUsdPerMillion: 0.47,
                ...amounts,
                daily: [{ day: '2026-10-28', ...amounts }],
                models: [{ model: 'unknown', ...amounts }],
            };
            change(snapshot.windows[7].spending);
            expect((await ingest.main(payload(snapshot))).statusCode).to.equal(400);
            expect(state.put.called).to.equal(false);
        });
    }

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

    for (const [name, change] of [
        [
            'Slack identity in a category',
            (s) => {
                s.windows[7].outcomes.kinds = { U0123456789: 1 };
            },
        ],
        [
            'question in a rejection',
            (s) => {
                s.windows[7].rejections = [{ key: 'Please publish my confidential launch · code_read', count: 1 }];
            },
        ],
        [
            'secret in a probe',
            (s) => {
                s.windows[7].probes[0].probe = 'Bearer private-test-secret';
            },
        ],
        [
            'private text in a model label',
            (s) => {
                s.windows[7].model.servedModels = { 'private question text': 1 };
            },
        ],
        [
            'Slack identity in a model label',
            (s) => {
                s.windows[7].model.servedModels = { U0123456789: 1 };
            },
        ],
        [
            'credential-shaped model label',
            (s) => {
                s.windows[7].model.servedModels = { 'xoxb-synthetic-secret': 1 };
            },
        ],
    ]) {
        it(`rejects ${name} before storage`, async () => {
            const snapshot = structuredClone(fixture);
            change(snapshot);
            expect((await ingest.main(payload(snapshot))).statusCode).to.equal(400);
            expect(state.put.called).to.equal(false);
        });
    }

    it('accepts publisher identifiers including Foundry model paths and rejection categories', async () => {
        const snapshot = structuredClone(fixture);
        snapshot.windows[7].model.servedModels = { 'aifoundry/Qwen/Qwen-latest': 1, 'Qwen/Qwen3.8-27B': 2, unknown: 3 };
        snapshot.windows[7].rejections = [{ key: 'invalid-input · code_read', count: 1 }];
        expect((await ingest.main(payload(snapshot))).statusCode).to.equal(200);
    });

    for (const name of ['confidential_project', 'Qwen/Qwen3.8-27B/private-token']) {
        it(`denies unapproved model identifier ${name} before storage`, async () => {
            const snapshot = structuredClone(fixture);
            snapshot.windows[7].model.servedModels = { [name]: 1 };
            expect((await ingest.main(payload(snapshot))).statusCode).to.equal(400);
            expect(state.put.called).to.equal(false);
        });
    }

    it('accepts publisher investigation-control jobs', async () => {
        const snapshot = structuredClone(fixture);
        snapshot.windows[7].summary.jobKinds = { 'investigation-control': 1 };
        expect((await ingest.main(payload(snapshot))).statusCode).to.equal(200);
    });

    for (const [raw, safe] of [
        ['invalid-input · code_read', 'invalid-input · code_read'],
        ['unknown-probe · answer', 'unknown-probe · ?'],
        ['budget-exhausted · private question', 'budget-exhausted · ?'],
        ['job-aborted · U0123456789', 'job-aborted · ?'],
        ['investigation-time-limit · Bearer synthetic-secret', 'investigation-time-limit · ?'],
        ['invalid-input · code_read ·  · private question', 'invalid-input · ?'],
    ]) {
        it(`anonymizes rejection diagnostics for ${raw.split(' · ')[0]}`, () => {
            expect(safeRejectionKey(raw)).to.equal(safe);
        });
    }

    it('accepts and anonymizes unvalidated tool names from early rejection paths', async () => {
        const snapshot = structuredClone(fixture);
        snapshot.windows[7].rejections = [{ key: 'budget-exhausted · private question', count: 2 }];
        expect((await ingest.main(payload(snapshot))).statusCode).to.equal(200);
        const stored = JSON.parse(state.put.firstCall.args[1]);
        expect(stored.windows[7].rejections).to.deep.equal([{ key: 'budget-exhausted · ?', count: 2 }]);
    });

    it('stores unknown tool rejections as one anonymous aggregate', async () => {
        const snapshot = structuredClone(fixture);
        snapshot.windows[7].rejections = [
            { key: 'unknown-probe · answer', count: 1 },
            { key: 'unknown-probe · private question text', count: 2 },
            { key: 'unknown-probe · U0123456789', count: 3 },
        ];
        expect((await ingest.main(payload(snapshot))).statusCode).to.equal(200);
        const stored = JSON.parse(state.put.firstCall.args[1]);
        expect(stored.windows[7].rejections).to.deep.equal([{ key: 'unknown-probe · ?', count: 6 }]);
        expect(JSON.stringify(stored)).not.to.include('private question text');
        expect(JSON.stringify(stored)).not.to.include('U0123456789');
    });

    it('rejects an overflowing anonymous rejection total without writing state', async () => {
        const snapshot = structuredClone(fixture);
        snapshot.windows[7].rejections = [
            { key: 'unknown-probe · ?', count: Number.MAX_SAFE_INTEGER },
            { key: 'unknown-probe · ?', count: 1 },
        ];
        expect((await ingest.main(payload(snapshot))).statusCode).to.equal(400);
        expect(state.put.called).to.equal(false);
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

    for (const [status, expected] of [
        [401, 401],
        [403, 403],
        [500, 502],
    ]) {
        it(`returns ${expected} for IMS profile status ${status} before accessing stored data`, async () => {
            fetchStub.resolves({ ok: false, status });
            state.get.withArgs(CACHE_KEY).resolves({ value: JSON.stringify(fixture) });
            const result = await read.main(caller);
            expect(result.statusCode).to.equal(expected);
            expect(result.body).not.to.have.property('windows');
            expect(initialize.called).to.equal(false);
        });
    }

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

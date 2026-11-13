const { expect } = require('chai');
const sinon = require('sinon');
const { generateReport, REPORT_STATUS, MAX_REPORT_PATHS } = require('../../src/bulk-publish/report.js');

const PROJECT_PUBLISHED_AT = '2026-01-10T10:00:00.000Z';
const ROOT = '/content/dam/mas/acom/en_US';
const INDEX = `${ROOT}/dictionary/index`;

const projectFragment = (paths, extra = {}) => ({
    fragment: {
        fields: [
            { name: 'fragments', values: paths },
            { name: 'locales', values: [] },
            { name: 'publishedAt', values: [PROJECT_PUBLISHED_AT] },
            { name: 'lastResult', values: [JSON.stringify({ total: paths.length, published: paths.length })] },
        ],
        ...extra,
    },
});

const found = (path, status, extra = {}) => ({ state: 'ok', fragment: { id: `id-${path}`, path, status, ...extra } });

const run = (paths, { fragments = {}, entries = null, project = projectFragment(paths).fragment } = {}) => {
    const deps = {
        checkFragment: async (path) => fragments[path] || { state: 'not-found' },
        readPublishedIndexEntries: async () => entries,
        processBatchWithConcurrency: (items, size, processor) => Promise.all(items.map(processor)),
    };
    return generateReport({ projectId: 'p1', project, odinEndpoint: 'https://odin', authToken: 'tok', deps });
};

describe('bulk-publish/report.js', () => {
    it('does not report SUCCESS_TRIGGERED as published without a live check', async () => {
        const path = `${ROOT}/card-a`;
        const report = await run([path], { fragments: { [path]: found(path, 'DRAFT') } });
        expect(report.summary.reportedPublished).to.equal(1);
        expect(report.rows[0].status).to.equal(REPORT_STATUS.NOT_LIVE);
        expect(report.summary.live).to.equal(0);

        const errored = await run([path], { fragments: { [path]: { state: 'error', message: 'boom' } } });
        expect(errored.rows[0].status).to.equal(REPORT_STATUS.FAILED);
    });

    it('flags a dictionary index as failed when its published version or direct-hydrated view lacks the new placeholders', async () => {
        const placeholder = `${ROOT}/dictionary/new-key`;
        const fragments = { [placeholder]: found(placeholder, 'PUBLISHED'), [INDEX]: found(INDEX, 'PUBLISHED') };
        const report = await run([placeholder], { fragments, entries: [`${ROOT}/dictionary/other`] });
        const index = report.rows.find((r) => r.path === INDEX);
        expect(index.status).to.equal(REPORT_STATUS.FAILED);
        expect(index.reason).to.equal('index-lacks-placeholders');

        const ok = await run([placeholder], { fragments, entries: [`id-${placeholder}`] });
        expect(ok.rows.find((r) => r.path === INDEX).status).to.equal(REPORT_STATUS.LIVE);
    });

    it('incident case: 114 items with 21 indexes not live reports 93 live and 21 failed, not 113/114 published', async () => {
        const fragments = {};
        const paths = [];
        for (let i = 0; i < 72; i++) {
            const path = `/content/dam/mas/acom/en_US/card-${i}`;
            paths.push(path);
            fragments[path] = found(path, 'PUBLISHED');
        }
        for (let i = 0; i < 21; i++) {
            const placeholder = `/content/dam/mas/acom/loc${i}/dictionary/key`;
            const index = `/content/dam/mas/acom/loc${i}/dictionary/index`;
            paths.push(placeholder, index);
            fragments[placeholder] = found(placeholder, 'PUBLISHED');
            fragments[index] = found(index, 'PUBLISHED');
        }
        const project = {
            fields: [
                { name: 'fragments', values: paths },
                { name: 'lastResult', values: [JSON.stringify({ total: 114, published: 113 })] },
            ],
        };
        const report = await run(paths, { fragments, entries: [], project });
        expect(report.summary).to.include({ total: 114, live: 93, failed: 21, reportedPublished: 113 });
        expect(report.summary.live).to.not.equal(report.summary.reportedPublished);
    });

    it('lists a placeholder whose placeholder index was never created', async () => {
        const placeholder = `${ROOT}/dictionary/new-key`;
        const report = await run([placeholder], { fragments: { [placeholder]: found(placeholder, 'PUBLISHED') } });
        expect(report.missingIndexes).to.deep.equal([INDEX]);
        const row = report.rows.find((r) => r.path === placeholder);
        expect(row.status).to.equal(REPORT_STATUS.FAILED);
        expect(row.reason).to.equal('placeholder-index-missing');
    });

    it('compares modification date with publish date and project publish date and flags items modified after publishing', async () => {
        const a = `${ROOT}/card-a`;
        const b = `${ROOT}/card-b`;
        const c = `${ROOT}/card-c`;
        const at = (iso) => ({ at: iso });
        const fragments = {
            [a]: found(a, 'MODIFIED', { modified: at('2026-01-12'), published: at('2026-01-11') }),
            [b]: found(b, 'PUBLISHED', { modified: at('2026-01-05'), published: at('2026-01-11') }),
            [c]: found(c, 'MODIFIED', { modified: at('2026-01-12') }),
        };
        const report = await run([a, b, c], { fragments });
        const by = Object.fromEntries(report.rows.map((r) => [r.path, r]));
        expect(by[a].modifiedAfterPublish).to.equal(true);
        expect(by[b].modifiedAfterPublish).to.equal(false);
        expect(by[c].modifiedAfterPublish).to.equal(true);
        expect(by[c].projectPublishedAt).to.equal(PROJECT_PUBLISHED_AT);
    });

    it('summary contains live, failed and not-live counts', async () => {
        const live = `${ROOT}/live`;
        const draft = `${ROOT}/draft`;
        const gone = `${ROOT}/gone`;
        const report = await run([live, draft, gone], {
            fragments: { [live]: found(live, 'PUBLISHED'), [draft]: found(draft, 'DRAFT') },
        });
        expect(report.summary).to.include({ total: 3, live: 1, notLive: 1, failed: 1 });
    });

    it('turns an errored or rate limited check into a failed row', async () => {
        const path = `${ROOT}/card`;
        const report = await run([path], { fragments: { [path]: { state: 'error', message: '429' } } });
        expect(report.rows[0].status).to.equal(REPORT_STATUS.FAILED);
        expect(report.errors).to.deep.equal([{ path, message: '429' }]);
    });

    it('reflects the current state on every run', async () => {
        const path = `${ROOT}/card`;
        const fragments = { [path]: found(path, 'PUBLISHED') };
        const first = await run([path], { fragments });
        fragments[path] = found(path, 'UNPUBLISHED');
        const second = await run([path], { fragments });
        expect(first.rows[0].status).to.equal(REPORT_STATUS.LIVE);
        expect(second.rows[0].status).to.equal(REPORT_STATUS.NOT_LIVE);
    });

    describe('published index reads', () => {
        const placeholder = `${ROOT}/dictionary/key`;
        const card = `${ROOT}/card`;
        const generate = () =>
            generateReport({
                projectId: 'p1',
                project: projectFragment([placeholder, card]).fragment,
                odinEndpoint: 'https://author-p22655-e59471.adobeaemcloud.com',
                authToken: 'test',
                deps: {
                    checkFragment: async (path) => found(path, 'PUBLISHED'),
                    processBatchWithConcurrency: (items, size, processor) => Promise.all(items.map(processor)),
                },
            });

        afterEach(() => sinon.restore());

        it('checks published placeholder UUIDs on the target environment without requiring reference paths', async () => {
            const fetch = sinon.stub(global, 'fetch').resolves({
                ok: true,
                json: async () => ({ fields: { entries: [`id-${placeholder}`] } }),
            });
            const report = await generate();
            expect(fetch.firstCall.args[0]).to.equal(
                `https://publish-p22655-e59471.adobeaemcloud.com/adobe/contentFragments/id-${INDEX}?references=direct-hydrated`,
            );
            expect(report.rows.find((row) => row.path === INDEX).status).to.equal(REPORT_STATUS.LIVE);
        });

        it('fails only the index row when published JSON is malformed', async () => {
            sinon.stub(global, 'fetch').resolves({ ok: true, json: async () => JSON.parse('invalid') });
            const report = await generate();
            expect(report.rows.find((row) => row.path === INDEX).reason).to.equal('published-index-unreadable');
            expect(report.rows.find((row) => row.path === card).status).to.equal(REPORT_STATUS.LIVE);
        });

        it('bounds each published index read with a 10s abort signal', async () => {
            const timeout = sinon.spy(AbortSignal, 'timeout');
            const fetch = sinon.stub(global, 'fetch').resolves({ ok: true, json: async () => ({ fields: { entries: [] } }) });
            await generate();
            expect(timeout.calledWith(10000)).to.equal(true);
            expect(fetch.firstCall.args[1].signal).to.equal(timeout.firstCall.returnValue);
        });

        it('fails only the index row when its published read is aborted', async () => {
            sinon.stub(global, 'fetch').rejects(new DOMException('timed out', 'TimeoutError'));
            const report = await generate();
            expect(report.rows.find((row) => row.path === INDEX).reason).to.equal('published-index-unreadable');
            expect(report.rows.find((row) => row.path === card).status).to.equal(REPORT_STATUS.LIVE);
        });
    });

    it('rejects a project larger than the report limit with a 413 before checking AEM', async () => {
        const paths = Array.from({ length: MAX_REPORT_PATHS + 1 }, (value, i) => `${ROOT}/card-${i}`);
        const check = sinon.stub();
        const error = await generateReport({
            projectId: 'p1',
            project: projectFragment(paths).fragment,
            odinEndpoint: 'https://odin',
            authToken: 'tok',
            deps: { checkFragment: check },
        }).catch((err) => err);
        expect(error.statusCode).to.equal(413);
        expect(error.message).to.include(String(MAX_REPORT_PATHS));
        expect(check.called).to.equal(false);
    });
});

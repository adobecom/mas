const { expect } = require('chai');
const sinon = require('sinon');
const { main } = require('../../src/bulk-publish/bulk-publish-worker.js');

describe('bulk-publish — reference publishing pipeline contract', () => {
    const odinEndpoint = 'https://odin.example';
    const publishUrl = `${odinEndpoint}/adobe/sites/cf/fragments/publish`;
    const basePath = '/content/dam/mas/acom/en_US/collection';
    const cardPath = '/content/dam/mas/acom/en_US/card';
    const variationPath = '/content/dam/mas/acom/en_US/card-promo';
    let deps, fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(global, 'fetch');
        fetchStub.withArgs(publishUrl).callsFake(async (url, options) => {
            const { paths } = JSON.parse(options.body);
            return new Response(JSON.stringify({ items: paths.map((path) => ({ path, status: 'SUCCESS_TRIGGERED' })) }), {
                status: 200,
            });
        });
        deps = {
            readProjectFragment: sinon.stub().resolves({
                fragment: {
                    fields: [
                        { name: 'title', values: ['Project'] },
                        { name: 'fragments', values: [basePath] },
                        { name: 'locales', values: [] },
                        { name: 'snapshots', values: [] },
                    ],
                },
            }),
            updateProjectFragment: sinon.stub().resolves(),
            recordSnapshot: sinon.stub().resolves({ entries: [], failures: [] }),
            createSnapshot: sinon.stub().callsFake(async ({ paths, includeCards, includeVariations }) => {
                const expandedPaths = [
                    ...paths,
                    ...(includeCards ? [cardPath] : []),
                    ...(includeVariations ? [variationPath] : []),
                ];
                return {
                    expandedPaths,
                    entries: expandedPaths.map((path) => JSON.stringify({ fragmentId: path, path, versionId: 'v1' })),
                    failures: [],
                };
            }),
            logger: { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() },
        };
    });

    afterEach(() => sinon.restore());

    for (const publishReferences of [false, true, undefined]) {
        const policy = publishReferences === undefined ? {} : { publishReferences };
        const expectedFilter = publishReferences === false ? [] : ['DRAFT', 'MODIFIED', 'UNPUBLISHED'];

        for (const includeCards of [false, true]) {
            for (const includeVariations of [false, true]) {
                it(`sends the reference filter for publishReferences=${publishReferences}, includeCards=${includeCards}, includeVariations=${includeVariations}`, async () => {
                    const expectedPaths = [
                        basePath,
                        ...(includeCards ? [cardPath] : []),
                        ...(includeVariations ? [variationPath] : []),
                    ];

                    const result = await main(
                        { projectId: 'proj-1', odinEndpoint, authToken: 't', includeCards, includeVariations, ...policy },
                        deps,
                    );

                    expect(result.statusCode).to.equal(200);
                    expect(result.body.published).to.equal(expectedPaths.length);
                    expect(fetchStub.callCount).to.equal(1);
                    const body = JSON.parse(fetchStub.firstCall.args[1].body);
                    expect(body.paths).to.deep.equal(expectedPaths);
                    expect(body.filterReferencesByStatus).to.deep.equal(expectedFilter);
                    expect(deps.createSnapshot.firstCall.args[0]).to.include({ includeCards, includeVariations });
                });
            }
        }

        it(`keeps explicit dictionary indexes on replication with publishReferences=${publishReferences}`, async () => {
            const entryPath = '/content/dam/mas/acom/en_US/dictionary/free';
            const indexPath = '/content/dam/mas/acom/en_US/dictionary/index';
            deps.readProjectFragment.resolves({
                fragment: {
                    fields: [
                        { name: 'fragments', values: [entryPath, indexPath] },
                        { name: 'locales', values: [] },
                        { name: 'snapshots', values: [] },
                    ],
                },
            });
            fetchStub
                .withArgs(`${odinEndpoint}/libs/granite/csrf/token.json`)
                .resolves(new Response(JSON.stringify({ token: 'csrf-token' })));
            fetchStub.withArgs(`${odinEndpoint}/bin/replicate`).resolves(new Response(null, { status: 200 }));

            const result = await main({ projectId: 'proj-1', odinEndpoint, authToken: 't', ...policy }, deps);

            expect(result.statusCode).to.equal(200);
            expect(result.body.published).to.equal(2);
            expect(fetchStub.callCount).to.equal(3);
            const body = JSON.parse(fetchStub.firstCall.args[1].body);
            expect(body.paths).to.deep.equal([entryPath]);
            expect(body.filterReferencesByStatus).to.deep.equal(expectedFilter);
            const [url, options] = fetchStub.lastCall.args;
            expect(url).to.equal(`${odinEndpoint}/bin/replicate`);
            expect(options.method).to.equal('POST');
            expect(options.headers['CSRF-Token']).to.equal('csrf-token');
            expect(Object.fromEntries(new URLSearchParams(options.body))).to.deep.equal({ cmd: 'Activate', path: indexPath });
        });
    }
});

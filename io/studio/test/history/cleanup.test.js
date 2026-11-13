const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { Readable } = require('node:stream');
const { resolveScope } = require('../../src/history/components/index.js');

describe('Scheduled history metadata cleanup', () => {
    const scopePath = 'private/history/promotion/11111111-1111-4111-8111-111111111111/';
    const cursorPath = 'private/history-cleanup/cursor.json';
    let main;
    let blobs;
    let container;
    let clients;
    let listing;
    let scopeResolver;
    const activeAt = new Date().toISOString();
    const expiredAt = new Date(Date.now() - 96 * 86400000).toISOString();
    const error = (statusCode) => Object.assign(new Error('Blob failure'), { statusCode });
    const put = (path, value, revision = 1) => blobs.set(path, { value, etag: `"${revision}"` });

    beforeEach(() => {
        blobs = new Map();
        clients = new Map();
        scopeResolver = sinon.stub().callsFake(resolveScope);
        listing = sinon.stub().callsFake(({ continuationToken, maxPageSize }) =>
            (async function* () {
                const names = [...blobs.keys()]
                    .filter((name) => name.startsWith('private/history/') && (!continuationToken || name > continuationToken))
                    .sort();
                const items = names.slice(0, maxPageSize).map((name) => ({ name }));
                yield {
                    segment: { blobItems: items },
                    continuationToken: maxPageSize < names.length ? items.at(-1).name : '',
                };
            })(),
        );
        container = {
            listBlobsFlat: sinon.stub().returns({ byPage: listing }),
            getBlockBlobClient: (name) => {
                if (!clients.has(name)) {
                    const client = {
                        download: sinon.stub().callsFake(async () => {
                            const stored = blobs.get(name);
                            if (!stored) throw error(404);
                            return { etag: stored.etag, readableStreamBody: Readable.from([JSON.stringify(stored.value)]) };
                        }),
                        uploadData: sinon.stub().callsFake(async (bytes, { conditions }) => {
                            const stored = blobs.get(name);
                            if (
                                (conditions.ifNoneMatch && stored) ||
                                (conditions.ifMatch && stored?.etag !== conditions.ifMatch)
                            )
                                throw error(412);
                            put(name, JSON.parse(bytes.toString()), Number(stored?.etag.replaceAll('"', '') ?? 0) + 1);
                        }),
                        delete: sinon.stub().callsFake(async ({ conditions }) => {
                            if (blobs.get(name)?.etag !== conditions.ifMatch) throw error(412);
                            blobs.delete(name);
                        }),
                    };
                    clients.set(name, client);
                }
                return clients.get(name);
            },
        };
        ({ main } = proxyquire('../../src/history/cleanup.js', {
            '@adobe/aio-lib-files': { init: async () => ({ containerClientPrivate: container }) },
            '@adobe/aio-sdk': { Core: { Logger: () => ({ info: sinon.spy(), error: sinon.spy() }) } },
            './components/index.js': { resolveScope: scopeResolver },
        }));
    });

    afterEach(() => sinon.restore());

    it('physically removes expired orphan pages and reservations even for inactive roots while retaining the counter', async () => {
        put(`${scopePath}index-0.json`, { entries: { old: { createdAt: expiredAt } } });
        put(`${scopePath}index.json`, { pages: {} });
        put(`${scopePath}numbering.json`, {
            lastVersion: 301,
            entries: { old: { version: 1, createdAt: expiredAt }, current: { version: 301, createdAt: activeAt } },
        });

        await main();

        expect(blobs.has(`${scopePath}index-0.json`)).to.equal(false);
        expect(blobs.get(`${scopePath}numbering.json`).value).to.deep.equal({
            lastVersion: 301,
            entries: { current: { version: 301, createdAt: activeAt } },
        });
    });

    it('cleans another registered scope without modifying the cleanup infrastructure', async () => {
        const name = `${scopePath.replace('/promotion/', '/collection/')}index-0.json`;
        scopeResolver.withArgs('collection').returns({});
        put(name, { entries: { old: { createdAt: expiredAt } } });
        await main();
        expect(blobs.has(name)).to.equal(false);
        expect(scopeResolver.calledWith('collection')).to.equal(true);
    });

    it('does not read or remove metadata from unregistered scopes or malformed root UUIDs', async () => {
        const names = [
            `${scopePath.replace('/promotion/', '/collection/')}index-0.json`,
            'private/history/promotion/------------------------------------/index-0.json',
        ];
        for (const name of names) put(name, { entries: {} });
        await main();
        for (const name of names) {
            expect(blobs.has(name)).to.equal(true);
            expect(clients.has(name)).to.equal(false);
        }
    });

    it('prunes expired entries without erasing active entries or active manifest ranges', async () => {
        put(`${scopePath}index-0.json`, {
            entries: { old: { createdAt: expiredAt }, active: { createdAt: activeAt } },
        });
        put(`${scopePath}index.json`, {
            pages: { 0: { newest: `${activeAt}|active` }, 1: { newest: `${expiredAt}|old` } },
        });

        await main();

        expect(blobs.get(`${scopePath}index-0.json`).value.entries).to.deep.equal({ active: { createdAt: activeAt } });
        expect(blobs.get(`${scopePath}index.json`).value.pages).to.deep.equal({ 0: { newest: `${activeAt}|active` } });
    });

    it('never deletes a page changed by an active writer after cleanup reads it', async () => {
        const name = `${scopePath}index-0.json`;
        put(name, { entries: { old: { createdAt: expiredAt } } });
        const client = container.getBlockBlobClient(name);
        const original = client.delete;
        client.delete = sinon.stub().callsFake(async (options) => {
            put(name, { entries: { active: { createdAt: activeAt } } }, 2);
            return original(options);
        });

        await main();

        expect(blobs.get(name).value.entries).to.deep.equal({ active: { createdAt: activeAt } });
        expect(client.delete.firstCall.args[0].conditions).to.deep.equal({ ifMatch: '"1"' });
    });

    it('processes multiple pages in one scheduled run when time remains', async () => {
        for (let page = 0; page < 101; page++) put(`${scopePath}index-${page}.json`, { entries: {} });

        const result = await main();

        expect(result).to.deep.equal({ scanned: 101, more: false });
        expect([...blobs.keys()]).to.deep.equal([cursorPath]);
        expect(blobs.get(cursorPath).value.continuationToken).to.equal('');
    });

    it('stops at the time budget and persists continuation for the next run', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        for (let page = 0; page < 51; page++) put(`${scopePath}index-${page}.json`, { entries: {} });
        const names = [...blobs.keys()].sort();
        const client = container.getBlockBlobClient(names[49]);
        const original = client.delete;
        client.delete = sinon.stub().callsFake(async (options) => {
            await original(options);
            clock.tick(240000);
        });

        const result = await main();

        expect(result).to.deep.equal({ scanned: 50, more: true });
        expect(listing.firstCall.args[0].maxPageSize).to.equal(50);
        expect(blobs.get(cursorPath).value.continuationToken).to.equal(names[49]);
        expect(container.listBlobsFlat.firstCall.args[0].prefix).to.equal('private/history/');
        expect(clients.size).to.equal(51);
        await main();
        expect([...blobs.keys()]).to.deep.equal([cursorPath]);
        expect(blobs.get(cursorPath).value.continuationToken).to.equal('');
    });

    it('replays an unfinished page on the next run without skipping its remaining files', async () => {
        const clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
        for (let page = 0; page < 60; page++) put(`${scopePath}index-${page}.json`, { entries: {} });
        const names = [...blobs.keys()].sort();
        const client = container.getBlockBlobClient(names[50]);
        const original = client.delete;
        client.delete = sinon.stub().callsFake(async (options) => {
            await original(options);
            clock.tick(240000);
        });

        const result = await main();

        expect(result).to.deep.equal({ scanned: 54, more: true });
        expect(blobs.get(cursorPath).value.continuationToken).to.equal(names[49]);
        expect(blobs.has(names[54])).to.equal(true);
        expect(await main()).to.deep.equal({ scanned: 6, more: false });
        expect([...blobs.keys()]).to.deep.equal([cursorPath]);
    });

    it('retains concurrent numbering reservations and their increased counter when a cleanup write loses its ETag race', async () => {
        const name = `${scopePath}numbering.json`;
        put(name, { lastVersion: 1, entries: { old: { version: 1, createdAt: expiredAt } } });
        const client = container.getBlockBlobClient(name);
        const original = client.uploadData;
        client.uploadData = sinon.stub().callsFake(async (bytes, options) => {
            put(name, { lastVersion: 2, entries: { active: { version: 2, createdAt: activeAt } } }, 2);
            return original(bytes, options);
        });

        await main();

        expect(blobs.get(name).value).to.deep.equal({
            lastVersion: 2,
            entries: { active: { version: 2, createdAt: activeAt } },
        });
        expect(client.uploadData.firstCall.args[1].conditions).to.deep.equal({ ifMatch: '"1"' });
    });

    it('surfaces storage errors instead of advancing past failed cleanup', async () => {
        const name = `${scopePath}index-0.json`;
        put(name, { entries: {} });
        container.getBlockBlobClient(name).delete.rejects(error(503));
        try {
            await main();
            expect.fail('Expected cleanup failure');
        } catch (failure) {
            expect(failure.statusCode).to.equal(503);
        }
        expect(blobs.has(cursorPath)).to.equal(false);
    });
});

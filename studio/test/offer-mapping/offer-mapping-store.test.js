import { expect } from '@esm-bundle/chai';
import { Fragment } from '../../src/aem/fragment.js';
import { OfferMappingStore, normalizeMappingFragment } from '../../src/offer-mapping/offer-mapping-store.js';

const SURFACE = 'ccd';
const OFFER_MAPPING_PATH = `/content/dam/mas/${SURFACE}/offer-mapping`;
const INDEX_PATH = `${OFFER_MAPPING_PATH}/index`;

const createEntryReference = ({ id, sourceOffer, targetOffer, geos = [], status = 'DRAFT' }) => ({
    id,
    path: `${OFFER_MAPPING_PATH}/${id}`,
    status,
    modified: { by: 'Tester', at: '2026-08-12T00:00:00.000Z' },
    model: { id: 'entry-model' },
    fields: [
        { name: 'sourceoffer', type: 'text', multiple: false, values: [sourceOffer] },
        { name: 'targetoffer', type: 'text', multiple: false, values: [targetOffer] },
        { name: 'geos', type: 'tag', multiple: true, values: geos },
    ],
});

const createHarness = (initialEntries = []) => {
    let references = [...initialEntries];
    let indexEntries = references.map((reference) => reference.path);
    const byId = new Map(references.map((reference) => [reference.id, reference]));
    const calls = { create: [], save: [], delete: [], publish: [], unpublish: [], getWithEtag: [] };

    const indexPayload = () => ({
        id: 'offer-mapping-index',
        path: INDEX_PATH,
        fields: [{ name: 'entries', values: [...indexEntries] }],
        references: references.filter((reference) => indexEntries.includes(reference.path)),
    });

    const aem = {
        wait: async () => {},
        folders: { create: async () => {} },
        sites: {
            cf: {
                fragments: {
                    getByPath: async (path) => {
                        if (path === INDEX_PATH) return indexPayload();
                        const reference = references.find((item) => item.path === path);
                        if (reference) return structuredClone(reference);
                        throw new Error('404');
                    },
                    getById: async (id) => {
                        const fragment = byId.get(id);
                        if (!fragment) throw new Error(`Missing fragment ${id}`);
                        return structuredClone(fragment);
                    },
                    getWithEtag: async (id) => {
                        calls.getWithEtag.push(id);
                        if (id === 'offer-mapping-index') return { ...indexPayload(), etag: 'etag' };
                        return { ...structuredClone(byId.get(id)), etag: 'etag' };
                    },
                    create: async (payload) => {
                        calls.create.push(payload);
                        const created = {
                            id: payload.name,
                            title: payload.title,
                            path: `${payload.parentPath}/${payload.name}`,
                            status: 'DRAFT',
                            modified: { by: 'Tester', at: '2026-08-12T00:00:00.000Z' },
                            model: { id: 'entry-model' },
                            fields: payload.fields,
                        };
                        byId.set(created.id, created);
                        references = [...references, created];
                        return structuredClone(created);
                    },
                    save: async (fragment) => {
                        calls.save.push(fragment);
                        const entriesField = fragment.fields?.find((field) => field.name === 'entries');
                        if (entriesField) {
                            indexEntries = [...entriesField.values];
                            return structuredClone(fragment);
                        }
                        const updated = { ...(byId.get(fragment.id) || {}), ...fragment };
                        byId.set(updated.id, updated);
                        const index = references.findIndex((reference) => reference.id === updated.id);
                        if (index !== -1) references[index] = updated;
                        return structuredClone(updated);
                    },
                    delete: async (fragment) => {
                        calls.delete.push(fragment.id);
                        byId.delete(fragment.id);
                        references = references.filter((reference) => reference.id !== fragment.id);
                        indexEntries = indexEntries.filter((path) => path !== fragment.path);
                    },
                    publish: async (fragment) => {
                        calls.publish.push(fragment.id);
                    },
                    unpublish: async (fragment) => {
                        calls.unpublish.push(fragment.id);
                    },
                },
            },
        },
    };

    return { aem, calls, getIndexEntries: () => [...indexEntries] };
};

const makeStore = (harness) => {
    const store = new OfferMappingStore();
    store.setAem(harness.aem);
    return store;
};

describe('OfferMappingStore', () => {
    it('normalizes an entry fragment into a row record', () => {
        const record = normalizeMappingFragment(
            new Fragment(
                createEntryReference({ id: 'm1', sourceOffer: 'SRC', targetOffer: 'TGT', geos: ['mas:pzn/country/US'] }),
            ),
        );
        expect(record).to.include({ id: 'm1', sourceOffer: 'SRC', targetOffer: 'TGT', status: 'DRAFT' });
        expect(record.geos).to.deep.equal(['mas:pzn/country/US']);
    });

    it('loads a surface index into rows', async () => {
        const harness = createHarness([
            createEntryReference({ id: 'm1', sourceOffer: 'A', targetOffer: 'B', geos: ['mas:pzn/country/US'] }),
        ]);
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const rows = store.rows.get().map((rowStore) => rowStore.get());
        expect(rows).to.have.length(1);
        expect(rows[0]).to.include({ sourceOffer: 'A', targetOffer: 'B' });
    });

    it('shows an empty state without creating anything when the surface has no index', async () => {
        const calls = { getByPath: [], create: [], publish: [] };
        const aem = {
            wait: async () => {},
            folders: { create: async () => calls.create.push('folder') },
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => {
                            calls.getByPath.push(path);
                            throw new Error('404');
                        },
                        create: async () => calls.create.push('fragment'),
                        publish: async () => calls.publish.push('publish'),
                        getWithEtag: async () => ({ id: 'x', etag: 'e' }),
                    },
                },
            },
        };
        const store = new OfferMappingStore();
        store.setAem(aem);
        await store.loadSurface(SURFACE);
        expect(store.rows.get()).to.deep.equal([]);
        expect(store.error.get()).to.equal(null);
        expect(calls.create).to.deep.equal([]);
        expect(calls.publish).to.deep.equal([]);
    });

    it('creates the folder and index before the first entry when none exists', async () => {
        const calls = { folderCreate: [], create: [], publish: [] };
        let indexExists = false;
        let indexEntries = [];
        const entries = [];
        const aem = {
            wait: async () => {},
            folders: { create: async (parent, name) => calls.folderCreate.push(`${parent}/${name}`) },
            sites: {
                cf: {
                    fragments: {
                        getByPath: async (path) => {
                            if (path === INDEX_PATH) {
                                if (!indexExists) throw new Error('404');
                                return {
                                    id: 'offer-mapping-index',
                                    path,
                                    fields: [{ name: 'entries', values: [...indexEntries] }],
                                };
                            }
                            const entry = entries.find((item) => item.path === path);
                            if (entry) return structuredClone(entry);
                            throw new Error('404');
                        },
                        getWithEtag: async (id) => ({ id, etag: 'etag' }),
                        create: async (payload) => {
                            calls.create.push(payload.name);
                            const item = {
                                id: payload.name,
                                path: `${payload.parentPath}/${payload.name}`,
                                status: 'DRAFT',
                                model: { id: 'entry-model' },
                                fields: payload.fields,
                            };
                            if (payload.name === 'index') indexExists = true;
                            else entries.push(item);
                            return structuredClone(item);
                        },
                        save: async (fragment) => {
                            const entriesField = fragment.fields?.find((field) => field.name === 'entries');
                            if (entriesField) indexEntries = [...entriesField.values];
                            return structuredClone(fragment);
                        },
                        publish: async () => calls.publish.push('publish'),
                    },
                },
            },
        };
        const store = new OfferMappingStore();
        store.setAem(aem);
        await store.loadSurface(SURFACE);
        const id = await store.createMapping({ sourceOffer: 'S', targetOffer: 'T', geos: ['mas:pzn/country/US'] });
        expect(id).to.be.a('string');
        expect(calls.folderCreate).to.include(`${OFFER_MAPPING_PATH}`);
        expect(calls.create).to.include('index');
        expect(indexEntries).to.include(`${OFFER_MAPPING_PATH}/${id}`);
    });

    it('creates a mapping and adds it to the index', async () => {
        const harness = createHarness();
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const id = await store.createMapping({ sourceOffer: 'SRC', targetOffer: 'TGT', geos: ['mas:pzn/country/FR'] });
        expect(id).to.be.a('string');
        expect(harness.calls.create).to.have.length(1);
        expect(harness.getIndexEntries()).to.include(`${OFFER_MAPPING_PATH}/${id}`);
        const created = harness.calls.create[0];
        expect(created.fields.find((field) => field.name === 'sourceoffer').values).to.deep.equal(['SRC']);
        expect(created.fields.find((field) => field.name === 'geos').values).to.deep.equal(['mas:pzn/country/FR']);
    });

    it('updates a mapping through upserted fields', async () => {
        const harness = createHarness([createEntryReference({ id: 'm1', sourceOffer: 'A', targetOffer: 'B', geos: [] })]);
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const updated = await store.updateMapping('m1', { sourceOffer: 'A2', targetOffer: 'B2', geos: ['mas:pzn/country/DE'] });
        expect(updated).to.equal(true);
        const saved = harness.calls.save.at(-1);
        expect(saved.fields.find((field) => field.name === 'sourceoffer').values).to.deep.equal(['A2']);
        expect(saved.fields.find((field) => field.name === 'targetoffer').values).to.deep.equal(['B2']);
        expect(saved.fields.find((field) => field.name === 'geos').values).to.deep.equal(['mas:pzn/country/DE']);
    });

    it('removes a mapping from the index and deletes the fragment', async () => {
        const harness = createHarness([createEntryReference({ id: 'm1', sourceOffer: 'A', targetOffer: 'B' })]);
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const removed = await store.removeMapping('m1');
        expect(removed).to.equal(true);
        expect(harness.calls.delete).to.deep.equal(['m1']);
        expect(harness.getIndexEntries()).to.not.include(`${OFFER_MAPPING_PATH}/m1`);
    });

    it('refuses to delete a published mapping', async () => {
        const harness = createHarness([
            createEntryReference({ id: 'm1', sourceOffer: 'A', targetOffer: 'B', status: 'PUBLISHED' }),
        ]);
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const removed = await store.removeMapping('m1');
        expect(removed).to.equal(false);
        expect(harness.calls.delete).to.deep.equal([]);
        expect(harness.getIndexEntries()).to.include(`${OFFER_MAPPING_PATH}/m1`);
    });

    it('publishes a mapping and its index', async () => {
        const harness = createHarness([createEntryReference({ id: 'm1', sourceOffer: 'A', targetOffer: 'B' })]);
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const published = await store.publishMapping('m1');
        expect(published).to.equal(true);
        expect(harness.calls.publish).to.include('m1');
        expect(harness.calls.publish).to.include('offer-mapping-index');
    });

    it('unpublishes a mapping', async () => {
        const harness = createHarness([
            createEntryReference({ id: 'm1', sourceOffer: 'A', targetOffer: 'B', status: 'PUBLISHED' }),
        ]);
        const store = makeStore(harness);
        await store.loadSurface(SURFACE);
        const unpublished = await store.unpublishMapping('m1');
        expect(unpublished).to.equal(true);
        expect(harness.calls.unpublish).to.deep.equal(['m1']);
    });
});

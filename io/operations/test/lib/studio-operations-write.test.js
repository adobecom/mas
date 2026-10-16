import { expect } from 'chai';
import { StudioOperations } from '../../src/lib/studio-operations.js';

function fragment(overrides = {}) {
    return {
        id: 'frag-1',
        path: '/content/dam/mas/sandbox/en_US/frag-1',
        title: 'Card',
        etag: 'etag-1',
        status: 'DRAFT',
        fields: [
            { name: 'variant', values: ['plans'] },
            { name: 'title', values: ['Card'] },
            { name: 'osi', values: [] },
        ],
        model: { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ' },
        ...overrides,
    };
}

function makeOps(aemOverrides = {}) {
    const calls = { createFragment: [], updateFragment: [], applyValidTags: [] };
    const aemClient = {
        createFragment: async (data) => {
            calls.createFragment.push(data);
            return fragment({ id: 'new-1', title: data.title });
        },
        updateFragment: async (id, fields, etag, title) => {
            calls.updateFragment.push({ id, fields, etag, title });
            return fragment({ id, title: title || 'Card' });
        },
        getFragment: async (id) => fragment({ id }),
        applyValidTags: async (id, tags) => {
            calls.applyValidTags.push({ id, tags });
        },
        ...aemOverrides,
    };
    const urlBuilder = { createCardLinks: () => ({ view: 'v', folder: 'f' }) };
    return { ops: new StudioOperations(aemClient, urlBuilder), calls };
}

async function expectReject(promise, msgIncludes) {
    try {
        await promise;
    } catch (e) {
        expect(e.message).to.include(msgIncludes);
        return;
    }
    expect.fail(`expected a rejection including "${msgIncludes}"`);
}

describe('StudioOperations.createCard', () => {
    it('requires a title', async () => {
        await expectReject(makeOps().ops.createCard({ parentPath: '/p' }), 'Card title is required');
    });

    it('requires a parent path', async () => {
        await expectReject(makeOps().ops.createCard({ title: 'T' }), 'Parent path is required');
    });

    it('expands mnemonics into icon/alt/link fields', async () => {
        const { ops, calls } = makeOps();
        await ops.createCard({ title: 'T', parentPath: '/p', fields: { mnemonics: [{ icon: 'i.svg', alt: 'A' }] } });
        const sent = calls.createFragment[0].fields;
        expect(sent.find((f) => f.name === 'mnemonicIcon').values).to.deep.equal(['i.svg']);
        expect(sent.find((f) => f.name === 'mnemonicAlt').values).to.deep.equal(['A']);
        expect(sent.find((f) => f.name === 'mnemonicLink').values).to.deep.equal(['']);
    });

    it('marks known rich fields as long-text and keeps the rest text', async () => {
        const { ops, calls } = makeOps();
        await ops.createCard({
            title: 'T',
            parentPath: '/p',
            variant: 'catalog',
            fields: { description: 'd', badgeColor: 'blue' },
        });
        const sent = calls.createFragment[0].fields;
        expect(sent.find((f) => f.name === 'variant').values).to.deep.equal(['catalog']);
        expect(sent.find((f) => f.name === 'description').type).to.equal('long-text');
        expect(sent.find((f) => f.name === 'badgeColor').type).to.equal('text');
    });

    it('lowercases tags and appends the merch-card content-type tag', async () => {
        const { ops, calls } = makeOps();
        await ops.createCard({ title: 'T', parentPath: '/p', tags: ['mas:Plan_Type/ABM'] });
        expect(calls.applyValidTags[0].tags).to.deep.equal(['mas:plan_type/abm', 'mas:studio/content-type/merch-card']);
    });

    it('returns a create result', async () => {
        const res = await makeOps().ops.createCard({ title: 'T', parentPath: '/p' });
        expect(res.success).to.equal(true);
        expect(res.operation).to.equal('create');
    });
});

describe('StudioOperations.updateCard', () => {
    it('requires an id', async () => {
        await expectReject(makeOps().ops.updateCard({ fields: { osi: 'x' } }), 'Card ID is required');
    });

    it('requires at least one of fields, title, or tags', async () => {
        await expectReject(makeOps().ops.updateCard({ id: 'frag-1' }), 'At least one of');
    });

    it('rejects an unknown card', async () => {
        const { ops } = makeOps({ getFragment: async () => null });
        await expectReject(ops.updateCard({ id: 'missing', title: 'x' }), 'Card not found');
    });

    it("passes the fragment's etag + fields + title to updateFragment and reports the updated fields", async () => {
        const { ops, calls } = makeOps();
        const res = await ops.updateCard({ id: 'frag-1', fields: { osi: 'ABC' }, title: 'New' });
        const u = calls.updateFragment[0];
        expect(u.id).to.equal('frag-1');
        expect(u.etag).to.equal('etag-1');
        expect(u.title).to.equal('New');
        expect(res.operation).to.equal('update');
        expect(res.updatedFields).to.include('title');
        expect(res.updatedFields).to.include('osi');
    });
});

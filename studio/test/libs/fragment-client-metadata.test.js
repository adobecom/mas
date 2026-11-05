import { expect } from '@esm-bundle/chai';
import { clearCaches, DEFAULT_CONTEXT, loadRequestMetadata, saveRequestMetadata } from '../../libs/fragment-client.js';

const context = { ...DEFAULT_CONTEXT, id: 'nala-metadata-test', locale: 'en_US', country: 'US' };
const renderedContext = {
    ...context,
    fragmentsIds: { 'settings-id': 'settings-123' },
    fragmentPath: '/content/dam/mas/nala/en_US/metadata-test',
};

function expireStoredMetadata(requestKey) {
    const stored = JSON.parse(localStorage.getItem(requestKey));
    stored.lastModified = new Date(Date.now() - 6 * 60 * 1000).toUTCString();
    localStorage.setItem(requestKey, JSON.stringify(stored));
}

describe('fragment-client request metadata', () => {
    beforeEach(() => localStorage.clear());
    afterEach(() => localStorage.clear());

    it('restores fragmentsIds saved by a previous render', async () => {
        const first = await loadRequestMetadata(context);
        await saveRequestMetadata(renderedContext, first.requestKey, first.cachedMetadata);
        const second = await loadRequestMetadata(context);
        expect(second.metadataContext.fragmentsIds).to.deep.equal({ 'settings-id': 'settings-123' });
    });

    it('never writes the "[object Object]" key', async () => {
        const { requestKey, cachedMetadata } = await loadRequestMetadata(context);
        await saveRequestMetadata(renderedContext, requestKey, cachedMetadata);
        expect(localStorage.getItem('[object Object]')).to.equal(null);
    });

    it('returns an empty metadata context on a cold cache', async () => {
        const { metadataContext } = await loadRequestMetadata(context);
        expect(metadataContext).to.deep.equal({});
    });

    it('ignores metadata older than five minutes so fragment ids are looked up again', async () => {
        const first = await loadRequestMetadata(context);
        await saveRequestMetadata(renderedContext, first.requestKey, first.cachedMetadata);
        expireStoredMetadata(first.requestKey);
        const second = await loadRequestMetadata(context);
        expect(second.metadataContext).to.deep.equal({});
    });

    it('rewrites expired metadata on the next save', async () => {
        const first = await loadRequestMetadata(context);
        await saveRequestMetadata(renderedContext, first.requestKey, first.cachedMetadata);
        expireStoredMetadata(first.requestKey);
        const expired = await loadRequestMetadata(context);
        await saveRequestMetadata(
            { ...renderedContext, fragmentsIds: { 'settings-id': 'settings-456' } },
            expired.requestKey,
            expired.cachedMetadata,
        );
        const third = await loadRequestMetadata(context);
        expect(third.metadataContext.fragmentsIds).to.deep.equal({ 'settings-id': 'settings-456' });
    });

    it('clearCaches removes cached request metadata', () => {
        localStorage.setItem('req-nala-metadata-test-en_US-US', '{}');
        localStorage.setItem('unrelated-key', 'keep');
        clearCaches();
        expect(localStorage.getItem('req-nala-metadata-test-en_US-US')).to.equal(null);
        expect(localStorage.getItem('unrelated-key')).to.equal('keep');
    });
});

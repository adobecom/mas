import { expect } from '@esm-bundle/chai';
import { DEFAULT_CONTEXT, loadRequestMetadata, saveRequestMetadata } from '../../libs/fragment-client.js';

const context = { ...DEFAULT_CONTEXT, id: 'nala-metadata-test', locale: 'en_US', country: 'US' };
const renderedContext = {
    ...context,
    fragmentsIds: { 'settings-id': 'settings-123' },
    fragmentPath: '/content/dam/mas/nala/en_US/metadata-test',
};

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
});

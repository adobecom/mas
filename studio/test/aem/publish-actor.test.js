import { expect } from '@esm-bundle/chai';
import { AEM } from '../../src/aem/aem.js';

describe('aem.js: publish/unpublish actor attribution', () => {
    const aem = new AEM('test');

    afterEach(() => {
        delete window.fetch;
    });

    it('publishFragment records a version under the caller session before triggering the publish workflow', async () => {
        const calls = [];
        window.fetch = async (url, options) => {
            calls.push({ url, options });
            if (url.includes('/versions')) {
                return { ok: true, headers: { get: () => '/path/to/versions/v-actor' } };
            }
            return { ok: true, json: async () => ({ success: true }) };
        };

        await aem.publishFragment({ id: 'frag-1', path: '/content/dam/frag-1', etag: '"etag-1"' });

        expect(calls).to.have.lengthOf(2);
        expect(calls[0].url).to.include('/cf/fragments/frag-1/versions');
        expect(calls[0].options.method).to.equal('POST');
        expect(calls[1].url).to.equal(aem.cfPublishUrl);

        const publishBody = JSON.parse(calls[1].options.body);
        expect(publishBody).to.deep.equal({
            paths: ['/content/dam/frag-1'],
            filterReferencesByStatus: ['DRAFT', 'MODIFIED', 'UNPUBLISHED'],
            workflowModelId: '/var/workflow/models/scheduled_activation_with_references',
        });
    });

    it('unpublishFragment records a version under the caller session before triggering the unpublish workflow', async () => {
        const calls = [];
        window.fetch = async (url, options) => {
            calls.push({ url, options });
            if (url.includes('/versions')) {
                return { ok: true, headers: { get: () => '/path/to/versions/v-actor' } };
            }
            return { ok: true, json: async () => ({ success: true }) };
        };

        await aem.unpublishFragment({ id: 'frag-1', path: '/content/dam/frag-1', etag: '"etag-1"' });

        expect(calls).to.have.lengthOf(2);
        expect(calls[0].url).to.include('/cf/fragments/frag-1/versions');
        expect(calls[1].url).to.equal(aem.cfPublishUrl);

        const unpublishBody = JSON.parse(calls[1].options.body);
        expect(unpublishBody).to.deep.equal({
            paths: ['/content/dam/frag-1'],
            workflowModelId: '/var/workflow/models/scheduled_deactivation',
        });
    });

    it('still publishes successfully when recording the actor version fails', async () => {
        window.fetch = async (url) => {
            if (url.includes('/versions')) {
                return { ok: false, status: 500, statusText: 'Server Error' };
            }
            return { ok: true, json: async () => ({ success: true }) };
        };

        const result = await aem.publishFragment({ id: 'frag-1', path: '/content/dam/frag-1', etag: '"etag-1"' });

        expect(result).to.deep.equal({ success: true });
    });

    it('still unpublishes successfully when recording the actor version fails', async () => {
        window.fetch = async (url) => {
            if (url.includes('/versions')) {
                return { ok: false, status: 500, statusText: 'Server Error' };
            }
            return { ok: true, json: async () => ({ success: true }) };
        };

        const result = await aem.unpublishFragment({ id: 'frag-1', path: '/content/dam/frag-1', etag: '"etag-1"' });

        expect(result).to.deep.equal({ success: true });
    });
});

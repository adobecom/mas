const { expect } = require('chai');
const { selectRolloutItems } = require('../../src/bulk-publish/bulk-publish-worker.js');

describe('bulk-publish-worker — selectRolloutItems', () => {
    const sourcePaths = ['/content/dam/mas/acom/en_US/card-a', '/content/dam/mas/acom/en_US/card-b'];

    it('selects only not-found failures whose locale is user-selected', () => {
        const details = [
            { path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/de_DE/card-a', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/es_MX/card-b', status: 'published' },
        ];
        const items = selectRolloutItems({ details, sourcePaths, locales: ['es_MX', 'fr_CA'] });

        expect(items).to.deep.equal([{ contentPath: '/content/dam/mas/acom/en_US/card-a', targetLocales: ['es_MX'] }]);
    });

    it('accumulates multiple selected target locales under one source', () => {
        const details = [
            { path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'not-found' },
            { path: '/content/dam/mas/acom/fr_CA/card-a', status: 'failed', reason: 'not-found' },
        ];
        const items = selectRolloutItems({ details, sourcePaths, locales: ['es_MX', 'fr_CA'] });
        expect(items).to.deep.equal([{ contentPath: '/content/dam/mas/acom/en_US/card-a', targetLocales: ['es_MX', 'fr_CA'] }]);
    });

    it('returns empty when no locales were selected', () => {
        const details = [{ path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'not-found' }];
        expect(selectRolloutItems({ details, sourcePaths, locales: [] })).to.deep.equal([]);
    });

    it('ignores non-not-found failures', () => {
        const details = [{ path: '/content/dam/mas/acom/es_MX/card-a', status: 'failed', reason: 'error-forbidden' }];
        expect(selectRolloutItems({ details, sourcePaths, locales: ['es_MX'] })).to.deep.equal([]);
    });
});

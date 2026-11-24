import { expect } from 'chai';
import { StudioOperations } from '../../src/lib/studio-operations.js';

function makeOps(searchFragments) {
    const aemClient = {
        getFragment: async () => null,
        searchFragments,
        getFragmentByPath: async () => ({ items: [] }),
    };
    const urlBuilder = { createFolderLink: (s) => `#path=/content/dam/mas/${s}` };
    return new StudioOperations(aemClient, urlBuilder);
}

describe('StudioOperations.searchCards path scoping', () => {
    it('scopes the AEM query to a relative subfolder under the surface', async () => {
        let calledPath;
        const ops = makeOps(async ({ path }) => {
            calledPath = path;
            return [];
        });
        await ops.searchCards({ surface: 'sandbox', locale: 'en_US', query: 'x', path: 'promotions/summer-sale' });
        expect(calledPath).to.equal('/content/dam/mas/sandbox/en_US/promotions/summer-sale');
    });

    it('searches the surface root when no path is given', async () => {
        let calledPath;
        const ops = makeOps(async ({ path }) => {
            calledPath = path;
            return [];
        });
        await ops.searchCards({ surface: 'sandbox', locale: 'en_US', query: 'x' });
        expect(calledPath).to.equal('/content/dam/mas/sandbox/en_US');
    });

    it('fails gracefully (no throw) when the path tries to escape the surface', async () => {
        const ops = makeOps(async () => []);
        const result = await ops.searchCards({ surface: 'sandbox', locale: 'en_US', query: 'x', path: '../acom' });
        expect(result.success).to.equal(false);
        expect(result.error).to.equal('INVALID_PATH');
    });
});

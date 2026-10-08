import { expect } from 'chai';
import { StudioOperations } from '../../src/lib/studio-operations.js';

const makeOps = () => new StudioOperations({ searchFragments: async () => [] }, { createFolderLink: () => '' });
const card = (id, surface) => ({ id, path: `/content/dam/mas/${surface}/en_US/${id}` });

describe('StudioOperations.searchAcrossSurfaces', () => {
    it('fans out to each requested surface', async () => {
        const ops = makeOps();
        const seen = [];
        ops.searchCards = async ({ surface }) => {
            seen.push(surface);
            return { results: [card(`${surface}-1`, surface)] };
        };
        const res = await ops.searchAcrossSurfaces({ surfaces: ['acom', 'ccd', 'express'], query: 'x', limit: 10 });
        expect(seen).to.have.members(['acom', 'ccd', 'express']);
        expect(res.count).to.equal(3);
    });

    it('dedupes a card that appears under more than one surface scan', async () => {
        const ops = makeOps();
        ops.searchCards = async ({ surface }) =>
            surface === 'acom'
                ? { results: [card('a1', 'acom'), card('shared', 'acom')] }
                : { results: [card('c1', 'ccd'), card('shared', 'acom')] };
        const res = await ops.searchAcrossSurfaces({ surfaces: ['acom', 'ccd'], limit: 10 });
        expect(res.results.map((c) => c.id)).to.have.members(['a1', 'shared', 'c1']);
        expect(res.count).to.equal(3);
    });

    it('caps the merged results to the requested limit', async () => {
        const ops = makeOps();
        ops.searchCards = async ({ surface }) => ({
            results: Array.from({ length: 5 }, (_, i) => card(`${surface}-${i}`, surface)),
        });
        const res = await ops.searchAcrossSurfaces({ surfaces: ['acom', 'ccd'], limit: 6 });
        expect(res.results).to.have.length(6);
    });

    it('keeps results from the other surfaces when one surface scan throws', async () => {
        const ops = makeOps();
        ops.searchCards = async ({ surface }) => {
            if (surface === 'ccd') throw new Error('boom');
            return { results: [card('a1', 'acom')] };
        };
        const res = await ops.searchAcrossSurfaces({ surfaces: ['acom', 'ccd'], limit: 10 });
        expect(res.success).to.equal(true);
        expect(res.results.map((c) => c.id)).to.deep.equal(['a1']);
    });

    it('names the searched surfaces in the message', async () => {
        const ops = makeOps();
        ops.searchCards = async () => ({ results: [] });
        const res = await ops.searchAcrossSurfaces({ surfaces: ['acom', 'ccd'], limit: 10 });
        expect(res.message).to.contain('acom');
        expect(res.message).to.contain('ccd');
    });
});

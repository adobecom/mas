import { expect } from 'chai';
import { StudioOperations } from '../../src/lib/studio-operations.js';

const ops = () => new StudioOperations({ searchFragments: async () => [] }, { createFolderLink: () => '' });

describe('StudioOperations.getSurfacePath', () => {
    it('resolves a known surface to its dam path', () => {
        expect(ops().getSurfacePath('acom', 'en_US')).to.equal('/content/dam/mas/acom/en_US');
        expect(ops().getSurfacePath('sandbox')).to.equal('/content/dam/mas/sandbox/en_US');
    });

    it('resolves any valid surface segment, not only a hardcoded list', () => {
        // acom-cc / acom-dc exist in the frontend SURFACES but were missing from
        // the backend map, so searches on them fell through to the dam root.
        expect(ops().getSurfacePath('acom-cc', 'en_US')).to.equal('/content/dam/mas/acom-cc/en_US');
        expect(ops().getSurfacePath('acom-dc', 'en_US')).to.equal('/content/dam/mas/acom-dc/en_US');
    });

    it('drops the locale segment when locale is "all"', () => {
        expect(ops().getSurfacePath('acom-cc', 'all')).to.equal('/content/dam/mas/acom-cc');
    });

    it('falls back to the dam root for a missing or unsafe surface', () => {
        expect(ops().getSurfacePath(undefined, 'en_US')).to.equal('/content/dam/mas/en_US');
        expect(ops().getSurfacePath('../secret', 'en_US')).to.equal('/content/dam/mas/en_US');
    });
});

import { expect } from '@esm-bundle/chai';
import { getDamPath } from '../../src/aem/aem-fragments.js';

describe('getDamPath', () => {
    it('should return correct path', () => {
        expect(getDamPath('')).to.equal('/content/dam/mas');
        expect(getDamPath('/content/dam/mas')).to.equal('/content/dam/mas');
        expect(getDamPath('ccd')).to.equal('/content/dam/mas/ccd');
    });
});

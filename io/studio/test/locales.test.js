'use strict';

const { expect } = require('chai');
const { DEFAULT_LOCALES } = require('../src/locales.js');

describe('io/studio DEFAULT_LOCALES', () => {
    it('maps genuine, acom-edu, dalp and elements to the ACOM locales', () => {
        for (const surface of ['genuine', 'acom-edu', 'dalp', 'elements']) {
            expect(DEFAULT_LOCALES[surface], surface).to.equal(DEFAULT_LOCALES.acom);
        }
    });
});

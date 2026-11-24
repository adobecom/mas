import { expect } from '@esm-bundle/chai';
import {
    validateTranslationImportFragment,
    TRANSLATION_IMPORT_LOCALE_ERROR,
} from '../../src/translation/mas-translation-editor.js';
import '../../src/swc.js';

describe('validateTranslationImportFragment', () => {
    it('accepts an en_US card fragment', () => {
        const fragment = { path: '/content/dam/mas/sandbox/en_US/test-card' };
        expect(validateTranslationImportFragment(fragment)).to.equal(true);
    });

    it('rejects a non-en_US card fragment with the locale error message', () => {
        const fragment = { path: '/content/dam/mas/sandbox/de_DE/test-card' };
        expect(validateTranslationImportFragment(fragment)).to.equal(TRANSLATION_IMPORT_LOCALE_ERROR);
    });

    it('rejects a non-en_US collection fragment with the locale error message', () => {
        const fragment = { path: '/content/dam/mas/sandbox/fr_FR/collections/test-collection' };
        expect(validateTranslationImportFragment(fragment)).to.equal(TRANSLATION_IMPORT_LOCALE_ERROR);
    });

    it('rejects a path with no resolvable locale segment', () => {
        const fragment = { path: '/content/dam/mas/sandbox/test-card' };
        expect(validateTranslationImportFragment(fragment)).to.equal(TRANSLATION_IMPORT_LOCALE_ERROR);
    });
});

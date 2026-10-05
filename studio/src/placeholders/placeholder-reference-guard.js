import { findPlaceholderReferencesWithTimeout } from './placeholder-references.js';
import { showToast } from '../utils.js';
import './mas-placeholder-references-modal.js';

export const PLACEHOLDER_REFERENCES_MODAL_TAG_NAME = 'mas-placeholder-references-modal';

/**
 * Runs the author-side placeholder reference check and, if needed, shows the reference modal.
 * Resolves `true` only when the user presses Proceed; `mode: 'remove'` never offers Proceed
 * when references are found, so a blocked removal always resolves `false`.
 * @param {{ aem: import('../aem/aem.js').AEM, key: string, surface: string, locale: string,
 *   mode: 'remove'|'publish', excludePath?: string, signal?: AbortSignal }} params
 * @returns {Promise<boolean>}
 */
export async function confirmPlaceholderReferences({ aem, key, surface, locale, mode, excludePath, signal }) {
    let checkResult;
    try {
        checkResult = await findPlaceholderReferencesWithTimeout(aem, { key, surface, locale, excludePath, signal, mode });
    } catch (error) {
        if (error?.name === 'AbortError') return false;
        showToast('Could not check placeholder references.', 'negative');
        return false;
    }

    const { references, allowProceed } = checkResult;
    references.sort((a, b) => a.model.id.localeCompare(b.model.id));
    const modalAllowProceed = mode === 'remove' ? false : allowProceed;
    const { MasPlaceholderReferencesModal } = await import('./mas-placeholder-references-modal.js');
    const result = await MasPlaceholderReferencesModal.show(key, references, modalAllowProceed, mode);
    return result.confirmed;
}

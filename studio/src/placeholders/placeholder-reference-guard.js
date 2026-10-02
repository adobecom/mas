import { findPlaceholderReferences } from './placeholder-references.js';
import { showToast } from '../utils.js';
import './mas-placeholder-references-modal.js';

export const PLACEHOLDER_REFERENCES_MODAL_TAG_NAME = 'mas-placeholder-references-modal';

function getModal() {
    let modal = document.querySelector(PLACEHOLDER_REFERENCES_MODAL_TAG_NAME);
    if (!modal) {
        modal = document.createElement(PLACEHOLDER_REFERENCES_MODAL_TAG_NAME);
        document.body.appendChild(modal);
    }
    return modal;
}

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
        checkResult = await findPlaceholderReferences(aem, { key, surface, locale, excludePath, signal });
    } catch (error) {
        if (error?.name === 'AbortError') return false;
        showToast('Could not check placeholder references.', 'negative');
        return false;
    }

    const { references, allowProceed } = checkResult;
    const modalAllowProceed = mode === 'remove' ? false : allowProceed;

    return new Promise((resolve) => {
        const modal = getModal();

        const cleanup = () => {
            modal.removeEventListener('proceed', onProceed);
            modal.removeEventListener('cancel', onCancel);
            modal.open = false;
        };
        const onProceed = () => {
            cleanup();
            resolve(true);
        };
        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        modal.addEventListener('proceed', onProceed);
        modal.addEventListener('cancel', onCancel);
        modal.mode = mode;
        modal.placeholderKey = key;
        modal.references = references;
        modal.allowProceed = modalAllowProceed;
        modal.open = true;
    });
}

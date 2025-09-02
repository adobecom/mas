/**
 * Helper functions for mnemonic modal tests
 */

export async function detectIconFieldType(editor) {
    // Check which type of icon field is available
    const hasMnemonicField = await editor.mnemonicField.isVisible({ timeout: 1000 }).catch(() => false);

    const hasIconField = await editor.iconURL.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasMnemonicField) {
        return 'mnemonic';
    } else if (hasIconField) {
        return 'icon';
    } else {
        return 'none';
    }
}

export async function handleIconField(fieldType, editor, mnemonicModal, action) {
    switch (fieldType) {
        case 'mnemonic':
            // Use the new mnemonic modal
            if (action === 'open') {
                await mnemonicModal.openModal();
            } else if (action === 'verify') {
                await expect(editor.mnemonicField).toBeVisible();
            }
            break;

        case 'icon':
            // Use the old icon URL field
            if (action === 'edit') {
                // For old field, directly edit the URL
                return editor.iconURL;
            } else if (action === 'verify') {
                await expect(editor.iconURL).toBeVisible();
            }
            break;

        default:
            throw new Error(`No icon field found for this card type`);
    }
}

export async function updateIconForFieldType(fieldType, editor, mnemonicModal, newIconUrl) {
    if (fieldType === 'mnemonic') {
        // Use modal to update
        await mnemonicModal.openModal();
        await mnemonicModal.switchToUrlTab();
        await mnemonicModal.fillUrlForm(newIconUrl, '', '');
        await mnemonicModal.saveModal();
    } else if (fieldType === 'icon') {
        // Direct update
        await editor.iconURL.fill(newIconUrl);
    }
}

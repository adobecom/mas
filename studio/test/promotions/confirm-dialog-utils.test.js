import { expect } from '@esm-bundle/chai';
import { render } from 'lit';
import '../../src/swc.js';
import { showConfirmDialog, renderConfirmDialog } from '../../src/promotions/confirm-dialog-utils.js';

function makeComponent() {
    return {
        isDialogOpen: false,
        dialogCheckboxChecked: false,
        confirmDialogConfig: null,
    };
}

describe('confirm-dialog-utils', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
    });

    it('renders nothing when confirmDialogConfig is null', () => {
        const component = makeComponent();
        render(renderConfirmDialog(component, 'test-dialog'), container);
        expect(container.querySelector('#test-dialog')).to.be.null;
    });

    it('resolves false immediately without rendering when a dialog is already open', async () => {
        const component = makeComponent();
        component.isDialogOpen = true;
        const result = await showConfirmDialog(component, 'Title', 'Message');
        expect(result).to.be.false;
        expect(component.confirmDialogConfig).to.be.null;
    });

    it('resolves { confirmed: false, checked: false } immediately when a dialog is already open and checkboxLabel is set', async () => {
        const component = makeComponent();
        component.isDialogOpen = true;
        const result = await showConfirmDialog(component, 'Title', 'Message', { checkboxLabel: 'Include' });
        expect(result).to.deep.equal({ confirmed: false, checked: false });
    });

    it('resolves a plain true on confirm when no checkboxLabel is provided', async () => {
        const component = makeComponent();
        const resultPromise = showConfirmDialog(component, 'Discard changes?', 'You have unsaved changes.');
        render(renderConfirmDialog(component, 'test-dialog'), container);

        container.querySelector('#test-dialog').dispatchEvent(new CustomEvent('confirm'));

        expect(await resultPromise).to.be.true;
    });

    it('resolves a plain false on cancel when no checkboxLabel is provided', async () => {
        const component = makeComponent();
        const resultPromise = showConfirmDialog(component, 'Discard changes?', 'You have unsaved changes.');
        render(renderConfirmDialog(component, 'test-dialog'), container);

        container.querySelector('#test-dialog').dispatchEvent(new CustomEvent('cancel'));

        expect(await resultPromise).to.be.false;
    });

    it('resolves { confirmed: true, checked: true } when the checkbox is checked before confirming', async () => {
        const component = makeComponent();
        const resultPromise = showConfirmDialog(component, 'Publish variations?', 'This will publish attached variations.', {
            checkboxLabel: 'Publish promo variations',
        });
        render(renderConfirmDialog(component, 'test-dialog'), container);

        const checkbox = container.querySelector('sp-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        container.querySelector('#test-dialog').dispatchEvent(new CustomEvent('confirm'));

        expect(await resultPromise).to.deep.equal({ confirmed: true, checked: true });
    });

    it('resolves { confirmed: true, checked: false } when confirming without checking the checkbox', async () => {
        const component = makeComponent();
        const resultPromise = showConfirmDialog(component, 'Publish variations?', 'This will publish attached variations.', {
            checkboxLabel: 'Publish promo variations',
        });
        render(renderConfirmDialog(component, 'test-dialog'), container);

        container.querySelector('#test-dialog').dispatchEvent(new CustomEvent('confirm'));

        expect(await resultPromise).to.deep.equal({ confirmed: true, checked: false });
    });

    it('resolves { confirmed: false, checked: false } on cancel even when the checkbox is checked', async () => {
        const component = makeComponent();
        const resultPromise = showConfirmDialog(component, 'Publish variations?', 'This will publish attached variations.', {
            checkboxLabel: 'Publish promo variations',
        });
        render(renderConfirmDialog(component, 'test-dialog'), container);

        const checkbox = container.querySelector('sp-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        container.querySelector('#test-dialog').dispatchEvent(new CustomEvent('cancel'));

        expect(await resultPromise).to.deep.equal({ confirmed: false, checked: false });
    });

    it('resets confirmDialogConfig, isDialogOpen and dialogCheckboxChecked after confirm', async () => {
        const component = makeComponent();
        const resultPromise = showConfirmDialog(component, 'Publish variations?', 'This will publish attached variations.', {
            checkboxLabel: 'Publish promo variations',
        });
        render(renderConfirmDialog(component, 'test-dialog'), container);

        const checkbox = container.querySelector('sp-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        container.querySelector('#test-dialog').dispatchEvent(new CustomEvent('confirm'));
        await resultPromise;

        expect(component.confirmDialogConfig).to.be.null;
        expect(component.isDialogOpen).to.be.false;
        expect(component.dialogCheckboxChecked).to.be.false;
    });
});

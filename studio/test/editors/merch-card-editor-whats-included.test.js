import { expect } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/editors/merch-card-editor.js';
import { Fragment } from '../../src/aem/fragment.js';
import generateFragmentStore from '../../src/reactivity/source-fragment-store.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';
import { serializeProWhatsIncluded } from '../../src/utils/pro-whats-included.js';
import '../../../web-components/src/merch-card.js';

const BULLETS = [
    { icon: 'sp-icon-star', alt: 'Plain text', link: '' },
    { icon: 'https://adobe.com/assets/firefly-icon.svg', alt: '<p>Rich <strong>text</strong></p>', link: '' },
    { icon: 'sp-icon-brush', alt: '<p>Third</p>', link: '' },
];

const STANDARD_BULLETS = [
    { icon: 'sp-icon-star', alt: 'Plain text', link: '' },
    { icon: 'https://adobe.com/assets/firefly-icon.svg', alt: 'Rich text', link: '' },
    { icon: 'sp-icon-brush', alt: 'Third', link: '' },
];

const LOGOS = [
    { icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg', alt: 'Photoshop', link: '' },
    { icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg', alt: 'Illustrator', link: '' },
];

const EMPTY_FIELDS = [
    'cardName',
    'osi',
    'cardTitle',
    'subtitle',
    'backgroundImage',
    'backgroundImageAltText',
    'description',
    'prices',
    'ctas',
    'backgroundColor',
];

const RICH_LABEL = '<span is="inline-price" data-wcs-osi="abc"></span> off';

const createEditor = (variant, size, whatsIncluded) => {
    const fragment = new Fragment({
        model: { path: '/conf/mas/settings/dam/cfm/models/card' },
        fields: [
            { name: 'variant', values: [variant] },
            { name: 'size', values: size ? [size] : [] },
            { name: 'whatsIncluded', values: whatsIncluded ? [whatsIncluded] : [] },
            ...EMPTY_FIELDS.map((name) => ({ name, values: [] })),
        ],
        tags: [],
        title: '',
        description: '',
    });
    const editor = new (customElements.get('merch-card-editor'))();
    editor.fragmentStore = generateFragmentStore(fragment);
    document.body.append(editor);
    return editor;
};

const finishRendering = async (editor) => {
    await editor.updateComplete;
    editor.fieldsReady = true;
    await editor.updateComplete;
};

const standardSeed = () => {
    const helper = createEditor(VARIANT_NAMES.PLANS);
    const html = helper.createIncludedElement('Includes:', LOGOS, STANDARD_BULLETS).outerHTML;
    helper.remove();
    return html;
};

const setup = async (variant, size, whatsIncluded) => {
    const editor = createEditor(variant, size, whatsIncluded);
    await finishRendering(editor);
    return editor;
};

const modalOf = (editor) => editor.querySelector('#whatsIncluded mas-whats-included-modal');
const rowsOf = (editor) => [...editor.querySelectorAll('#whatsIncluded .feature-row')];
const storedOf = (editor) => editor.fragmentStore.get().getFieldValue('whatsIncluded');

const confirm = async (editor) => {
    const modal = modalOf(editor);
    await modal.updateComplete;
    await new Promise((resolve) => setTimeout(resolve));
    modal.shadowRoot.querySelector('sp-button[variant="accent"]').click();
    await editor.updateComplete;
};

describe('merch-card-editor whats-included popup', () => {
    afterEach(() => {
        document.querySelectorAll('merch-card-editor').forEach((editor) => editor.remove());
    });

    it('renders one feature row per bullet with icon, bold name and description', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        const rows = rowsOf(editor);
        expect(rows).to.have.lengthOf(3);
        expect(rows.map((row) => row.querySelector('strong').textContent)).to.deep.equal(['Star', 'firefly-icon.svg', 'Brush']);
        expect(rows[0].textContent).to.contain('Plain text');
        expect(rows[1].textContent).to.contain('Rich text');
        rows.forEach((row) => expect(row.querySelector('.feature-row-icon').children.length).to.be.greaterThan(0));
    });

    it('clicking the second row or pressing Enter opens the popup with focusIndex 1', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        rowsOf(editor)[1].click();
        await editor.updateComplete;
        expect(modalOf(editor).open).to.be.true;
        expect(modalOf(editor).focusIndex).to.equal(1);
        expect(modalOf(editor).items).to.have.lengthOf(3);
        modalOf(editor).dispatchEvent(new CustomEvent('modal-close'));
        await editor.updateComplete;
        expect(modalOf(editor).open).to.be.false;
        rowsOf(editor)[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        await editor.updateComplete;
        expect(modalOf(editor).focusIndex).to.equal(2);
    });

    it('Add feature opens the popup with all bullets plus one empty focused item', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        editor.querySelector('#whatsIncluded .add-feature').click();
        await editor.updateComplete;
        const modal = modalOf(editor);
        expect(modal.open).to.be.true;
        expect(modal.items).to.have.lengthOf(4);
        expect(modal.items[3]).to.deep.equal({ icon: '', alt: '', link: '' });
        expect(modal.focusIndex).to.equal(3);
    });

    it('adding the section via Add section opens the popup with one empty item', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', '');
        editor.querySelector('sp-menu-item[value="whatsIncluded"]').click();
        await editor.updateComplete;
        const modal = modalOf(editor);
        expect(modal.open).to.be.true;
        expect(modal.items).to.deep.equal([{ icon: '', alt: '', link: '' }]);
    });

    it('keeps #whatsIncludedLabel as input and rte-field', async () => {
        const standard = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        expect(standard.querySelector('sp-textfield#whatsIncludedLabel')).to.exist;
        const edu = await setup(VARIANT_NAMES.PRO, 'edu', serializeProWhatsIncluded(BULLETS, RICH_LABEL, true));
        expect(edu.querySelector('rte-field#whatsIncludedLabel')).to.exist;
    });

    it('keeps the Add application multifield and the icon picker group', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        expect(editor.querySelector('#whatsIncluded mas-multifield[button-label="Add application"]')).to.exist;
        expect(editor.querySelector('sp-field-group#whatsIncludedIconPicker')).to.exist;
        expect(editor.querySelector('#whatsIncluded mas-multifield[button-label="Add bullet"]')).to.be.null;
    });

    it('Confirm without edits leaves whatsIncluded byte-identical for a standard card', async () => {
        const seed = standardSeed();
        const editor = await setup(VARIANT_NAMES.PLANS, '', seed);
        rowsOf(editor)[0].click();
        await editor.updateComplete;
        await confirm(editor);
        expect(storedOf(editor)).to.equal(seed);
    });

    it('Confirm without edits leaves whatsIncluded byte-identical for a Pro card', async () => {
        const seed = serializeProWhatsIncluded(BULLETS, 'Voir :', false);
        const editor = await setup(VARIANT_NAMES.PRO, '', seed);
        rowsOf(editor)[0].click();
        await editor.updateComplete;
        await confirm(editor);
        expect(storedOf(editor)).to.equal(seed);
    });

    it('Confirm without edits leaves whatsIncluded byte-identical for a Pro edu rich label', async () => {
        const seed = serializeProWhatsIncluded(BULLETS, RICH_LABEL, true);
        const editor = await setup(VARIANT_NAMES.PRO, 'edu', seed);
        rowsOf(editor)[0].click();
        await editor.updateComplete;
        await confirm(editor);
        expect(storedOf(editor)).to.equal(seed);
    });

    it('Confirm after editing one description writes it and leaves logos untouched', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        rowsOf(editor)[0].click();
        await editor.updateComplete;
        const modal = modalOf(editor);
        await modal.updateComplete;
        await new Promise((resolve) => setTimeout(resolve));
        const rte = modal.shadowRoot.querySelector('.item-card rte-field');
        rte.value = '<p>Edited description</p>';
        rte.dispatchEvent(new Event('change'));
        await confirm(editor);
        expect(storedOf(editor)).to.contain('Edited description');
        expect(editor.whatsIncluded.values).to.deep.equal(LOGOS);
        expect(editor.whatsIncluded.bullets[1]).to.deep.equal(STANDARD_BULLETS[1]);
    });
});

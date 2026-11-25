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

const CUSTOM_LOGO = { icon: 'https://example.com/custom-logo.svg', alt: 'Custom', link: 'https://example.com' };

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
const logoRowsOf = (editor) => [...editor.querySelectorAll('#whatsIncluded .logo-row')];
const storedOf = (editor) => editor.fragmentStore.get().getFieldValue('whatsIncluded');

const styleTextOf = (editor) => [...editor.querySelectorAll('style')].map((style) => style.textContent).join('');

const deleteRow = (row) => {
    const menu = row.querySelector('sp-action-menu');
    menu.value = 'delete';
    menu.dispatchEvent(new Event('change', { bubbles: true }));
};

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
        expect(modal.tab).to.equal('icon');
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

    it('one Add feature button and no Add application in the section', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        expect(editor.querySelectorAll('#whatsIncluded .add-feature')).to.have.lengthOf(1);
        expect(editor.querySelector('#whatsIncluded mas-multifield[button-label="Add application"]')).to.be.null;
        expect(editor.querySelector('sp-field-group#whatsIncludedIconPicker')).to.exist;
        expect(editor.querySelector('#whatsIncluded mas-multifield[button-label="Add bullet"]')).to.be.null;
    });

    it('logo rows render after feature rows with 32px image, bold product name and alt text', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        const children = [...editor.querySelector('#whatsIncluded .feature-rows').children];
        expect(children.map((child) => child.className)).to.deep.equal([
            'feature-row',
            'feature-row',
            'feature-row',
            'logo-row',
            'logo-row',
        ]);
        const logoRows = logoRowsOf(editor);
        expect(logoRows.map((row) => row.querySelector('strong').textContent)).to.deep.equal(['Photoshop', 'Illustrator']);
        expect(logoRows[0].querySelector('span').textContent).to.equal('Photoshop');
        const box = logoRows[0].querySelector('.feature-row-icon');
        expect(box.querySelector('img')).to.exist;
        expect(box.getBoundingClientRect().width).to.equal(40);
        expect(box.getBoundingClientRect().height).to.equal(40);
    });

    it('feature and logo rows use the shared image row style', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        const rows = [editor.querySelector('#whatsIncluded .feature-row'), logoRowsOf(editor)[0]];
        for (const row of rows) {
            const style = getComputedStyle(row);
            expect(style.borderTopWidth).to.equal('2px');
            expect(style.borderTopLeftRadius).to.equal('10px');
            expect(style.paddingTop).to.equal('12px');
            expect(style.columnGap).to.equal('8px');
            expect(style.backgroundColor).to.equal('rgb(255, 255, 255)');
            expect(style.cursor).to.equal('pointer');
        }
        const strong = getComputedStyle(rows[0].querySelector('.feature-row-text strong'));
        expect(strong.fontWeight).to.equal('500');
        expect(strong.color).to.equal('rgb(44, 44, 44)');
    });

    it('clicking a logo row (or Enter/Space) opens the dialog on Logo with that logo and index', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        logoRowsOf(editor)[1].click();
        await editor.updateComplete;
        const modal = modalOf(editor);
        expect(modal.open).to.be.true;
        expect(modal.tab).to.equal('logo');
        expect(modal.logo).to.deep.equal(LOGOS[1]);
        expect(modal.logoIndex).to.equal(1);
        modal.dispatchEvent(new CustomEvent('modal-close'));
        await editor.updateComplete;
        for (const key of ['Enter', ' ']) {
            logoRowsOf(editor)[0].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
            await editor.updateComplete;
            expect(modal.tab).to.equal('logo');
            expect(modal.logo).to.deep.equal(LOGOS[0]);
            expect(modal.logoIndex).to.equal(0);
            modal.dispatchEvent(new CustomEvent('modal-close'));
            await editor.updateComplete;
        }
    });

    it('Confirm without edits is byte-identical for a product logo and for a custom-URL logo', async () => {
        const productSeed = standardSeed();
        const productEditor = await setup(VARIANT_NAMES.PLANS, '', productSeed);
        logoRowsOf(productEditor)[0].click();
        await productEditor.updateComplete;
        await confirm(productEditor);
        expect(storedOf(productEditor)).to.equal(productSeed);

        const helper = createEditor(VARIANT_NAMES.PLANS);
        const customSeed = helper.createIncludedElement('Includes:', [CUSTOM_LOGO], STANDARD_BULLETS).outerHTML;
        helper.remove();
        const customEditor = await setup(VARIANT_NAMES.PLANS, '', customSeed);
        logoRowsOf(customEditor)[0].click();
        await customEditor.updateComplete;
        await confirm(customEditor);
        expect(storedOf(customEditor)).to.equal(customSeed);
    });

    it('Delete removes only that logo', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        const menu = logoRowsOf(editor)[0].querySelector('sp-action-menu');
        menu.value = 'delete';
        menu.dispatchEvent(new Event('change', { bubbles: true }));
        await editor.updateComplete;
        expect(editor.whatsIncluded.values).to.deep.equal([LOGOS[1]]);
        expect(editor.whatsIncluded.bullets).to.deep.equal(STANDARD_BULLETS);
        expect(editor.whatsIncluded.label).to.equal('Includes:');
        expect(modalOf(editor).open).to.be.false;
    });

    it('renders the same quiet Delete menu on every feature and logo row', async () => {
        const standard = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        const pro = await setup(VARIANT_NAMES.PRO, '', serializeProWhatsIncluded(BULLETS, 'Voir :', false));
        for (const editor of [standard, pro]) {
            const rows = [...rowsOf(editor), ...logoRowsOf(editor)];
            expect(rows.length).to.be.greaterThan(0);
            for (const row of rows) {
                const menu = row.querySelector('sp-action-menu.action-menu[quiet]');
                expect(menu).to.exist;
                const items = menu.querySelectorAll('sp-menu-item[value="delete"]');
                expect(items).to.have.lengthOf(1);
                expect(items[0].querySelector('sp-icon-delete')).to.exist;
                expect(items[0].textContent.trim()).to.equal('Delete');
            }
        }
        expect(styleTextOf(standard)).to.include('#whatsIncluded .feature-row .action-menu');
        expect(styleTextOf(standard)).to.match(
            /\.feature-row \.action-menu,\s*#whatsIncluded \.logo-row \.action-menu \{\s*margin-left: auto;/,
        );
    });

    it('keeps the dialog closed when using a row menu', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        for (const row of [rowsOf(editor)[0], logoRowsOf(editor)[0]]) {
            const menu = row.querySelector('sp-action-menu');
            menu.click();
            await editor.updateComplete;
            expect(modalOf(editor).open).to.be.false;
            for (const key of ['Enter', ' ']) {
                menu.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
                await editor.updateComplete;
                expect(modalOf(editor).open).to.be.false;
            }
        }
        const menu = rowsOf(editor)[2].querySelector('sp-action-menu');
        menu.value = 'delete';
        menu.dispatchEvent(new Event('change', { bubbles: true }));
        await editor.updateComplete;
        expect(modalOf(editor).open).to.be.false;
    });

    it('Delete removes only that feature on a standard card', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        deleteRow(rowsOf(editor)[1]);
        await editor.updateComplete;
        expect(storedOf(editor)).to.equal(
            editor.createIncludedElement('Includes:', LOGOS, [STANDARD_BULLETS[0], STANDARD_BULLETS[2]]).outerHTML,
        );
    });

    it('Delete removes only that feature on a Pro card', async () => {
        const editor = await setup(VARIANT_NAMES.PRO, '', serializeProWhatsIncluded(BULLETS, 'Voir :', false));
        deleteRow(rowsOf(editor)[1]);
        await editor.updateComplete;
        expect(storedOf(editor)).to.equal(serializeProWhatsIncluded([BULLETS[0], BULLETS[2]], 'Voir :', false));
    });

    it('Delete on the only feature leaves an empty list and keeps label and logos', async () => {
        const helper = createEditor(VARIANT_NAMES.PLANS);
        const seed = helper.createIncludedElement('Includes:', LOGOS, [STANDARD_BULLETS[0]]).outerHTML;
        helper.remove();
        const editor = await setup(VARIANT_NAMES.PLANS, '', seed);
        deleteRow(rowsOf(editor)[0]);
        await editor.updateComplete;
        expect(editor.whatsIncluded.bullets).to.deep.equal([]);
        expect(editor.whatsIncluded.label).to.equal('Includes:');
        expect(editor.whatsIncluded.values).to.deep.equal(LOGOS);
    });

    it('shows No description for empty feature descriptions only', async () => {
        const bullets = [
            { icon: 'sp-icon-star', alt: '', link: '' },
            { icon: 'sp-icon-brush', alt: '<p></p>', link: '' },
            { icon: 'sp-icon-star', alt: '<p>Filled</p>', link: '' },
        ];
        const editor = await setup(VARIANT_NAMES.PRO, '', serializeProWhatsIncluded(bullets, 'Voir :', false));
        const rows = rowsOf(editor);
        expect(rows).to.have.lengthOf(3);
        for (const row of rows.slice(0, 2)) {
            expect(row.querySelector('.feature-row-empty').textContent).to.equal('No description');
        }
        expect(rows[2].querySelector('.feature-row-empty')).to.be.null;
        expect(rows[2].textContent).to.contain('Filled');
        expect(styleTextOf(editor)).to.include('var(--spectrum-gray-700, #505050)');
    });

    it('logo rows show alt text or an empty span, never No description', async () => {
        const helper = createEditor(VARIANT_NAMES.PLANS);
        const logos = [LOGOS[0], { ...LOGOS[1], alt: '' }];
        const seed = helper.createIncludedElement('Includes:', logos, STANDARD_BULLETS).outerHTML;
        helper.remove();
        const editor = await setup(VARIANT_NAMES.PLANS, '', seed);
        const rows = logoRowsOf(editor);
        expect(rows[0].querySelector('span').textContent).to.equal('Photoshop');
        expect(rows[1].querySelector('.feature-row-text span').textContent).to.equal('');
        expect(rows[1].querySelector('.feature-row-empty')).to.be.null;
        expect(rows[1].textContent).to.not.contain('No description');
    });

    it('tab icon writes label and features as before', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        const bullets = [{ icon: 'sp-icon-star', alt: 'Only one', link: '' }];
        modalOf(editor).dispatchEvent(
            new CustomEvent('save', { detail: { tab: 'icon', label: 'New label', items: bullets }, bubbles: true }),
        );
        await editor.updateComplete;
        expect(editor.whatsIncluded.label).to.equal('New label');
        expect(editor.whatsIncluded.bullets).to.deep.equal(bullets);
        expect(editor.whatsIncluded.values).to.deep.equal(LOGOS);
    });

    it('tab logo replaces at index', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        modalOf(editor).dispatchEvent(
            new CustomEvent('save', { detail: { tab: 'logo', index: 0, logo: CUSTOM_LOGO }, bubbles: true }),
        );
        await editor.updateComplete;
        expect(editor.whatsIncluded.values).to.deep.equal([CUSTOM_LOGO, LOGOS[1]]);
    });

    it('tab logo with index -1 appends', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        modalOf(editor).dispatchEvent(
            new CustomEvent('save', { detail: { tab: 'logo', index: -1, logo: CUSTOM_LOGO }, bubbles: true }),
        );
        await editor.updateComplete;
        expect(editor.whatsIncluded.values).to.deep.equal([...LOGOS, CUSTOM_LOGO]);
    });

    it('logo edit leaves features and label untouched', async () => {
        const editor = await setup(VARIANT_NAMES.PLANS, '', standardSeed());
        modalOf(editor).dispatchEvent(
            new CustomEvent('save', { detail: { tab: 'logo', index: 1, logo: CUSTOM_LOGO }, bubbles: true }),
        );
        await editor.updateComplete;
        expect(editor.whatsIncluded.bullets).to.deep.equal(STANDARD_BULLETS);
        expect(editor.whatsIncluded.label).to.equal('Includes:');
    });

    it('Pro has no Logo tab and no logo rows', async () => {
        const editor = await setup(VARIANT_NAMES.PRO, '', serializeProWhatsIncluded(BULLETS, 'Voir :', false));
        const modal = modalOf(editor);
        expect(modal.showLogoTab).to.be.false;
        expect(editor.querySelector('.logo-row')).to.be.null;
        await modal.updateComplete;
        expect(modal.shadowRoot.querySelector('sp-tab[value="logo"]')).to.be.null;
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

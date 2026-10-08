import { errors, test, expect } from '@playwright/test';
import { build } from 'esbuild';
import EditorPage from '../studio/editor.page.js';
import TranslationEditorPage from '../studio/translations/translation-editor.page.js';
import { runAccessibilityTest } from '../libs/accessibility.js';
import { createRunId } from '../utils/fragment-tracker.js';

let spectrum;

test.describe.configure({ mode: 'parallel' });

test.beforeAll(async () => {
    const result = await build({
        stdin: {
            contents: `
                import '@spectrum-web-components/picker/sp-picker.js';
                import '@spectrum-web-components/menu/sp-menu-item.js';
                import '@spectrum-web-components/action-button/sp-action-button.js';
                import '@spectrum-web-components/button/sp-button.js';
                import '@spectrum-web-components/checkbox/sp-checkbox.js';
                import '@spectrum-web-components/overlay/overlay-trigger.js';
                import '@spectrum-web-components/popover/sp-popover.js';
            `,
            resolveDir: process.cwd(),
        },
        bundle: true,
        format: 'iife',
        write: false,
    });
    spectrum = result.outputFiles[0].text;
});

for (const label of ['Default', 'Yellow 300', 'Firefly Spectrum Gradient']) {
    test(`real Spectrum picker selects "${label}" without intermediate values`, async ({ page }) => {
        await page.setContent(`
            <div style="position:fixed;top:0;left:0;height:100px;width:100%;z-index:1000">Top navigation</div>
            <div style="height:600px"></div>
            <sp-picker value="yellow">
                <sp-menu-item value="default">Default</sp-menu-item>
                <sp-menu-item value="disabled" disabled>Unavailable</sp-menu-item>
                <sp-menu-item value="yellow">Yellow 300</sp-menu-item>
                <sp-menu-item value="gradient">Firefly Spectrum Gradient</sp-menu-item>
            </sp-picker>
            <sp-picker><sp-menu-item value="duplicate">${label}</sp-menu-item></sp-picker>
        `);
        await page.addScriptTag({ content: spectrum });
        await page.evaluate(async () => {
            await customElements.whenDefined('sp-picker');
            window.selections = [];
            document.querySelector('sp-picker').addEventListener('change', (event) => {
                window.selections.push(event.target.value);
            });
        });
        const picker = page.locator('sp-picker').first();
        await new EditorPage(page).selectPickerOption(picker, label);
        const selected = { Default: 'default', 'Yellow 300': 'yellow', 'Firefly Spectrum Gradient': 'gradient' }[label];
        const selections = await page.evaluate(() => window.selections);
        expect(selections.length).toBeGreaterThan(0);
        expect([...new Set(selections)]).toEqual([selected]);
        await expect(picker).toHaveJSProperty('value', selected);
        await expect(picker).toHaveJSProperty('open', false);
    });
}

test('RTE fill waits for the model rather than only the editable DOM', async ({ page }) => {
    await page.setContent('<rte-field></rte-field>');
    await page.evaluate(() => {
        const field = document.querySelector('rte-field');
        const root = field.attachShadow({ mode: 'open' });
        root.innerHTML = '<div class="ProseMirror" contenteditable="true">Original</div>';
        field.editorView = { state: { doc: { textContent: 'Original' } } };
        root.querySelector('.ProseMirror').addEventListener('input', (event) => {
            window.inputs = (window.inputs ?? 0) + 1;
            const value = event.target.textContent;
            setTimeout(() => {
                field.editorView.state.doc.textContent = value;
            }, 200);
        });
    });
    await new EditorPage(page).fillRteField(page.locator('rte-field .ProseMirror'), 'Saved edit');
    expect(await page.locator('rte-field').evaluate((field) => field.editorView.state.doc.textContent)).toBe('Saved edit');
    expect(await page.evaluate(() => window.inputs)).toBe(1);
});

for (const inline of [true, false]) {
    test(`RTE clearing empties a real ${inline ? 'inline' : 'multi-paragraph'} ProseMirror document`, async ({ page }) => {
        await page.setContent('<rte-field></rte-field>');
        const result = await build({
            stdin: {
                contents: `
                    import { Schema } from 'prosemirror-model';
                    import { EditorState, TextSelection } from 'prosemirror-state';
                    import { EditorView } from 'prosemirror-view';
                    import { keymap } from 'prosemirror-keymap';
                    import { baseKeymap, deleteSelection } from 'prosemirror-commands';
                    const inline = ${inline};
                    const schema = new Schema({
                        nodes: {
                            doc: { content: inline ? 'inline*' : 'paragraph+' },
                            paragraph: { content: 'inline*', parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0] },
                            text: { group: 'inline' },
                            icon: {
                                group: 'inline', inline: true, atom: true,
                                parseDOM: [{ tag: 'span[data-icon]' }],
                                toDOM: () => ['span', { 'data-icon': '', contenteditable: 'false' }, 'i'],
                            },
                        },
                    });
                    const content = inline
                        ? [schema.text('Save 20%'), schema.node('icon')]
                        : [schema.node('paragraph', null, [schema.text('Save 20%'), schema.node('icon')]),
                           schema.node('paragraph', null, [schema.text('Another offer')])];
                    const doc = schema.node('doc', null, content);
                    const field = document.querySelector('rte-field');
                    const root = field.attachShadow({ mode: 'open' });
                    window.edits = 0;
                    field.editorView = new EditorView(root, {
                        state: EditorState.create({
                            schema, doc,
                            selection: TextSelection.create(doc, inline ? 0 : 1, doc.content.size - (inline ? 0 : 1)),
                            plugins: [keymap({ Delete: deleteSelection, Backspace: deleteSelection }), keymap(baseKeymap)],
                        }),
                        dispatchTransaction(transaction) {
                            if (transaction.docChanged) window.edits++;
                            field.editorView.updateState(field.editorView.state.apply(transaction));
                        },
                    });
                `,
                resolveDir: process.cwd(),
            },
            bundle: true,
            format: 'iife',
            write: false,
        });
        await page.addScriptTag({ content: result.outputFiles[0].text });
        const field = page.locator('rte-field .ProseMirror');
        await new EditorPage(page).clearRteField(field);
        await expect(field).toHaveText('');
        expect(await page.locator('rte-field').evaluate((field) => field.editorView.state.doc.textContent)).toBe('');
        expect(await page.locator('rte-field').evaluate((field) => field.editorView.state.doc.content.size)).toBe(
            inline ? 0 : 2,
        );
        expect(await page.evaluate(() => window.edits)).toBe(1);
    });
}

test('real Spectrum picker recovers from closure before activation', async ({ page }) => {
    await page.setContent(`
                <sp-picker value="default">
                    <sp-menu-item value="default">Default</sp-menu-item>
                    <sp-menu-item value="gray">Gray 300</sp-menu-item>
                </sp-picker>
            `);
    await page.addScriptTag({ content: spectrum });
    await page.evaluate(async () => {
        await customElements.whenDefined('sp-picker');
        const picker = document.querySelector('sp-picker');
        const option = picker.querySelector('[value="gray"]');
        const value = option.value;
        window.closedOnce = false;
        window.selections = [];
        Object.defineProperty(option, 'value', {
            get() {
                if (picker.open && !window.closedOnce) {
                    window.closedOnce = true;
                    picker.open = false;
                }
                return value;
            },
        });
        picker.addEventListener('change', () => window.selections.push(picker.value));
    });
    const picker = page.locator('sp-picker');
    await new EditorPage(page).selectPickerOption(picker, 'Gray 300');
    expect(await page.evaluate(() => window.closedOnce)).toBe(true);
    expect([...new Set(await page.evaluate(() => window.selections))]).toEqual(['gray']);
    await expect(picker).toHaveJSProperty('open', false);
    await expect(picker).toHaveJSProperty('value', 'gray');
});

test('real Spectrum picker selects once and closes its menu', async ({ page }) => {
    await page.setContent(`
        <sp-picker value="default">
            <sp-menu-item value="default">Default</sp-menu-item>
            <sp-menu-item value="gray">Gray 300</sp-menu-item>
        </sp-picker>
    `);
    await page.addScriptTag({ content: spectrum });
    await page.evaluate(async () => {
        await customElements.whenDefined('sp-picker');
        const picker = document.querySelector('sp-picker');
        window.selections = [];
        picker.addEventListener('change', () => {
            window.selections.push(picker.value);
        });
    });
    const picker = page.locator('sp-picker');
    await new EditorPage(page).selectPickerOption(picker, 'Gray 300');
    await expect(picker).toHaveJSProperty('value', 'gray');
    await expect(picker).toHaveJSProperty('open', false);
    expect(await page.evaluate(() => window.selections)).toEqual(['gray']);
});

test('real Spectrum picker waits for the public change after its value and label update', async ({ page }) => {
    await page.setContent(`
        <sp-picker value="default">
            <sp-menu-item value="default">Default</sp-menu-item>
            <sp-menu-item value="gray">Gray 300</sp-menu-item>
        </sp-picker>
    `);
    await page.addScriptTag({ content: spectrum });
    await page.evaluate(async () => {
        await customElements.whenDefined('sp-picker');
        const picker = document.querySelector('sp-picker');
        await picker.updateComplete;
        const getUpdateComplete = picker.getUpdateComplete.bind(picker);
        picker.getUpdateComplete = async () => {
            const complete = await getUpdateComplete();
            await new Promise((resolve) => setTimeout(resolve, 250));
            return complete;
        };
        window.selections = [];
        picker.addEventListener('change', () => window.selections.push(picker.value));
    });
    await new EditorPage(page).selectPickerOption(page.locator('sp-picker'), 'Gray 300');
    expect(await page.evaluate(() => window.selections)).toEqual(['gray']);
});

test('real Spectrum picker recovers from closure while its option is still moving before clicking once', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.setContent(`
        <sp-picker value="default">
            <sp-menu-item value="default">Default</sp-menu-item>
            <sp-menu-item value="gray">Gray 300</sp-menu-item>
        </sp-picker>
    `);
    await page.addScriptTag({ content: spectrum });
    await page.evaluate(async () => {
        await customElements.whenDefined('sp-picker');
        const picker = document.querySelector('sp-picker');
        window.closedOnce = false;
        window.selections = [];
        picker.addEventListener('change', () => window.selections.push(picker.value));
    });
    page.setDefaultTimeout(1500);
    const picker = page.locator('sp-picker');
    const option = picker.getByRole('option', { name: 'Gray 300', exact: true });
    const click = option.click.bind(option);
    option.click = async (options) => {
        await option.evaluate((element) => {
            if (window.closedOnce) return;
            window.closedOnce = true;
            element.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(40px)' }], { duration: 500 });
            setTimeout(() => {
                element.closest('sp-picker').open = false;
            }, 100);
        });
        await click(options);
    };
    picker.getByRole = () => option;
    await new EditorPage(page).selectPickerOption(picker, 'Gray 300');
    expect(await page.evaluate(() => window.closedOnce)).toBe(true);
    expect(await page.evaluate(() => window.selections)).toEqual(['gray']);
    await expect(picker).toHaveJSProperty('open', false);
    await expect(picker).toHaveJSProperty('value', 'gray');
    expect(pageErrors).toEqual([]);
});

for (const observerFails of [false, true]) {
    test(`real Spectrum picker never repeats selection after native pointer input with ${
        observerFails ? 'an unreadable' : 'a readable'
    } activation observer`, async ({ page }) => {
        await page.setContent(`
            <sp-picker value="default">
                <sp-menu-item value="default">Default</sp-menu-item>
                <sp-menu-item value="gray">Gray 300</sp-menu-item>
            </sp-picker>
        `);
        await page.addScriptTag({ content: spectrum });
        await page.evaluate(async () => {
            await customElements.whenDefined('sp-picker');
            window.selections = [];
            document
                .querySelector('sp-picker')
                .addEventListener('change', (event) => window.selections.push(event.target.value));
        });
        const picker = page.locator('sp-picker');
        const option = picker.getByRole('option', { name: 'Gray 300', exact: true });
        const click = option.click.bind(option);
        let clicks = 0;
        option.click = async (options) => {
            clicks++;
            await click(options);
            throw new errors.TimeoutError('Click failed after pointer activation');
        };
        picker.getByRole = () => option;
        if (observerFails) {
            const evaluateHandle = picker.evaluateHandle.bind(picker);
            picker.evaluateHandle = async (...args) => {
                const activation = await evaluateHandle(...args);
                const evaluate = activation.evaluate.bind(activation);
                let reads = 0;
                activation.evaluate = (...args) => {
                    if (++reads === 1) throw new Error('Activation observer is unavailable');
                    return evaluate(...args);
                };
                return activation;
            };
        }
        await expect(new EditorPage(page).selectPickerOption(picker, 'Gray 300')).rejects.toThrow(
            'Click failed after pointer activation',
        );
        expect(clicks).toBe(1);
        expect(await page.evaluate(() => window.selections)).toEqual(['gray']);
    });
}

test('translation search excludes tag-filter searches and other selectors', async ({ page }) => {
    await page.setContent(`
                <mas-items-selector><div class="dialog-header"><sp-search><input type="search"></sp-search></div></mas-items-selector>
                <div id="add-items-overlay">
                    <sp-dialog-wrapper class="add-items-dialog">
                        <mas-items-selector>
                            <div class="dialog-header"><sp-search><input type="search"></sp-search></div>
                            <mas-search-and-filters>
                                <sp-search><input type="search" name="tag-picker-search"></sp-search>
                                <sp-search><input type="search" name="tag-picker-search"></sp-search>
                                <sp-search><input type="search" name="tag-picker-search"></sp-search>
                            </mas-search-and-filters>
                        </mas-items-selector>
                    </sp-dialog-wrapper>
                </div>
            `);
    const editor = new TranslationEditorPage(page);
    await expect(editor.searchInput).toHaveCount(1);
    await editor.searchInput.fill('Photoshop');
    await expect(editor.searchInput).toHaveValue('Photoshop');
    for (const input of await page.locator('input[name="tag-picker-search"]').all()) {
        await expect(input).toHaveValue('');
    }
});

test('translation search waits for a loaded immutable card rather than a mutable clone', async ({ page }) => {
    await page.setContent(`
        <div id="add-items-overlay">
            <sp-dialog-wrapper class="add-items-dialog">
                <mas-items-selector>
                    <div role="tabpanel" aria-label="Fragments"><mas-select-items-table></mas-select-items-table></div>
                </mas-items-selector>
            </sp-dialog-wrapper>
        </div>
    `);
    await page.locator('mas-select-items-table').evaluate((table) => {
        table.itemsToDisplay = [{ title: 'MAS.Nala.Automation.other-run.mutable-clone' }];
        setTimeout(() => {
            table.itemsToDisplay.push({ title: 'Loaded immutable card' });
        }, 200);
    });
    expect(await new TranslationEditorPage(page).getSearchSourceTitle()).toBe('Loaded immutable card');
});

test('translation search accepts only its own run-owned immutable sources', async ({ page }) => {
    const runId = createRunId();
    await page.setContent(`
        <div id="add-items-overlay">
            <sp-dialog-wrapper class="add-items-dialog">
                <mas-items-selector>
                    <div role="tabpanel" aria-label="Fragments"><mas-select-items-table></mas-select-items-table></div>
                </mas-items-selector>
            </sp-dialog-wrapper>
        </div>
    `);
    await page.locator('mas-select-items-table').evaluate((table, runId) => {
        table.itemsToDisplay = [
            { title: 'MAS.Nala.Automation.other-run.source.w0.card' },
            { title: `MAS.Nala.Automation.${runId}.mutable-clone` },
            { title: `MAS.Nala.Automation.${runId}.source.w0.card` },
        ];
    }, runId);
    expect(await new TranslationEditorPage(page).getSearchSourceTitle()).toBe(`MAS.Nala.Automation.${runId}.source.w0.card`);
});

test('accessibility waits for finite fades and does not wait for infinite animations', async ({ page }) => {
    await page.setContent('<main id="scope"><p style="color:black;background:white">Readable content</p></main>');
    await page.locator('#scope').evaluate((element) => {
        element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, fill: 'forwards' });
        element.querySelector('p').animate([{ transform: 'none' }, { transform: 'translateX(1px)' }], {
            duration: 1000,
            iterations: Infinity,
        });
    });
    await runAccessibilityTest({ page, testScope: '#scope', includeTags: ['wcag2aa'] });
    await expect(page.locator('#scope')).toHaveCSS('opacity', '1');
});

test('accessibility still rejects permanent contrast violations', async ({ page }) => {
    await page.setContent('<main id="scope"><p style="color:#ccc;background:white">Unreadable content</p></main>');
    await expect(runAccessibilityTest({ page, testScope: page.locator('#scope'), includeTags: ['wcag2aa'] })).rejects.toThrow(
        /color-contrast/,
    );
});

test('translation result counts exclude nested variation rows', async ({ page }) => {
    await page.setContent(`
        <div role="tabpanel" aria-label="Fragments"><mas-select-items-table></mas-select-items-table></div>
        <div id="add-items-overlay">
            <sp-dialog-wrapper class="add-items-dialog">
                <mas-items-selector>
                    <div role="tabpanel" aria-label="Fragments">
                        <mas-search-and-filters><div class="result-count">1 result</div></mas-search-and-filters>
                        <mas-select-items-table>
                            <sp-table-body>
                                <mas-collapsible-table-row>
                                    <sp-table-row>Parent</sp-table-row>
                                    <sp-table-row>Variation</sp-table-row>
                                </mas-collapsible-table-row>
                            </sp-table-body>
                        </mas-select-items-table>
                    </div>
                </mas-items-selector>
            </sp-dialog-wrapper>
        </div>
    `);
    await new TranslationEditorPage(page).expectResultCountMatchesTableRows();
});

test('translation tag filters commit through Apply rather than merely closing the picker', async ({ page }) => {
    await page.setContent(`
        <div id="add-items-overlay">
            <sp-dialog-wrapper class="add-items-dialog">
                <mas-items-selector>
                    <div role="tabpanel" aria-label="Fragments">
                        <aem-tag-picker-field label="Market Segment">
                            <overlay-trigger placement="bottom-start">
                                <sp-action-button slot="trigger">Market Segment</sp-action-button>
                                <sp-popover slot="click-content">
                                    <sp-checkbox value="com">com</sp-checkbox>
                                    <sp-button>Apply</sp-button>
                                </sp-popover>
                            </overlay-trigger>
                        </aem-tag-picker-field>
                    </div>
                </mas-items-selector>
            </sp-dialog-wrapper>
        </div>
    `);
    await page.addScriptTag({ content: spectrum });
    await page.evaluate(() => {
        const field = document.querySelector('aem-tag-picker-field');
        field.value = [];
        field.tempValue = [];
        field.querySelector('sp-checkbox').addEventListener('change', () => {
            setTimeout(() => {
                field.tempValue = ['com'];
            }, 200);
        });
        field.querySelector('sp-button').addEventListener('click', () => {
            setTimeout(() => {
                field.value = [...field.tempValue];
            }, 200);
            field.querySelector('overlay-trigger').open = false;
        });
    });
    await new TranslationEditorPage(page).selectFilter('Market Segment', 'com');
    await expect(page.locator('aem-tag-picker-field')).toHaveJSProperty('value', ['com']);
});

test('translation Template filter is distinct from Status and closes after selection', async ({ page }) => {
    await page.setContent(`
        <div id="add-items-overlay">
            <sp-dialog-wrapper class="add-items-dialog">
                <mas-items-selector>
                    <div role="tabpanel" aria-label="Fragments">
                        <overlay-trigger placement="bottom-start" id="template">
                            <sp-action-button class="template-filter" slot="trigger">Template</sp-action-button>
                            <sp-popover slot="click-content"><sp-checkbox>Plans</sp-checkbox></sp-popover>
                        </overlay-trigger>
                        <overlay-trigger placement="bottom-start">
                            <sp-action-button class="template-filter" slot="trigger">Status</sp-action-button>
                            <sp-popover slot="click-content"><sp-checkbox>Draft</sp-checkbox></sp-popover>
                        </overlay-trigger>
                    </div>
                </mas-items-selector>
            </sp-dialog-wrapper>
        </div>
    `);
    await page.addScriptTag({ content: spectrum });
    await page.locator('#template').evaluate((picker) => {
        picker.querySelector('sp-checkbox').addEventListener('change', () => {
            picker.querySelector('sp-action-button').textContent = 'Template (1)';
        });
    });
    await new TranslationEditorPage(page).selectFilter('Template', 'Plans');
    await expect(page.locator('#template sp-checkbox')).toHaveJSProperty('checked', true);
    await expect(page.locator('#template sp-popover')).toBeHidden();
});

test('translation column assertions wait for asynchronously loaded filtered rows', async ({ page }) => {
    await page.setContent(`
        <div id="add-items-overlay">
            <sp-dialog-wrapper class="add-items-dialog">
                <mas-items-selector>
                    <div role="tabpanel" aria-label="Fragments">
                        <mas-select-items-table><sp-table-body></sp-table-body></mas-select-items-table>
                    </div>
                </mas-items-selector>
            </sp-dialog-wrapper>
        </div>
    `);
    await page.evaluate(() => {
        setTimeout(() => {
            document.querySelector('sp-table-body').innerHTML = `
                <mas-collapsible-table-row>
                    <sp-table-row><sp-table-cell>Creative Cloud Individual Extra Storage</sp-table-cell></sp-table-row>
                </mas-collapsible-table-row>
            `;
        }, 250);
    });
    await new TranslationEditorPage(page).expectCardRowsColumnContains(0, 'creative cloud individual extra storage');
});

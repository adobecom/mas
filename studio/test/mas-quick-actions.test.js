import { expect } from '@esm-bundle/chai';
import { html, nothing } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-quick-actions.js';
import { QUICK_ACTION } from '../src/constants.js';
import { spTheme } from './utils.js';
describe('MasQuickActions', () => {
    describe('default properties', () => {
        it('should initialize with default values', async () => {
            const el = await fixture(html`<mas-quick-actions></mas-quick-actions>`, { parentNode: spTheme() });
            expect(el.isDraggable).to.be.true;
            expect(el.actions).to.deep.equal([]);
            expect(el.disabled).to.be.instanceOf(Set);
            expect(el.disabled.size).to.equal(0);
        });
    });
    describe('drag handle', () => {
        it('should not render drag handle when isDraggable is false', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${false}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            expect(dragHandle).to.not.exist;
        });
        it('should render drag handle when isDraggable is true', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            expect(dragHandle).to.exist;
            const dragIcon = dragHandle.querySelector('svg');
            expect(dragIcon).to.exist;
        });
        it('should start dragging on mousedown', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            expect(el._dragging).to.be.false;
            dragHandle.dispatchEvent(
                new MouseEvent('mousedown', {
                    clientX: 100,
                    clientY: 100,
                    bubbles: true,
                }),
            );
            expect(el._dragging).to.be.true;
            document.dispatchEvent(new MouseEvent('mouseup'));
            expect(el._dragging).to.be.false;
        });
        it('should update position during drag', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            const toolbar = el.shadowRoot.querySelector('.quick-actions-toolbar');
            dragHandle.dispatchEvent(
                new MouseEvent('mousedown', {
                    clientX: 100,
                    clientY: 100,
                    bubbles: true,
                }),
            );
            document.dispatchEvent(
                new MouseEvent('mousemove', {
                    clientX: 150,
                    clientY: 150,
                }),
            );
            await el.updateComplete;
            expect(toolbar.style.left).to.not.be.empty;
            expect(toolbar.style.bottom).to.not.be.empty;
            document.dispatchEvent(new MouseEvent('mouseup'));
        });
        it('should add dragging class while dragging', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            const toolbar = el.shadowRoot.querySelector('.quick-actions-toolbar');
            expect(toolbar.classList.contains('dragging')).to.be.false;
            dragHandle.dispatchEvent(
                new MouseEvent('mousedown', {
                    clientX: 100,
                    clientY: 100,
                    bubbles: true,
                }),
            );
            await el.updateComplete;
            expect(toolbar.classList.contains('dragging')).to.be.true;
            document.dispatchEvent(new MouseEvent('mouseup'));
            await el.updateComplete;
            expect(toolbar.classList.contains('dragging')).to.be.false;
        });
        it('should handle touch events for dragging', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            expect(el._dragging).to.be.false;
            const touch = new Touch({
                identifier: 0,
                target: dragHandle,
                clientX: 100,
                clientY: 100,
            });
            const touchEvent = new TouchEvent('touchstart', {
                touches: [touch],
                bubbles: true,
                cancelable: true,
            });
            dragHandle.dispatchEvent(touchEvent);
            expect(el._dragging).to.be.true;
            document.dispatchEvent(new TouchEvent('touchend'));
            expect(el._dragging).to.be.false;
        });
        it('should reset position when resetPosition is called', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            const toolbar = el.shadowRoot.querySelector('.quick-actions-toolbar');
            dragHandle.dispatchEvent(
                new MouseEvent('mousedown', {
                    clientX: 100,
                    clientY: 100,
                    bubbles: true,
                }),
            );
            document.dispatchEvent(
                new MouseEvent('mousemove', {
                    clientX: 200,
                    clientY: 200,
                }),
            );
            document.dispatchEvent(new MouseEvent('mouseup'));
            await el.updateComplete;
            expect(toolbar.style.left).to.not.be.empty;
            el.resetPosition();
            await el.updateComplete;
            expect(toolbar.style.left).to.equal('');
            expect(toolbar.style.bottom).to.equal('');
        });
        it('should clean up event listeners on disconnect', async () => {
            const el = await fixture(html`<mas-quick-actions .isDraggable=${true}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const dragHandle = el.shadowRoot.querySelector('.drag-handle');
            dragHandle.dispatchEvent(
                new MouseEvent('mousedown', {
                    clientX: 100,
                    clientY: 100,
                    bubbles: true,
                }),
            );
            expect(el._dragging).to.be.true;
            el.remove();
            expect(el._dragging).to.be.false;
        });
    });
    describe('actions rendering', () => {
        it('should render save action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.SAVE]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
            expect(buttons.length).to.equal(1);
            expect(buttons[0].title).to.equal('Save');
            const icon = buttons[0].querySelector('sp-icon-save-floppy');
            expect(icon).to.exist;
        });
        it('should render duplicate action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.DUPLICATE]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Duplicate');
            const icon = button.querySelector('sp-icon-duplicate');
            expect(icon).to.exist;
        });
        it('should render publish action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.PUBLISH]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Publish');
            const icon = button.querySelector('sp-icon-publish');
            expect(icon).to.exist;
        });
        it('should render cancel action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.CANCEL]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Cancel');
            const icon = button.querySelector('sp-icon-publish-remove');
            expect(icon).to.exist;
        });
        it('should render copy action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.COPY]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Copy code');
            const icon = button.querySelector('sp-icon-code');
            expect(icon).to.exist;
        });
        it('should render lock action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.LOCK]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Lock');
            const icon = button.querySelector('sp-icon-lock-closed');
            expect(icon).to.exist;
        });
        it('should render discard action button', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.DISCARD]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Discard');
            const icon = button.querySelector('sp-icon-undo');
            expect(icon).to.exist;
        });
        it('should render delete action button with delete-action class', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.DELETE]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const button = el.shadowRoot.querySelector('sp-action-button');
            expect(button.title).to.equal('Delete');
            expect(button.classList.contains('delete-action')).to.be.true;
            const icon = button.querySelector('sp-icon-delete');
            expect(icon).to.exist;
        });
        it('should render multiple actions', async () => {
            const actions = [QUICK_ACTION.SAVE, QUICK_ACTION.DUPLICATE, QUICK_ACTION.PUBLISH, QUICK_ACTION.DELETE];
            const el = await fixture(html`<mas-quick-actions .actions=${actions}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
            expect(buttons.length).to.equal(4);
            expect(buttons[0].title).to.equal('Save');
            expect(buttons[1].title).to.equal('Duplicate');
            expect(buttons[2].title).to.equal('Publish');
            expect(buttons[3].title).to.equal('Delete');
        });
        it('should not render unknown actions', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${['unknown', 'invalid']}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
            expect(buttons.length).to.equal(0);
        });
        it('should skip unknown actions while rendering valid ones', async () => {
            const el = await fixture(
                html`<mas-quick-actions .actions=${[QUICK_ACTION.SAVE, 'unknown', QUICK_ACTION.DELETE]}></mas-quick-actions>`,
                {
                    parentNode: spTheme(),
                },
            );
            const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
            expect(buttons.length).to.equal(2);
            expect(buttons[0].title).to.equal('Save');
            expect(buttons[1].title).to.equal('Delete');
        });
    });
    describe('disabled actions', () => {
        it('should disable actions in the disabled set', async () => {
            const el = await fixture(
                html`<mas-quick-actions .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.PUBLISH]}></mas-quick-actions>`,
                {
                    parentNode: spTheme(),
                },
            );
            el.disabled = new Set([QUICK_ACTION.SAVE]);
            await el.updateComplete;
            const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
            expect(buttons[0].disabled).to.be.true;
            expect(buttons[1].disabled).to.be.false;
        });
        it('should allow multiple disabled actions', async () => {
            const el = await fixture(
                html`<mas-quick-actions
                    .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.PUBLISH, QUICK_ACTION.DELETE]}
                ></mas-quick-actions>`,
                {
                    parentNode: spTheme(),
                },
            );
            el.disabled = new Set([QUICK_ACTION.SAVE, QUICK_ACTION.DELETE]);
            await el.updateComplete;
            const buttons = el.shadowRoot.querySelectorAll('sp-action-button');
            expect(buttons[0].disabled).to.be.true;
            expect(buttons[1].disabled).to.be.false;
            expect(buttons[2].disabled).to.be.true;
        });
    });
    describe('events', () => {
        it('should dispatch correct event for each action when clicked', async () => {
            for (const action of Object.values(QUICK_ACTION)) {
                const el = await fixture(html`<mas-quick-actions .actions=${[action]}></mas-quick-actions>`, {
                    parentNode: spTheme(),
                });
                const button = el.shadowRoot.querySelector('sp-action-button');
                const listener = oneEvent(el, action);
                button.click();
                const event = await listener;
                expect(event.type).to.equal(action);
                expect(event.bubbles).to.be.true;
                expect(event.composed).to.be.true;
            }
        });
    });
    describe('renderIcon', () => {
        it('should return nothing for unknown icon', async () => {
            const el = await fixture(html`<mas-quick-actions></mas-quick-actions>`, { parentNode: spTheme() });
            const result = el.renderIcon('unknown-icon');
            expect(result).to.equal(nothing);
        });
    });
    describe('toolbar structure', () => {
        it('should render quick-actions-toolbar container', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.SAVE]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const toolbar = el.shadowRoot.querySelector('.quick-actions-toolbar');
            expect(toolbar).to.exist;
        });
        it('should render actions container', async () => {
            const el = await fixture(html`<mas-quick-actions .actions=${[QUICK_ACTION.SAVE]}></mas-quick-actions>`, {
                parentNode: spTheme(),
            });
            const actionsContainer = el.shadowRoot.querySelector('.actions');
            expect(actionsContainer).to.exist;
        });
    });
});

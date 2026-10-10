import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixtureSync, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { buildEditorHref, renderEditorLink, renderRowLinkOverlay } from '../../src/common/utils/editor-link.js';
import { PAGE_NAMES } from '../../src/constants.js';
import Store from '../../src/store.js';

describe('editor-link', () => {
    const fragment = {
        id: 'fragment-1',
        path: '/content/dam/mas/acom/fr_FR/cards/example',
    };
    let originalSearch;
    let originalFilters;
    let originalHref;

    beforeEach(() => {
        originalSearch = Store.search.get();
        originalFilters = Store.filters.get();
        originalHref = window.location.href;
        Store.search.set({ path: 'sandbox', region: 'en_CA', query: 'existing search' });
        Store.filters.set({ ...originalFilters, locale: 'en_US' });
    });

    afterEach(() => {
        sinon.restore();
        fixtureCleanup();
        Store.search.set(originalSearch);
        Store.filters.set(originalFilters);
        window.history.replaceState(window.history.state, '', originalHref);
    });

    const getParams = (href) => new URLSearchParams(new URL(href, window.location.href).hash.slice(1));

    describe('buildEditorHref', () => {
        it('builds a fragment editor link with the fragment surface and region', () => {
            const params = getParams(buildEditorHref(fragment));

            expect(Object.fromEntries(params)).to.deep.equal({
                page: PAGE_NAMES.FRAGMENT_EDITOR,
                fragmentId: fragment.id,
                path: 'acom',
                region: 'fr_FR',
                locale: 'en_US',
            });
        });

        for (const [page, idKey] of [
            [PAGE_NAMES.TRANSLATION_EDITOR, 'translationProjectId'],
            [PAGE_NAMES.BULK_PUBLISH_EDITOR, 'bulkPublishProjectId'],
            [PAGE_NAMES.PROMOTIONS_EDITOR, 'promotionId'],
        ]) {
            it(`uses the dedicated project ID for ${page}`, () => {
                const params = getParams(buildEditorHref(fragment, { page }));

                expect(params.get('page')).to.equal(page);
                expect(params.get(idKey)).to.equal(fragment.id);
                expect(params.has('fragmentId')).to.be.false;
            });
        }

        it('uses the fragment name for a mask editor link', () => {
            const params = getParams(
                buildEditorHref({ ...fragment, fragmentName: 'named-mask' }, { page: PAGE_NAMES.MASKS_EDITOR }),
            );

            expect(params.get('page')).to.equal(PAGE_NAMES.MASKS_EDITOR);
            expect(params.get('maskName')).to.equal('named-mask');
            expect(params.has('fragmentId')).to.be.false;
        });

        it('falls back to the final path segment for a mask without a fragment name', () => {
            const params = getParams(buildEditorHref(fragment, { page: PAGE_NAMES.MASKS_EDITOR }));

            expect(params.get('maskName')).to.equal('example');
        });

        it('omits the mask name when neither a name nor a path is available', () => {
            const params = getParams(buildEditorHref({ id: 'mask-1' }, { page: PAGE_NAMES.MASKS_EDITOR }));

            expect(params.get('page')).to.equal(PAGE_NAMES.MASKS_EDITOR);
            expect(params.has('maskName')).to.be.false;
        });

        it('returns a relative hash link', () => {
            expect(buildEditorHref(fragment)).to.match(/^#page=/);
        });

        it('includes promotion context when opening a fragment', () => {
            const params = getParams(buildEditorHref(fragment, { promotionId: 'promotion-1' }));

            expect(params.get('fragmentId')).to.equal(fragment.id);
            expect(params.get('promotionId')).to.equal('promotion-1');
        });

        it('omits promotion context when no promotion ID is provided', () => {
            const params = getParams(buildEditorHref(fragment));

            expect(params.has('promotionId')).to.be.false;
        });

        it('uses the current search surface and region when the fragment has no path', () => {
            const params = getParams(buildEditorHref({ id: fragment.id }));

            expect(params.get('path')).to.equal('sandbox');
            expect(params.get('region')).to.equal('en_CA');
        });

        it('omits surface and region when neither the fragment nor search provides them', () => {
            Store.search.set({});

            const params = getParams(buildEditorHref({ id: fragment.id }));

            expect(params.has('path')).to.be.false;
            expect(params.has('region')).to.be.false;
        });

        it('encodes IDs without allowing them to introduce additional hash parameters', () => {
            const id = 'fragment & promotionId=unexpected/#?';

            const params = getParams(buildEditorHref({ ...fragment, id }));

            expect(params.get('fragmentId')).to.equal(id);
            expect(params.has('promotionId')).to.be.false;
        });

        it('preserves the current origin, pathname, and query string', () => {
            const currentUrl = new URL(window.location.href);

            const href = new URL(buildEditorHref(fragment), window.location.href);

            expect(href.origin).to.equal(currentUrl.origin);
            expect(href.pathname).to.equal(currentUrl.pathname);
            expect(href.search).to.equal(currentUrl.search);
        });

        it('replaces existing hash parameters instead of carrying list state into the editor link', () => {
            window.history.replaceState(window.history.state, '', '#page=content&query=old-search&promotionId=old-promotion');

            const params = getParams(buildEditorHref(fragment));

            expect(params.has('query')).to.be.false;
            expect(params.has('promotionId')).to.be.false;
            expect(params.get('page')).to.equal(PAGE_NAMES.FRAGMENT_EDITOR);
        });

        it('does not change the current URL or Studio navigation state', () => {
            const href = window.location.href;
            const stores = [
                Store.search,
                Store.filters,
                Store.page,
                Store.fragmentEditor.fragmentId,
                Store.promotions.promotionId,
            ];
            const setters = stores.map((store) => sinon.spy(store, 'set'));

            buildEditorHref(fragment, { promotionId: 'promotion-1' });

            expect(window.location.href).to.equal(href);
            for (const setter of setters) {
                expect(setter.called).to.be.false;
            }
        });
    });

    describe('rendering', () => {
        it('renders a visible label with the requested editor URL', () => {
            const row = fixtureSync(
                html`<div>${renderEditorLink(fragment, 'Example project', { page: PAGE_NAMES.TRANSLATION_EDITOR })}</div>`,
            );
            const link = row.querySelector('a');

            expect(link.classList.contains('fragment-editor-link')).to.be.true;
            expect(link.textContent).to.equal('Example project');
            expect(link.getAttribute('href')).to.equal(buildEditorHref(fragment, { page: PAGE_NAMES.TRANSLATION_EDITOR }));
        });

        it('renders labels as text instead of interpreting them as HTML', () => {
            const label = '<img src="invalid" onerror="alert(1)">';

            const row = fixtureSync(html`<div>${renderEditorLink(fragment, label)}</div>`);

            expect(row.querySelector('a').textContent).to.equal(label);
            expect(row.querySelector('img')).to.be.null;
        });

        it('renders only the label when a fragment has no ID', () => {
            const row = fixtureSync(html`<div>${renderEditorLink({}, 'Unavailable fragment')}</div>`);

            expect(row.querySelector('a')).to.be.null;
            expect(row.textContent).to.equal('Unavailable fragment');
        });

        it('renders the row overlay without adding a keyboard tab stop or an accessible duplicate link', () => {
            const row = fixtureSync(html`<div>${renderRowLinkOverlay(fragment, { promotionId: 'promotion-1' })}</div>`);
            const link = row.querySelector('a');

            expect(link.classList.contains('row-link-overlay')).to.be.true;
            expect(link.tabIndex).to.equal(-1);
            expect(link.getAttribute('aria-hidden')).to.equal('true');
            expect(link.getAttribute('href')).to.equal(buildEditorHref(fragment, { promotionId: 'promotion-1' }));
        });

        it('renders no overlay when a fragment has no ID', () => {
            const row = fixtureSync(html`<div>${renderRowLinkOverlay({})}</div>`);

            expect(row.querySelector('a')).to.be.null;
            expect(row.textContent).to.equal('');
        });

        it('renders the title as plain text while its editor link is disabled', () => {
            const row = fixtureSync(html`<div>${renderEditorLink(fragment, 'Loading context', { disabled: true })}</div>`);

            expect(row.querySelector('a')).to.be.null;
            expect(row.textContent).to.equal('Loading context');
        });

        it('omits the row overlay while its editor link is disabled', () => {
            const row = fixtureSync(html`<div>${renderRowLinkOverlay(fragment, { disabled: true })}</div>`);

            expect(row.querySelector('a')).to.be.null;
        });

        it('renders an overlay for a precomputed item URL without a fragment ID', () => {
            const row = fixtureSync(
                html`<div>${renderRowLinkOverlay({}, { href: 'https://mas.adobe.com/studio.html#page=placeholders' })}</div>`,
            );

            expect(row.querySelector('a').href).to.equal('https://mas.adobe.com/studio.html#page=placeholders');
        });
    });

    function dispatchGesture(link, type, options = {}) {
        const event = new MouseEvent(type, { bubbles: true, composed: true, cancelable: true, detail: 1, ...options });
        let defaultPrevented;
        link.addEventListener(
            type,
            () => {
                defaultPrevented = event.defaultPrevented;
                event.preventDefault();
            },
            { once: true },
        );
        link.dispatchEvent(event);
        return defaultPrevented;
    }

    for (const [name, renderLink] of [
        ['title link', () => renderEditorLink(fragment, 'Example fragment')],
        ['row overlay', () => renderRowLinkOverlay(fragment)],
    ]) {
        describe(`${name} gestures`, () => {
            let row;
            let link;
            let rowClick;
            let rowDoubleClick;

            beforeEach(() => {
                rowClick = sinon.spy();
                rowDoubleClick = sinon.spy();
                row = fixtureSync(html`<div @click=${rowClick} @dblclick=${rowDoubleClick}>${renderLink()}</div>`);
                link = row.querySelector('a');
            });

            it('prevents plain-click navigation while preserving the row click interaction', () => {
                const defaultPrevented = dispatchGesture(link, 'click');

                expect(defaultPrevented).to.be.true;
                expect(rowClick.calledOnce).to.be.true;
            });

            for (const [gesture, options] of [
                ['Ctrl-click', { ctrlKey: true }],
                ['Cmd-click', { metaKey: true }],
                ['Shift-click', { shiftKey: true }],
                ['Alt-click', { altKey: true }],
                ['middle-button click', { button: 1 }],
                ['secondary-button click', { button: 2 }],
            ]) {
                it(`allows native ${gesture} without triggering the row click interaction`, () => {
                    const defaultPrevented = dispatchGesture(link, 'click', options);

                    expect(defaultPrevented).to.be.false;
                    expect(rowClick.called).to.be.false;
                });
            }

            it('opens through the row double-click handler on keyboard activation', () => {
                const defaultPrevented = dispatchGesture(link, 'click', { detail: 0 });

                expect(defaultPrevented).to.be.true;
                expect(rowClick.called).to.be.false;
                expect(rowDoubleClick.calledOnce).to.be.true;
            });

            it('preserves plain double-click handling on the row', () => {
                const defaultPrevented = dispatchGesture(link, 'dblclick', { detail: 2 });

                expect(defaultPrevented).to.be.false;
                expect(rowDoubleClick.calledOnce).to.be.true;
            });

            for (const modifier of ['ctrlKey', 'metaKey', 'shiftKey', 'altKey']) {
                it(`does not trigger row double-click handling when ${modifier} is pressed`, () => {
                    const defaultPrevented = dispatchGesture(link, 'dblclick', { detail: 2, [modifier]: true });

                    expect(defaultPrevented).to.be.false;
                    expect(rowDoubleClick.called).to.be.false;
                });
            }

            for (const type of ['auxclick', 'contextmenu']) {
                it(`preserves native ${type} without propagating it to the row`, () => {
                    const rowEvent = sinon.spy();
                    row.addEventListener(type, rowEvent);

                    const defaultPrevented = dispatchGesture(link, type, { button: type === 'auxclick' ? 1 : 2 });

                    expect(defaultPrevented).to.be.false;
                    expect(rowEvent.called).to.be.false;
                });
            }
        });
    }

    it('preserves selection on keyboard activation in selection-only tables', () => {
        const select = sinon.spy();
        const open = sinon.spy();
        const row = fixtureSync(
            html`<div @click=${select} @dblclick=${open}>
                ${renderEditorLink(fragment, 'Select fragment', { selectionOnly: true })}
            </div>`,
        );

        expect(dispatchGesture(row.querySelector('a'), 'click', { detail: 0 })).to.be.true;
        expect(select.calledOnce).to.be.true;
        expect(open.called).to.be.false;
    });

    it('preserves native keyboard navigation in view-only rows without an open handler', () => {
        const rowClick = sinon.spy();
        const rowDoubleClick = sinon.spy();
        const row = fixtureSync(
            html`<div @click=${rowClick} @dblclick=${rowDoubleClick}>
                ${renderEditorLink(fragment, 'View fragment', { nativeKeyboard: true })}
            </div>`,
        );

        expect(dispatchGesture(row.querySelector('a'), 'click', { detail: 0 })).to.be.false;
        expect(rowClick.called).to.be.false;
        expect(rowDoubleClick.called).to.be.false;
    });

    it('preserves modified keyboard activation as a native browser gesture', () => {
        const open = sinon.spy();
        const row = fixtureSync(html`<div @dblclick=${open}>${renderEditorLink(fragment, 'Fragment')}</div>`);

        expect(dispatchGesture(row.querySelector('a'), 'click', { detail: 0, metaKey: true })).to.be.false;
        expect(open.called).to.be.false;
    });
});

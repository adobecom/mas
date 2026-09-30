import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { render } from 'lit';
import {
    getFragmentEditorHref,
    isNativeNewTabClick,
    renderFragmentEditorLink,
    renderNewTabAwareLink,
} from '../../../src/common/utils/fragment-editor-link.js';

describe('fragment-editor-link', () => {
    afterEach(() => {
        window.location.hash = '';
    });

    describe('getFragmentEditorHref', () => {
        it('builds the fragment-editor hash for a fragment id', () => {
            expect(getFragmentEditorHref('abc')).to.equal('#page=fragment-editor&fragmentId=abc');
        });

        it('sets the path param when provided', () => {
            expect(getFragmentEditorHref('abc', { path: 'nala' })).to.equal('#page=fragment-editor&fragmentId=abc&path=nala');
        });

        it('preserves other current hash params, overriding only page and fragmentId', () => {
            window.location.hash = '#page=content&surface=ccd';
            expect(getFragmentEditorHref('abc')).to.equal('#page=fragment-editor&surface=ccd&fragmentId=abc');
        });

        it('never returns a live/published-page URL', () => {
            window.location.hash = '#page=content&path=acom';
            const href = getFragmentEditorHref('abc');
            expect(href).to.not.match(/^https?:\/\//);
            expect(href).to.not.include('page=content');
        });
    });

    describe('isNativeNewTabClick', () => {
        it('is false for a plain primary click', () => {
            expect(isNativeNewTabClick({ button: 0 })).to.be.false;
        });

        it('is true for ctrl/meta/shift/alt clicks', () => {
            expect(isNativeNewTabClick({ button: 0, ctrlKey: true })).to.be.true;
            expect(isNativeNewTabClick({ button: 0, metaKey: true })).to.be.true;
            expect(isNativeNewTabClick({ button: 0, shiftKey: true })).to.be.true;
            expect(isNativeNewTabClick({ button: 0, altKey: true })).to.be.true;
        });

        it('is true for non-primary buttons (e.g. middle-click)', () => {
            expect(isNativeNewTabClick({ button: 1 })).to.be.true;
        });
    });

    describe('renderFragmentEditorLink', () => {
        it('renders an anchor with the fragment-editor href and the given content', () => {
            const container = document.createElement('div');
            render(renderFragmentEditorLink({ fragmentId: 'abc', content: 'My Fragment' }), container);
            const link = container.querySelector('a');
            expect(link.getAttribute('href')).to.equal('#page=fragment-editor&fragmentId=abc');
            expect(link.textContent.trim()).to.equal('My Fragment');
        });

        it('prevents default and calls onPlainClick for a plain click', () => {
            const onPlainClick = sinon.spy();
            const container = document.createElement('div');
            render(renderFragmentEditorLink({ fragmentId: 'abc', content: 'x', onPlainClick }), container);
            const link = container.querySelector('a');
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).to.be.true;
            expect(onPlainClick.calledOnce).to.be.true;
        });

        it('does not prevent default or call onPlainClick for a ctrl-click', () => {
            const onPlainClick = sinon.spy();
            const container = document.createElement('div');
            render(renderFragmentEditorLink({ fragmentId: 'abc', content: 'x', onPlainClick }), container);
            const link = container.querySelector('a');
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ctrlKey: true });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).to.be.false;
            expect(onPlainClick.called).to.be.false;
        });
    });

    describe('renderNewTabAwareLink', () => {
        it('renders an anchor for an arbitrary href, not just a fragment-editor one', () => {
            const container = document.createElement('div');
            render(renderNewTabAwareLink({ href: '#page=masks-editor&maskName=my-mask', content: 'My Mask' }), container);
            const link = container.querySelector('a');
            expect(link.getAttribute('href')).to.equal('#page=masks-editor&maskName=my-mask');
            expect(link.textContent.trim()).to.equal('My Mask');
        });

        it('prevents default and calls onPlainClick for a plain click, same as renderFragmentEditorLink', () => {
            const onPlainClick = sinon.spy();
            const container = document.createElement('div');
            render(
                renderNewTabAwareLink({ href: '#page=masks-editor&maskName=my-mask', content: 'x', onPlainClick }),
                container,
            );
            const link = container.querySelector('a');
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).to.be.true;
            expect(onPlainClick.calledOnce).to.be.true;
        });

        it('does not prevent default when there is no onPlainClick to run', () => {
            const container = document.createElement('div');
            render(renderNewTabAwareLink({ href: '#page=masks-editor&maskName=my-mask', content: 'x' }), container);
            const link = container.querySelector('a');
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
            link.dispatchEvent(event);
            expect(event.defaultPrevented).to.be.true;
        });
    });
});

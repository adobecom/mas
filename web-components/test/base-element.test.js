import { expect } from './utilities.js';
import {
    BaseElement,
    html,
    nothing,
    on,
    unsafeHTML,
} from '../src/base-element.js';

class TestElement extends BaseElement {
    static properties = {
        label: { type: String },
        count: { type: Number, reflect: true },
        open: { type: Boolean, attribute: 'is-open', reflect: true },
        tags: {
            attribute: 'tags',
            converter: { fromAttribute: (value) => value?.split(',') },
        },
        state: { state: true },
    };

    static styles = ':host { display: block; }';

    updates = [];

    willUpdate(changed) {
        this.updates.push(new Map(changed));
    }

    render() {
        return html`<button class="${this.open ? 'open' : ''}">
                ${this.label}
            </button>
            ${this.open ? html`<p>${this.count}</p>` : ''}
            <span class="static">static</span>`;
    }

    bindEvents() {
        on(this.shadowRoot.querySelector('button'), 'click', () => {
            this.open = !this.open;
        });
    }
}
customElements.define('base-element-test', TestElement);

const create = async (setup) => {
    const element = document.createElement('base-element-test');
    setup?.(element);
    document.body.append(element);
    await element.updateComplete;
    return element;
};

describe('BaseElement', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('applies values assigned before upgrade', async () => {
        const element = document.createElement('base-element-test-late');
        element.label = 'early';
        document.body.append(element);
        customElements.define(
            'base-element-test-late',
            class extends TestElement {},
        );
        await element.updateComplete;
        expect(element.label).to.equal('early');
        expect(
            element.shadowRoot.querySelector('button').textContent,
        ).to.include('early');
    });

    it('reflects only reflected properties and converts attributes', async () => {
        const element = await create((el) => {
            el.label = 'a';
            el.count = 2;
            el.setAttribute('tags', 'x,y');
        });
        expect(element.hasAttribute('label')).to.be.false;
        expect(element.getAttribute('count')).to.equal('2');
        expect(element.tags).to.deep.equal(['x', 'y']);
        element.setAttribute('is-open', '');
        expect(element.open).to.be.true;
        element.open = false;
        await element.updateComplete;
        expect(element.hasAttribute('is-open')).to.be.false;
    });

    it('batches changes into one update with their previous values', async () => {
        const element = await create();
        element.updates = [];
        element.label = 'one';
        element.label = 'two';
        element.count = 3;
        expect(await element.updateComplete).to.be.true;
        expect(element.updates).to.have.length(1);
        expect([...element.updates[0]]).to.deep.equal([
            ['label', undefined],
            ['count', undefined],
        ]);
        element.count = 3;
        expect(element.isUpdatePending).to.be.false;
    });

    it('escapes values unless they are html or unsafeHTML results', () => {
        const value = `<img src=x onerror="alert('x')">&`;
        expect(String(html`<p title="${value}">${value}</p>`)).to.equal(
            '<p title="&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;">&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;</p>',
        );
        const items = ['a', '<b>'].map((item) => html`<li>${item}</li>`);
        const list = html`<ul>
            ${items}
        </ul>`;
        expect(String(list).replace(/>\s+</g, '><')).to.equal(
            '<ul><li>a</li><li>&lt;b&gt;</li></ul>',
        );
        expect(
            String(
                html`${unsafeHTML('<b>x</b>')}${null}${undefined}${nothing}`,
            ),
        ).to.equal('<b>x</b>');
    });

    it('patches the shadow DOM in place and keeps what other code changed', async () => {
        const element = await create((el) => {
            el.label = 'a';
        });
        const root = element.shadowRoot;
        const button = root.querySelector('button');
        const staticSpan = root.querySelector('.static');
        const foreign = document.createElement('style');
        root.append(foreign);
        staticSpan.classList.add('touched');
        button.focus();

        button.click();
        element.count = 1;
        await element.updateComplete;
        expect(root.querySelector('button')).to.equal(button);
        expect(button.className).to.equal('open');
        expect(root.activeElement).to.equal(button);
        expect(root.querySelector('p').textContent).to.equal('1');
        expect(root.querySelector('.static')).to.equal(staticSpan);
        expect(staticSpan.classList.contains('touched')).to.be.true;
        expect(foreign.parentNode).to.equal(root);

        button.click();
        await element.updateComplete;
        expect(root.querySelector('p')).to.be.null;
        expect(root.querySelector('button')).to.equal(button);
    });
});

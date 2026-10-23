import { html as litHtml, LitElement } from 'lit';
import {
    html,
    ifDefined,
    LiteElement,
    nothing,
    render,
    unsafeHTML,
} from '../src/lite.js';
import { expect, sinon } from './utilities.js';

const text = (container) => container.textContent.replace(/\s+/g, ' ').trim();

describe('lite', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.append(container);
    });

    afterEach(() => container.remove());

    describe('render', () => {
        it('renders text, nested templates and clears them', () => {
            const view = (value) => html`<p>${value}</p>`;
            render(view('a'), container);
            const p = container.querySelector('p');
            render(view('b'), container);
            expect(container.querySelector('p')).to.equal(p);
            expect(text(container)).to.equal('b');
            render(view(html`<b>${1}</b>`), container);
            expect(p.innerHTML).to.include('<b>');
            render(view(html`<i>x</i>`), container);
            expect(p.querySelector('b')).to.be.null;
            render(view(nothing), container);
            expect(text(container)).to.equal('');
            render(view(undefined), container);
            render(view(5), container);
            expect(text(container)).to.equal('5');
        });

        it('renders lists, nodes, unsafe html and Lit templates', () => {
            const node = document.createElement('em');
            const view = (items) =>
                html`<ul>
                    ${items.map((item) => html`<li>${item}</li>`)}
                </ul>`;
            render(view([1, 2, 3]), container);
            expect(container.querySelectorAll('li').length).to.equal(3);
            render(view([4]), container);
            expect(text(container)).to.equal('4');
            render(view([]), container);
            expect(container.querySelectorAll('li').length).to.equal(0);
            const slot = (value) => html`${value}`;
            render(slot(node), container);
            render(slot(node), container);
            expect(container.querySelector('em')).to.equal(node);
            render(slot(unsafeHTML('<strong>s</strong>')), container);
            const strong = container.querySelector('strong');
            render(slot(unsafeHTML('<strong>s</strong>')), container);
            expect(container.querySelector('strong')).to.equal(strong);
            render(slot(unsafeHTML(undefined)), container);
            expect(container.querySelector('strong')).to.be.null;
            render(litHtml`<u>${'lit'}</u>`, container);
            expect(container.querySelector('u').textContent).to.equal('lit');
        });

        it('binds attributes, booleans, properties and events', () => {
            const host = { clicks: 0 };
            const listener = { handleEvent: sinon.spy() };
            function onClick() {
                this.clicks++;
            }
            const view = ({ a, b, open, value, click }) =>
                html`<!-- ${'ignored'} --><input
                        id=${a}
                        class="x ${a}-y ${b}"
                        title="${b}"
                        data-v=${ifDefined(b)}
                        ?data-open=${open}
                        .value=${value}
                        @click=${click}
                    />`;
            render(
                view({
                    a: 'a',
                    b: 'b',
                    open: true,
                    value: 'v',
                    click: onClick,
                }),
                container,
                { host },
            );
            const input = container.querySelector('input');
            expect(input.getAttribute('class')).to.equal('x a-y b');
            expect(input.getAttribute('title')).to.equal('b');
            expect(input.hasAttribute('data-open')).to.be.true;
            expect(input.value).to.equal('v');
            input.click();
            expect(host.clicks).to.equal(1);
            render(
                view({
                    a: undefined,
                    b: nothing,
                    open: false,
                    value: nothing,
                    click: listener,
                }),
                container,
                { host },
            );
            expect(input.getAttribute('id')).to.equal('');
            expect(input.hasAttribute('class')).to.be.false;
            expect(input.hasAttribute('data-v')).to.be.false;
            expect(input.hasAttribute('data-open')).to.be.false;
            input.click();
            expect(listener.handleEvent.calledOnce).to.be.true;
            render(
                view({
                    a: 'a',
                    b: 'b',
                    open: false,
                    value: 'v',
                    click: nothing,
                }),
                container,
                { host },
            );
            input.click();
            expect(host.clicks).to.equal(1);
        });
    });

    describe('LiteElement', () => {
        class LiteTest extends LiteElement {
            static properties = {
                label: { type: String, reflect: true },
                count: { type: Number, attribute: 'data-count' },
                active: { type: Boolean, reflect: true },
                config: { type: Object, reflect: true },
                upper: {
                    converter: {
                        fromAttribute: (value) => value?.toUpperCase(),
                    },
                },
                plain: { converter: (value) => `${value}!` },
                hidden: { state: true },
                same: { hasChanged: () => false },
            };

            static styles = ':host { display: block; }';

            constructor() {
                super();
                this.label = 'default';
            }

            render() {
                return html`<span>${this.label}</span>`;
            }
        }
        customElements.define('lite-test', LiteTest);

        class LiteChild extends LiteTest {
            static properties = { extra: { type: String } };
        }
        customElements.define('lite-child', LiteChild);

        it('reflects, converts and updates', async () => {
            const el = document.createElement('lite-test');
            container.append(el);
            await el.updateComplete;
            expect(el.getAttribute('label')).to.equal('default');
            expect(el.shadowRoot.textContent).to.equal('default');
            expect(el.shadowRoot.adoptedStyleSheets.length).to.equal(1);
            el.setAttribute('data-count', '3');
            el.setAttribute('upper', 'abc');
            el.setAttribute('plain', 'p');
            el.setAttribute('config', '{"a":1}');
            expect(el.count).to.equal(3);
            expect(el.upper).to.equal('ABC');
            expect(el.plain).to.equal('p!');
            expect(el.config).to.deep.equal({ a: 1 });
            el.setAttribute('config', 'not json');
            expect(el.config).to.be.null;
            el.removeAttribute('data-count');
            expect(el.count).to.be.null;
            el.active = true;
            el.config = { b: 2 };
            await el.updateComplete;
            expect(el.hasAttribute('active')).to.be.true;
            expect(el.getAttribute('config')).to.equal('{"b":2}');
            el.active = false;
            el.config = undefined;
            el.same = 1;
            await el.updateComplete;
            expect(el.hasAttribute('active')).to.be.false;
            expect(el.hasAttribute('config')).to.be.false;
            expect(LiteTest.observedAttributes).to.not.include('hidden');
        });

        it('keeps properties set before upgrade and inherits properties', async () => {
            const el = document.createElement('lite-pre');
            el.label = 'early';
            container.append(el);
            customElements.define('lite-pre', class extends LiteTest {});
            await el.updateComplete;
            expect(el.shadowRoot.textContent).to.equal('early');
            expect(LiteChild.observedAttributes).to.include.members([
                'label',
                'extra',
            ]);
        });

        it('runs lifecycle hooks', async () => {
            const calls = [];
            class LiteHooks extends LiteElement {
                static properties = { value: {} };
                willUpdate() {
                    calls.push('willUpdate');
                }
                firstUpdated() {
                    calls.push('firstUpdated');
                }
                updated() {
                    calls.push('updated');
                }
                shouldUpdate() {
                    return this.value !== 'skip';
                }
            }
            customElements.define('lite-hooks', LiteHooks);
            const el = document.createElement('lite-hooks');
            container.append(el);
            expect(await el.updateComplete).to.be.true;
            expect(calls).to.deep.equal([
                'willUpdate',
                'firstUpdated',
                'updated',
            ]);
            el.value = 'skip';
            await el.updateComplete;
            expect(calls.length).to.equal(3);
            el.value = 'ok';
            expect(await el.updateComplete).to.be.true;
            expect(calls.length).to.equal(5);
        });

        it('drives reactive controllers through the host lifecycle', async () => {
            const calls = [];
            const key = Symbol('controller');
            class Controller {
                constructor(host) {
                    this.host = host;
                    host.addController(this);
                    host.addController(this);
                }
                hostConnected() {
                    calls.push('connected');
                }
                hostDisconnected() {
                    calls.push('disconnected');
                }
                hostUpdate() {
                    calls.push('update');
                }
                hostUpdated() {
                    calls.push('updated');
                }
            }
            class LiteControlled extends LiteElement {
                controller = new Controller(this);
                render() {
                    return html`${calls.length}`;
                }
            }
            customElements.define('lite-controlled', LiteControlled);
            const el = document.createElement('lite-controlled');
            container.append(el);
            await el.updateComplete;
            expect(calls).to.deep.equal(['connected', 'update', 'updated']);
            el.requestUpdate(key, true);
            await el.updateComplete;
            expect(calls.slice(3)).to.deep.equal(['update', 'updated']);
            el.remove();
            expect(calls.at(-1)).to.equal('disconnected');
            const late = new Controller(el);
            container.append(el);
            expect(calls.slice(-2)).to.deep.equal(['connected', 'connected']);
            el.removeController(late);
            el.remove();
            expect(calls.slice(-1)).to.deep.equal(['disconnected']);
            expect(calls.filter((c) => c === 'disconnected').length).to.equal(
                2,
            );
        });
    });
    for (const [name, Base, tag] of [
        ['LitElement', LitElement, litHtml],
        ['LiteElement', LiteElement, html],
    ]) {
        describe(`internal state reactivity (${name})`, () => {
            const define = (suffix) => {
                const log = [];
                class StateHost extends Base {
                    static properties = {
                        open: { type: Boolean, state: true },
                        count: { type: Number, state: true },
                        derived: { state: true },
                    };

                    constructor() {
                        super();
                        this.open = false;
                        this.count = 0;
                    }

                    willUpdate(changed) {
                        if (changed.has('count')) this.derived = this.count * 2;
                    }

                    updated(changed) {
                        log.push(Object.fromEntries(changed));
                        if (this.count === 1) this.count = 2;
                    }

                    render() {
                        return tag`<p class=${this.open ? 'open' : ''}>${this.count}:${this.derived}</p>`;
                    }
                }
                customElements.define(
                    `state-${name.toLowerCase()}-${suffix}`,
                    StateHost,
                );
                return { el: new StateHost(), log };
            };

            it('re-renders on state change, batches, and has no attribute', async () => {
                const { el, log } = define('a');
                container.append(el);
                await el.updateComplete;
                expect(log.length).to.equal(1);
                el.open = true;
                el.count = 5;
                el.count = 6;
                await el.updateComplete;
                expect(log.length).to.equal(2);
                expect(log[1]).to.deep.equal({
                    open: false,
                    count: 0,
                    derived: 0,
                });
                expect(el.shadowRoot.querySelector('p').className).to.equal(
                    'open',
                );
                expect(el.shadowRoot.textContent).to.equal('6:12');
                expect(el.hasAttribute('open')).to.be.false;
                el.setAttribute('open', '');
                await el.updateComplete;
                expect(el.open).to.be.true;
                expect(log.length).to.equal(2);
            });

            it('skips unchanged values and handles requestUpdate()', async () => {
                const { el, log } = define('b');
                container.append(el);
                await el.updateComplete;
                el.open = false;
                await el.updateComplete;
                expect(log.length).to.equal(1);
                el.requestUpdate();
                await el.updateComplete;
                expect(log[1]).to.deep.equal({});
                el.requestUpdate('count', 9);
                await el.updateComplete;
                expect(log[2]).to.deep.equal({ count: 9 });
            });

            it('runs a follow-up update for state set in updated()', async () => {
                const { el, log } = define('c');
                container.append(el);
                await el.updateComplete;
                el.count = 1;
                expect(await el.updateComplete).to.be.false;
                expect(await el.updateComplete).to.be.true;
                expect(log.length).to.equal(3);
                expect(log[2]).to.deep.equal({ count: 1, derived: 2 });
                expect(el.shadowRoot.textContent).to.equal('2:4');
            });
        });
    }
});

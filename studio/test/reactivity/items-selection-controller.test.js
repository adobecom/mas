import { expect, fixture, html } from '@open-wc/testing';
import { LitElement } from 'lit';
import ItemsSelectionController from '../../src/reactivity/items-selection-controller.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';

class TestHost extends LitElement {
    constructor(options) {
        super();
        this.controller = new ItemsSelectionController(this, options);
    }

    render() {
        return html``;
    }
}
customElements.define('items-selection-controller-test-host', TestHost);

// Custom element upgrade (parsing HTML via `fixture`) always uses a zero-arg
// constructor, so a fixed-options variant is needed to exercise allowUnset: true
// through that path.
class AllowUnsetTestHost extends TestHost {
    constructor() {
        super({ allowUnset: true });
    }
}
customElements.define('items-selection-controller-test-host-allow-unset', AllowUnsetTestHost);

describe('ItemsSelectionController', () => {
    afterEach(() => {
        setItemsSelectionStore(null);
    });

    it('does not read the store at construction time: value starts null', () => {
        setItemsSelectionStore({ name: 'present-at-construction' });

        const host = new TestHost();

        expect(host.controller.value).to.be.null;
    });

    it('captures the active slice on hostConnected', async () => {
        const slice = { name: 'connect-slice' };
        setItemsSelectionStore(slice);
        const host = new TestHost();

        document.body.appendChild(host);

        expect(host.controller.value).to.equal(slice);
        host.remove();
    });

    it('re-captures on every hostConnected, not just the first', async () => {
        const firstSlice = { name: 'first-connect' };
        setItemsSelectionStore(firstSlice);
        const host = await fixture(html`<items-selection-controller-test-host></items-selection-controller-test-host>`);
        expect(host.controller.value).to.equal(firstSlice);

        host.remove();

        const secondSlice = { name: 'second-connect' };
        setItemsSelectionStore(secondSlice);
        document.body.appendChild(host);

        expect(host.controller.value).to.equal(secondSlice);
        host.remove();
    });

    it('does NOT clear its value on hostDisconnected, so teardown still sees the bound slice', async () => {
        const slice = { name: 'teardown-slice' };
        setItemsSelectionStore(slice);
        const host = await fixture(html`<items-selection-controller-test-host></items-selection-controller-test-host>`);

        expect(host.controller.value).to.equal(slice);

        host.remove();
        await host.updateComplete;

        expect(host.controller.value).to.equal(slice);
    });

    it('defaults allowUnset to false: hostConnected throws with no bound slice', () => {
        // connectedCallback is invoked directly (not via appendChild): per the custom
        // elements spec, an exception thrown from connectedCallback during a DOM
        // operation is reported asynchronously rather than propagated to the caller,
        // so appendChild can't be used to observe the throw synchronously here.
        setItemsSelectionStore(null);
        const host = new TestHost();

        expect(() => host.connectedCallback()).to.throw('Items selection store not set');
    });

    it('allowUnset: true tolerates connecting with no bound slice', async () => {
        setItemsSelectionStore(null);
        const host = await fixture(
            html`<items-selection-controller-test-host-allow-unset></items-selection-controller-test-host-allow-unset>`,
        );

        expect(host.controller.value).to.be.null;
        host.remove();
    });
});

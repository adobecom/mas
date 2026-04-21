import { expect } from '@open-wc/testing';
import { PlaceholderOptionsController } from '../../src/controllers/placeholder-options-controller.js';
import { OstStore } from '../../src/store/ost-store.js';

function createMockHost() {
    return {
        controllers: [],
        addController(c) { this.controllers.push(c); },
        removeController() {},
        requestUpdate() {},
    };
}

describe('PlaceholderOptionsController', () => {
    let host;
    let ctrl;
    let store;

    beforeEach(() => {
        host = createMockHost();
        store = new OstStore();
        ctrl = new PlaceholderOptionsController(host, store);
    });

    it('registers itself on the host', () => {
        expect(host.controllers).to.include(ctrl);
    });

    it('initializes with price type and default options', () => {
        expect(ctrl.selectedType).to.equal('price');
        expect(ctrl.options.displayFormatted).to.be.true;
        expect(ctrl.options.displayRecurrence).to.be.true;
        expect(ctrl.options.displayPerUnit).to.be.false;
        expect(ctrl.options.displayTax).to.be.false;
    });

    it('sets type and updates options', () => {
        ctrl.setType('legal');
        expect(ctrl.selectedType).to.equal('legal');
    });

    it('applies displayPlanType override for legal type', () => {
        ctrl.setType('legal');
        const effective = ctrl.getEffectiveOptions();
        expect(effective.displayPlanType).to.be.true;
    });

    it('does not apply displayPlanType for price type', () => {
        ctrl.setType('price');
        const effective = ctrl.getEffectiveOptions();
        expect(effective.displayPlanType).to.be.undefined;
    });

    it('toggles an option', () => {
        expect(ctrl.options.displayTax).to.be.false;
        ctrl.toggleOption('displayTax');
        expect(ctrl.options.displayTax).to.be.true;
        ctrl.toggleOption('displayTax');
        expect(ctrl.options.displayTax).to.be.false;
    });

    it('serializes options for code output', () => {
        ctrl.setType('price');
        const serialized = ctrl.serializeOptions();
        expect(serialized).to.be.a('object');
        expect(serialized.displayFormatted).to.be.true;
        expect(serialized.displayRecurrence).to.be.true;
    });

    it('serialized output includes toggled values', () => {
        ctrl.toggleOption('displayTax');
        const serialized = ctrl.serializeOptions();
        expect(serialized.displayTax).to.be.true;
    });

    it('serialized output includes type overrides for legal', () => {
        ctrl.setType('legal');
        const serialized = ctrl.serializeOptions();
        expect(serialized.displayPlanType).to.be.true;
    });

    it('resets options when changing type', () => {
        ctrl.toggleOption('displayTax');
        expect(ctrl.options.displayTax).to.be.true;
        ctrl.setType('optical');
        expect(ctrl.options.displayTax).to.be.false;
    });

    it('hostConnected and hostDisconnected are callable', () => {
        ctrl.hostConnected();
        ctrl.hostDisconnected();
    });
});

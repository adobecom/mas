export class PlaceholderOptionsController {
    host;
    store;
    selectedType = 'price';
    options = {};

    constructor(host, store) {
        this.host = host;
        this.store = store;
        host.addController(this);
        this.options = { ...store.defaultPlaceholderOptions };
    }

    hostConnected() {}

    hostDisconnected() {}

    setType(type) {
        this.selectedType = type;
        this.options = { ...this.store.defaultPlaceholderOptions };
        this.host.requestUpdate();
    }

    toggleOption(key) {
        this.options[key] = !this.options[key];
        this.host.requestUpdate();
    }

    getEffectiveOptions() {
        const typeConfig = this.store.placeholderTypes.find(
            (t) => t.type === this.selectedType,
        );
        const overrides = typeConfig?.overrides || {};
        return { ...this.options, ...overrides };
    }

    serializeOptions() {
        return { ...this.getEffectiveOptions() };
    }
}

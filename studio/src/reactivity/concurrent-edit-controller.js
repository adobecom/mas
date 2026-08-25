const PRESENCE_URL = 'wss://mas-presence.mas-presence.workers.dev';

export default class ConcurrentEditController {
    #ws = null;
    #users = [];

    constructor(host) {
        this.host = host;
        host.addController(this);
    }

    hostConnected() {}

    hostDisconnected() {
        this.disconnect();
    }

    connect(fragmentId, user) {
        this.disconnect();
        const params = new URLSearchParams({ name: user.name, email: user.email });
        this.#ws = new WebSocket(
            `${PRESENCE_URL}/fragment/${fragmentId}?${params}`,
        );
        this.#ws.onmessage = (e) => {
            const { type, users } = JSON.parse(e.data);
            if (type === 'presence') {
                this.#users = users;
                this.host.requestUpdate();
            }
        };
        this.#ws.onclose = () => {
            this.#users = [];
            this.host.requestUpdate();
        };
    }

    disconnect() {
        this.#ws?.close();
        this.#ws = null;
        this.#users = [];
        this.host.requestUpdate();
    }

    get editors() {
        return this.#users;
    }
}

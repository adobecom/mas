import { LitElement } from 'lit';
import { getInvestigationSession } from './investigation-session.js';

/** Binds an element to its conversation's investigation session: re-renders on change and polls while it needs to. */
export class MasaSessionElement extends LitElement {
    static properties = {
        conversationId: { type: String },
        controller: { attribute: false },
    };

    constructor() {
        super();
        this.controller = null;
        this.activeController = null;
        this.detach = null;
        this.onChange = () => this.requestUpdate();
    }

    get shouldPoll() {
        return false;
    }

    get blocked() {
        return this.activeController.blocked;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.activeController) this.subscribe();
    }

    willUpdate(changed) {
        if (changed.has('conversationId') || changed.has('controller')) {
            this.unsubscribe();
            this.activeController = this.controller ?? getInvestigationSession(this.conversationId);
            this.subscribe();
        }
    }

    updated() {
        this.updateComplete.then(() => this.syncPolling());
    }

    /** Attaching ticks synchronously and notifies, so it must run after the update that requested it. */
    syncPolling() {
        if (!this.isConnected) return;
        if (this.shouldPoll && !this.detach) this.detach = this.activeController.attach();
        else if (!this.shouldPoll && this.detach) this.stopPolling();
    }

    subscribe() {
        this.activeController.addEventListener('change', this.onChange);
    }

    stopPolling() {
        this.detach?.();
        this.detach = null;
    }

    unsubscribe() {
        this.stopPolling();
        this.activeController?.removeEventListener('change', this.onChange);
    }

    disconnectedCallback() {
        this.unsubscribe();
        super.disconnectedCallback();
    }
}

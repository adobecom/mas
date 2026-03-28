import { LitElement, html, nothing } from 'lit';
import './mas-chat.js';
import './mas-chat-session-selector.js';

const STORAGE_KEY = 'mas-chat-drawer-width';
const MIN_WIDTH = 320;
const MAX_WIDTH_RATIO = 0.8;
const CLOSE_DURATION = 200;

export class MasChatDrawer extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        closing: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.closing = false;
        this.drawerWidth = parseInt(localStorage.getItem(STORAGE_KEY), 10) || 440;
        this.resizing = false;
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    close() {
        this.closing = true;
        setTimeout(() => {
            this.closing = false;
            this.open = false;
            this.dispatchEvent(
                new CustomEvent('chat-drawer-toggle', {
                    detail: { open: false },
                    bubbles: true,
                    composed: true,
                }),
            );
        }, CLOSE_DURATION);
    }

    handleResizeStart(e) {
        e.preventDefault();
        this.resizing = true;
        this.startX = e.clientX;
        this.startWidth = this.drawerWidth;
        document.addEventListener('mousemove', this.boundHandleMouseMove);
        document.addEventListener('mouseup', this.boundHandleMouseUp);
        document.body.classList.add('chat-resizing');
    }

    handleMouseMove(e) {
        if (!this.resizing) return;
        const delta = this.startX - e.clientX;
        const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
        const newWidth = Math.min(Math.max(this.startWidth + delta, MIN_WIDTH), maxWidth);
        this.drawerWidth = newWidth;
    }

    handleMouseUp() {
        this.resizing = false;
        document.removeEventListener('mousemove', this.boundHandleMouseMove);
        document.removeEventListener('mouseup', this.boundHandleMouseUp);
        document.body.classList.remove('chat-resizing');
        localStorage.setItem(STORAGE_KEY, String(this.drawerWidth));
    }

    relaySessionEvent(event) {
        const chat = this.querySelector('mas-chat');
        if (chat) {
            chat.dispatchEvent(
                new CustomEvent(event.type, {
                    detail: event.detail,
                    bubbles: false,
                }),
            );
        }
    }

    render() {
        if (!this.open && !this.closing) return nothing;

        return html`
            <div
                class="chat-drawer ${this.closing ? 'chat-drawer-closing' : ''}"
                style="--chat-drawer-width: ${this.drawerWidth}px"
            >
                <div class="chat-drawer-resize" @mousedown=${this.handleResizeStart}></div>
                <div
                    class="chat-drawer-header"
                    @session-changed=${this.relaySessionEvent}
                    @session-cleared=${this.relaySessionEvent}
                >
                    <h3>AI Assistant</h3>
                    <div class="chat-drawer-header-actions">
                        <mas-chat-session-selector></mas-chat-session-selector>
                        <sp-action-button quiet size="s" @click=${this.close} title="Close">
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>
                    </div>
                </div>
                <div class="chat-drawer-body">
                    <mas-chat></mas-chat>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-chat-drawer', MasChatDrawer);

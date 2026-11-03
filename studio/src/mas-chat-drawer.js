import { LitElement, html, nothing } from 'lit';
import './mas-chat.js';
import './mas-chat-session-selector.js';

const STORAGE_KEY = 'mas-chat-drawer-width';
const MIN_WIDTH = 320;
const MAX_WIDTH_RATIO = 0.8;
const CLOSE_DURATION = 300;

export class MasChatDrawer extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        closing: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.closing = false;
        this.drawerWidth = 440;
        try {
            this.drawerWidth = parseInt(localStorage.getItem(STORAGE_KEY), 10) || this.drawerWidth;
        } catch (error) {
            if (error.name !== 'SecurityError' && error.name !== 'QuotaExceededError') throw error;
        }
        this.widthStyleSheet = new CSSStyleSheet();
        this.widthScope = crypto.randomUUID();
        this.widthStyleSheet.replaceSync(`[data-chat-drawer="${this.widthScope}"] {}`);
        this.updateWidthStyle();
        this.resizing = false;
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.dataset.chatDrawer = this.widthScope;
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.widthStyleSheet];
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.handleMouseUp();
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== this.widthStyleSheet);
    }

    updateWidthStyle() {
        this.widthStyleSheet.cssRules[0].style.setProperty('--chat-drawer-width', `${this.drawerWidth}px`);
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
        this.classList.add('chat-resizing');
    }

    handleMouseMove(e) {
        if (!this.resizing) return;
        const delta = this.startX - e.clientX;
        const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
        const newWidth = Math.min(Math.max(this.startWidth + delta, MIN_WIDTH), maxWidth);
        this.drawerWidth = newWidth;
        this.updateWidthStyle();
    }

    handleMouseUp() {
        const wasResizing = this.resizing;
        this.resizing = false;
        document.removeEventListener('mousemove', this.boundHandleMouseMove);
        document.removeEventListener('mouseup', this.boundHandleMouseUp);
        this.classList.remove('chat-resizing');
        if (!wasResizing) return;
        try {
            localStorage.setItem(STORAGE_KEY, String(this.drawerWidth));
        } catch (error) {
            if (error.name !== 'SecurityError' && error.name !== 'QuotaExceededError') throw error;
        }
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
            <div class="chat-backdrop ${this.closing ? 'chat-backdrop-closing' : ''}" @click=${this.close}></div>
            <div class="chat-drawer ${this.closing ? 'chat-drawer-closing' : ''}">
                <div class="chat-drawer-resize" @mousedown=${this.handleResizeStart}></div>
                <div
                    class="chat-drawer-header"
                    @session-changed=${this.relaySessionEvent}
                    @session-cleared=${this.relaySessionEvent}
                >
                    <h3>MASA</h3>
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

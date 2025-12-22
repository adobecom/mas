import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-quick-actions.css.js';
import { QUICK_ACTION } from './constants.js';

const ACTION_CONFIG = {
    [QUICK_ACTION.SAVE]: {
        icon: 'sp-icon-save-floppy',
        title: 'Save',
    },
    [QUICK_ACTION.DUPLICATE]: {
        icon: 'sp-icon-duplicate',
        title: 'Duplicate',
    },
    [QUICK_ACTION.PUBLISH]: {
        icon: 'sp-icon-publish',
        title: 'Publish',
    },
    [QUICK_ACTION.CANCEL]: {
        icon: 'sp-icon-publish-remove',
        title: 'Cancel',
    },
    [QUICK_ACTION.COPY]: {
        icon: 'sp-icon-code',
        title: 'Copy code',
    },
    [QUICK_ACTION.LOCK]: {
        icon: 'sp-icon-lock-closed',
        title: 'Lock',
    },
    [QUICK_ACTION.DISCARD]: {
        icon: 'sp-icon-undo',
        title: 'Discard',
    },
    [QUICK_ACTION.DELETE]: {
        icon: 'sp-icon-delete',
        title: 'Delete',
        className: 'delete-action',
    },
};

class MasQuickActions extends LitElement {
    static styles = styles;

    static properties = {
        isDraggable: { type: Boolean },
        actions: { type: Array },
        disabled: { type: Set },
        _dragging: { type: Boolean, state: true },
    };

    #posX = null;
    #posY = null;
    #startX = 0;
    #startY = 0;
    #initialX = 0;
    #initialY = 0;

    constructor() {
        super();
        this.isDraggable = true;
        this.actions = [];
        this.disabled = new Set();
        this._dragging = false;
    }

    #getEventCoordinates(e) {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    }

    #handleDragStart(e) {
        if (!this.isDraggable) return;
        e.preventDefault();
        this._dragging = true;
        const { clientX, clientY } = this.#getEventCoordinates(e);
        this.#startX = clientX;
        this.#startY = clientY;
        const toolbar = this.shadowRoot?.querySelector('.quick-actions-toolbar');
        if (toolbar) {
            const rect = toolbar.getBoundingClientRect();
            this.#initialX = rect.left + rect.width / 2;
            this.#initialY = window.innerHeight - rect.bottom;
        }
        document.addEventListener('mousemove', this.#handleDrag);
        document.addEventListener('mouseup', this.#handleDragEnd);
        document.addEventListener('touchmove', this.#handleDrag, { passive: false });
        document.addEventListener('touchend', this.#handleDragEnd);
    }

    #handleDrag = (e) => {
        if (!this._dragging) return;
        e.preventDefault();
        const { clientX, clientY } = this.#getEventCoordinates(e);
        const deltaX = clientX - this.#startX;
        const deltaY = clientY - this.#startY;
        let newX = this.#initialX + deltaX;
        let newY = this.#initialY - deltaY;
        const toolbar = this.shadowRoot?.querySelector('.quick-actions-toolbar');
        if (toolbar) {
            const rect = toolbar.getBoundingClientRect();
            const halfWidth = rect.width / 2;
            const height = rect.height;
            newX = Math.max(halfWidth, Math.min(newX, window.innerWidth - halfWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - height - 24));
        }
        this.#posX = newX;
        this.#posY = newY;
        this.requestUpdate();
    };

    #handleDragEnd = () => {
        this._dragging = false;
        document.removeEventListener('mousemove', this.#handleDrag);
        document.removeEventListener('mouseup', this.#handleDragEnd);
        document.removeEventListener('touchmove', this.#handleDrag);
        document.removeEventListener('touchend', this.#handleDragEnd);
    };

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#handleDragEnd();
    }

    resetPosition() {
        this.#posX = null;
        this.#posY = null;
        this.requestUpdate();
    }

    get dragHandle() {
        if (!this.isDraggable) return nothing;
        return html`
            <div
                class="drag-handle"
                title="Drag to reposition"
                @mousedown=${(e) => this.#handleDragStart(e)}
                @touchstart=${(e) => this.#handleDragStart(e)}
            >
                <svg
                    id="Layer_1"
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 18 18"
                >
                    <defs>
                        <style>
                            .fill {
                                fill: #464646;
                            }
                        </style>
                    </defs>

                    <rect id="Canvas" fill="#ff13dc" opacity="0" width="18" height="18" />

                    <circle class="fill" cx="7" cy="13" r="1" />
                    <circle class="fill" cx="7" cy="10" r="1" />
                    <circle class="fill" cx="7" cy="7" r="1" />
                    <circle class="fill" cx="7" cy="4" r="1" />

                    <circle class="fill" cx="10" cy="13" r="1" />
                    <circle class="fill" cx="10" cy="10" r="1" />
                    <circle class="fill" cx="10" cy="7" r="1" />
                    <circle class="fill" cx="10" cy="4" r="1" />
                </svg>
            </div>
        `;
    }

    renderIcon(iconName) {
        switch (iconName) {
            case 'sp-icon-save-floppy':
                return html`<sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>`;
            case 'sp-icon-duplicate':
                return html`<sp-icon-duplicate slot="icon"></sp-icon-duplicate>`;
            case 'sp-icon-publish':
                return html`<sp-icon-publish slot="icon"></sp-icon-publish>`;
            case 'sp-icon-publish-remove':
                return html`<sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>`;
            case 'sp-icon-code':
                return html`<sp-icon-code slot="icon"></sp-icon-code>`;
            case 'sp-icon-lock-closed':
                return html`<sp-icon-lock-closed slot="icon"></sp-icon-lock-closed>`;
            case 'sp-icon-undo':
                return html`<sp-icon-undo slot="icon"></sp-icon-undo>`;
            case 'sp-icon-delete':
                return html`<sp-icon-delete slot="icon"></sp-icon-delete>`;
            default:
                return nothing;
        }
    }

    renderAction(action) {
        const config = ACTION_CONFIG[action];
        if (!config) return nothing;
        return html`
            <sp-action-button
                class="${config.className || ''}"
                title="${config.title}"
                ?disabled=${this.disabled.has(action)}
                @click="${() => this.dispatchEvent(new CustomEvent(action, { bubbles: true, composed: true }))}"
            >
                ${this.renderIcon(config.icon)}
            </sp-action-button>
        `;
    }

    get #positionStyles() {
        if (!this.isDraggable || (this.#posX === null && this.#posY === null)) {
            return '';
        }
        const styles = [];
        if (this.#posX !== null) {
            styles.push(`left: ${this.#posX}px`);
            styles.push('transform: translateX(-50%)');
        }
        if (this.#posY !== null) {
            styles.push(`bottom: ${this.#posY}px`);
        }
        return styles.join('; ');
    }

    render() {
        const draggingClass = this._dragging ? 'dragging' : '';
        const positionStyle = this.#positionStyles;
        return html`
            <div class="quick-actions-toolbar ${draggingClass}" style="${positionStyle}">
                ${this.dragHandle}
                <div class="actions">${this.actions.map((action) => this.renderAction(action))}</div>
            </div>
        `;
    }
}

customElements.define('mas-quick-actions', MasQuickActions);

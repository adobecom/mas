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
    [QUICK_ACTION.LOC]: {
        icon: 'custom-icon-send-to-loc',
        title: 'Send to Localization',
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

    get sendToLocIcon() {
        return html`<sp-icon slot="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path
                    d="M19.0576 14.6934L11.0576 11.0977C10.8008 10.9815 10.502 11.0186 10.2813 11.1954C10.0615 11.3711 9.95901 11.6553 10.0147 11.9307L10.7217 15.3965L10.042 18.8555C9.98831 19.1309 10.0928 19.4141 10.3135 19.5879C10.4483 19.6954 10.6123 19.75 10.7783 19.75C10.8838 19.75 10.9893 19.7276 11.0889 19.6827L19.0606 16.0596C19.3281 15.9375 19.501 15.67 19.5 15.375C19.499 15.0811 19.3262 14.8135 19.0576 14.6934ZM15.5396 14.7564L12.1243 14.7666L11.7774 13.0655L15.5396 14.7564ZM12.1287 16.0166L15.5523 16.0064L11.7949 17.7139L12.1287 16.0166Z"
                    fill="currentColor"
                />
                <path
                    d="M7.54688 18H4.25C3.00977 18 2 16.9902 2 15.75V4.25C2 3.00977 3.00977 2 4.25 2H15.75C16.9902 2 18 3.00977 18 4.25V11.3965C18 11.8105 17.6641 12.1465 17.25 12.1465C16.8359 12.1465 16.5 11.8105 16.5 11.3965V4.25C16.5 3.83691 16.1631 3.5 15.75 3.5H4.25C3.83691 3.5 3.5 3.83691 3.5 4.25V15.75C3.5 16.1631 3.83691 16.5 4.25 16.5H7.54688C7.96094 16.5 8.29688 16.8359 8.29688 17.25C8.29688 17.6641 7.96094 18 7.54688 18Z"
                    fill="currentColor"
                />
                <path
                    d="M6.7627 9.5H5.7627C5.34864 9.5 5.0127 9.16406 5.0127 8.75C5.0127 8.33594 5.34864 8 5.7627 8H6.7627C7.17676 8 7.5127 8.33594 7.5127 8.75C7.5127 9.16406 7.17676 9.5 6.7627 9.5Z"
                    fill="currentColor"
                />
                <path
                    d="M14.2627 9.5H9.7627C9.34864 9.5 9.0127 9.16406 9.0127 8.75C9.0127 8.33594 9.34864 8 9.7627 8H14.2627C14.6768 8 15.0127 8.33594 15.0127 8.75C15.0127 9.16406 14.6768 9.5 14.2627 9.5Z"
                    fill="currentColor"
                />
                <path
                    d="M6.7627 6.5H5.7627C5.34864 6.5 5.0127 6.16406 5.0127 5.75C5.0127 5.33594 5.34864 5 5.7627 5H6.7627C7.17676 5 7.5127 5.33594 7.5127 5.75C7.5127 6.16406 7.17676 6.5 6.7627 6.5Z"
                    fill="currentColor"
                />
                <path
                    d="M14.2627 6.5H9.7627C9.34864 6.5 9.0127 6.16406 9.0127 5.75C9.0127 5.33594 9.34864 5 9.7627 5H14.2627C14.6768 5 15.0127 5.33594 15.0127 5.75C15.0127 6.16406 14.6768 6.5 14.2627 6.5Z"
                    fill="currentColor"
                />
                <path
                    d="M6.7627 12.5H5.7627C5.34864 12.5 5.0127 12.1641 5.0127 11.75C5.0127 11.3359 5.34864 11 5.7627 11H6.7627C7.17676 11 7.5127 11.3359 7.5127 11.75C7.5127 12.1641 7.17676 12.5 6.7627 12.5Z"
                    fill="currentColor"
                />
            </svg>
        </sp-icon>`;
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
            case 'custom-icon-send-to-loc':
                return this.sendToLocIcon;
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

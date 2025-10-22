import { LitElement, html } from 'lit';
import sessionManager from './services/chat-session-manager.js';
import { showToast } from './utils.js';

export class MasChatSessionSelector extends LitElement {
    static properties = {
        activeSessionId: { type: String },
        sessions: { type: Array },
        isOpen: { type: Boolean },
    };

    constructor() {
        super();
        this.activeSessionId = null;
        this.sessions = [];
        this.isOpen = false;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadSessions();
    }

    loadSessions() {
        this.sessions = sessionManager.listSessions();
        this.activeSessionId = sessionManager.getActiveSessionId();
    }

    handleNewSession() {
        try {
            const newSession = sessionManager.createSession();
            this.loadSessions();
            this.dispatchEvent(
                new CustomEvent('session-changed', {
                    detail: { sessionId: newSession.id },
                    bubbles: true,
                    composed: true,
                }),
            );
            showToast('New chat session created', 'positive');
        } catch (error) {
            showToast(error.message, 'negative');
        }
    }

    handleSessionSelect(sessionId) {
        if (sessionId === this.activeSessionId) {
            this.isOpen = false;
            return;
        }

        try {
            sessionManager.setActiveSession(sessionId);
            this.loadSessions();
            this.dispatchEvent(
                new CustomEvent('session-changed', {
                    detail: { sessionId },
                    bubbles: true,
                    composed: true,
                }),
            );
            this.isOpen = false;
        } catch (error) {
            showToast(`Failed to switch session: ${error.message}`, 'negative');
        }
    }

    handleDeleteSession(event, sessionId) {
        event.stopPropagation();

        const session = sessionManager.getSession(sessionId);
        if (!session) return;

        const dialog = document.querySelector('mas-confirm-dialog');
        if (!dialog) return;

        dialog.open({
            title: 'Delete Chat Session',
            message: `Are you sure you want to delete "${session.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () => {
                try {
                    const newActiveSessionId = sessionManager.deleteSession(sessionId);
                    this.loadSessions();

                    if (sessionId === this.activeSessionId) {
                        this.dispatchEvent(
                            new CustomEvent('session-changed', {
                                detail: { sessionId: newActiveSessionId },
                                bubbles: true,
                                composed: true,
                            }),
                        );
                    }

                    showToast('Session deleted', 'positive');
                } catch (error) {
                    showToast(`Failed to delete session: ${error.message}`, 'negative');
                }
            },
        });
    }

    handleRenameSession(event, sessionId) {
        event.stopPropagation();

        const session = sessionManager.getSession(sessionId);
        if (!session) return;

        const newName = prompt('Enter new session name:', session.name);
        if (!newName || newName === session.name) return;

        try {
            sessionManager.renameSession(sessionId, newName);
            this.loadSessions();
            showToast('Session renamed', 'positive');
        } catch (error) {
            showToast(`Failed to rename session: ${error.message}`, 'negative');
        }
    }

    handleClearSession(event, sessionId) {
        event.stopPropagation();

        const session = sessionManager.getSession(sessionId);
        if (!session) return;

        const dialog = document.querySelector('mas-confirm-dialog');
        if (!dialog) return;

        dialog.open({
            title: 'Clear Chat History',
            message: `Clear all messages in "${session.name}"? The session will be kept but the conversation will be reset.`,
            confirmText: 'Clear',
            onConfirm: () => {
                try {
                    sessionManager.clearSession(sessionId);
                    this.loadSessions();

                    if (sessionId === this.activeSessionId) {
                        this.dispatchEvent(
                            new CustomEvent('session-cleared', {
                                detail: { sessionId },
                                bubbles: true,
                                composed: true,
                            }),
                        );
                    }

                    showToast('Chat history cleared', 'positive');
                } catch (error) {
                    showToast(`Failed to clear session: ${error.message}`, 'negative');
                }
            },
        });
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
    }

    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;

        return date.toLocaleDateString();
    }

    renderSessionItem(session) {
        const isActive = session.id === this.activeSessionId;
        const messageCount = session.messages?.length || 0;

        return html`
            <div class="session-item ${isActive ? 'active' : ''}" @click=${() => this.handleSessionSelect(session.id)}>
                <div class="session-info">
                    <div class="session-name">${session.name}</div>
                    <div class="session-meta">
                        ${messageCount} message${messageCount !== 1 ? 's' : ''} • ${this.formatDate(session.updatedAt)}
                    </div>
                </div>
                <div class="session-actions" @click=${(e) => e.stopPropagation()}>
                    <sp-action-button
                        quiet
                        size="s"
                        title="Rename session"
                        @click=${(e) => this.handleRenameSession(e, session.id)}
                    >
                        <sp-icon-edit slot="icon"></sp-icon-edit>
                    </sp-action-button>
                    <sp-action-button
                        quiet
                        size="s"
                        title="Clear conversation"
                        @click=${(e) => this.handleClearSession(e, session.id)}
                    >
                        <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
                    </sp-action-button>
                    <sp-action-button
                        quiet
                        size="s"
                        title="Delete session"
                        @click=${(e) => this.handleDeleteSession(e, session.id)}
                    >
                        <sp-icon-close slot="icon"></sp-icon-close>
                    </sp-action-button>
                </div>
            </div>
        `;
    }

    render() {
        const activeSession = this.sessions.find((s) => s.id === this.activeSessionId);
        const sessionCount = this.sessions.length;

        return html`
            <div class="chat-session-selector">
                <sp-action-button class="session-selector-trigger" quiet @click=${this.toggleDropdown} title="Chat sessions">
                    <sp-icon-chat slot="icon"></sp-icon-chat>
                    <span class="session-trigger-text">
                        ${activeSession ? activeSession.name : 'No session'}
                        ${sessionCount > 1 ? html`<span class="session-count">(${sessionCount})</span>` : ''}
                    </span>
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>

                ${this.isOpen
                    ? html`
                          <div class="session-dropdown" @click=${(e) => e.stopPropagation()}>
                              <div class="session-dropdown-header">
                                  <h3>Chat Sessions</h3>
                                  <sp-action-button
                                      size="s"
                                      @click=${this.handleNewSession}
                                      ?disabled=${sessionManager.isAtMaxSessions()}
                                      title=${sessionManager.isAtMaxSessions()
                                          ? 'Maximum sessions reached'
                                          : 'Create new session'}
                                  >
                                      <sp-icon-add slot="icon"></sp-icon-add>
                                      New Chat
                                  </sp-action-button>
                              </div>
                              <div class="session-list">
                                  ${this.sessions.length === 0
                                      ? html`<div class="empty-state">No chat sessions yet</div>`
                                      : this.sessions.map((session) => this.renderSessionItem(session))}
                              </div>
                              ${sessionManager.isAtMaxSessions()
                                  ? html`
                                        <div class="session-limit-warning">
                                            <sp-icon-alert slot="icon"></sp-icon-alert>
                                            Maximum sessions reached. Delete some sessions to create new ones.
                                        </div>
                                    `
                                  : ''}
                          </div>
                      `
                    : ''}
            </div>
        `;
    }
}

customElements.define('mas-chat-session-selector', MasChatSessionSelector);

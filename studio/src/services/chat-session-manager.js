const STORAGE_KEY = 'mas-chat-sessions';
const MAX_SESSIONS = 20;
const DEBOUNCE_DELAY = 500;

const DEFAULT_DATA = Object.freeze({ sessions: {}, activeSessionId: null });

/**
 * Whitelist of safe `operationType` values that are display discriminators only,
 * used by <mas-operation-result> to pick the right renderer for historical
 * results. Any value outside this set is dropped during sanitization.
 */
const SAFE_OPERATION_TYPES = new Set([
    'search',
    'search_cards',
    'publish',
    'publish_card',
    'unpublish',
    'unpublish_card',
    'copy',
    'copy_card',
    'delete',
    'delete_card',
    'update',
    'update_card',
    'get',
    'get_card',
    'bulk_update',
    'bulk_update_cards',
    'bulk_publish',
    'bulk_publish_cards',
    'bulk_delete',
    'bulk_delete_cards',
    'get_variations',
    'resolve_offer_selector',
    'create_release_cards',
]);

/**
 * Sanitize a single message before exposing it to the UI.
 * Strips execution metadata (mcpOperation, confirmationRequired, operation) so
 * historical messages cannot be replayed as live operations. `operationType` is
 * preserved only when it is in the whitelist of safe render discriminators
 * (needed so the "cards created" container and other result views survive
 * session reload). This is a defense against malicious localStorage writes
 * (audit M3).
 */
function sanitizeMessage(message) {
    if (!message || typeof message !== 'object') return null;
    const { mcpOperation, operationType, confirmationRequired, operation, ...safe } = message;
    if (typeof operationType === 'string' && SAFE_OPERATION_TYPES.has(operationType)) {
        safe.operationType = operationType;
    }
    return safe;
}

/**
 * Validate that a session has the minimum shape required by the UI and
 * return a sanitized copy. Returns null for invalid sessions.
 *
 * `messages` and `conversationHistory` may be missing on legitimate sessions
 * (e.g. a freshly-created session that hasn't been saved with messages yet);
 * those are coerced to empty arrays. Sessions with non-array `messages` are
 * rejected as malformed.
 */
function sanitizeSession(session) {
    if (!session || typeof session !== 'object') return null;
    if (typeof session.id !== 'string' || session.id.length === 0) return null;
    if (session.messages !== undefined && !Array.isArray(session.messages)) return null;
    const messages = Array.isArray(session.messages) ? session.messages.map(sanitizeMessage).filter(Boolean) : [];
    return {
        ...session,
        messages,
        conversationHistory: Array.isArray(session.conversationHistory) ? session.conversationHistory : [],
    };
}

/**
 * Validate the top-level storage shape, drop invalid sessions, sanitize
 * surviving sessions, and return a clean data object. Never throws.
 */
function sanitizeData(raw) {
    if (!raw || typeof raw !== 'object' || !raw.sessions || typeof raw.sessions !== 'object') {
        return { sessions: {}, activeSessionId: null };
    }
    const sessions = {};
    for (const [key, value] of Object.entries(raw.sessions)) {
        const safe = sanitizeSession(value);
        if (safe) sessions[key] = safe;
    }
    const activeSessionId =
        typeof raw.activeSessionId === 'string' && sessions[raw.activeSessionId] ? raw.activeSessionId : null;
    return { sessions, activeSessionId };
}

export class ChatSessionManager {
    constructor() {
        this.debounceTimers = new Map();
        this.initializeStorage();
    }

    initializeStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
        }
    }

    getData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { sessions: {}, activeSessionId: null };
        try {
            return sanitizeData(JSON.parse(stored));
        } catch {
            // Preserve corrupt data in storage so a developer can recover it
            // manually; surface the default to the UI without destroying state.
            return { sessions: {}, activeSessionId: null };
        }
    }

    saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    generateSessionName(firstMessage) {
        if (!firstMessage) {
            return `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        const preview = firstMessage.substring(0, 40);
        return firstMessage.length > 40 ? `${preview}...` : preview;
    }

    createSession(name) {
        const data = this.getData();

        const sessionCount = Object.keys(data.sessions).length;
        if (sessionCount >= MAX_SESSIONS) {
            throw new Error(`Maximum number of sessions (${MAX_SESSIONS}) reached. Please delete some sessions first.`);
        }

        const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const session = {
            id: sessionId,
            name: name || 'New Chat',
            messages: [],
            conversationHistory: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        data.sessions[sessionId] = session;
        data.activeSessionId = sessionId;
        this.saveData(data);

        return session;
    }

    getSession(sessionId) {
        const data = this.getData();
        return data.sessions[sessionId] || null;
    }

    getActiveSession() {
        const data = this.getData();
        if (!data.activeSessionId) {
            return this.createSession();
        }
        return data.sessions[data.activeSessionId] || this.createSession();
    }

    updateSession(sessionId, updates) {
        const data = this.getData();
        const session = data.sessions[sessionId];

        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        Object.assign(session, updates, { updatedAt: Date.now() });
        this.saveData(data);

        return session;
    }

    updateSessionDebounced(sessionId, updates) {
        if (this.debounceTimers.has(sessionId)) {
            clearTimeout(this.debounceTimers.get(sessionId));
        }

        const timer = setTimeout(() => {
            this.updateSession(sessionId, updates);
            this.debounceTimers.delete(sessionId);
        }, DEBOUNCE_DELAY);

        this.debounceTimers.set(sessionId, timer);
    }

    deleteSession(sessionId) {
        const data = this.getData();

        if (!data.sessions[sessionId]) {
            throw new Error(`Session ${sessionId} not found`);
        }

        delete data.sessions[sessionId];

        if (data.activeSessionId === sessionId) {
            const remainingSessions = Object.keys(data.sessions);
            data.activeSessionId = remainingSessions.length > 0 ? remainingSessions[0] : null;
        }

        this.saveData(data);

        return data.activeSessionId;
    }

    listSessions() {
        const data = this.getData();
        return Object.values(data.sessions).sort((a, b) => b.updatedAt - a.updatedAt);
    }

    setActiveSession(sessionId) {
        const data = this.getData();

        if (!data.sessions[sessionId]) {
            throw new Error(`Session ${sessionId} not found`);
        }

        data.activeSessionId = sessionId;
        this.saveData(data);

        return data.sessions[sessionId];
    }

    getActiveSessionId() {
        const data = this.getData();
        return data.activeSessionId;
    }

    renameSession(sessionId, newName) {
        if (!newName || !newName.trim()) {
            throw new Error('Session name cannot be empty');
        }

        return this.updateSession(sessionId, { name: newName.trim() });
    }

    clearSession(sessionId) {
        return this.updateSession(sessionId, { messages: [], conversationHistory: [] });
    }

    getSessionCount() {
        const data = this.getData();
        return Object.keys(data.sessions).length;
    }

    isAtMaxSessions() {
        return this.getSessionCount() >= MAX_SESSIONS;
    }
}

export default new ChatSessionManager();

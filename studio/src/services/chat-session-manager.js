const STORAGE_KEY = 'mas-chat-sessions';
const MAX_SESSIONS = 20;
const DEBOUNCE_DELAY = 500;

export class ChatSessionManager {
    constructor() {
        this.debounceTimers = new Map();
        this.initializeStorage();
    }

    initializeStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            const initialData = {
                sessions: {},
                activeSessionId: null,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        }
    }

    getData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { sessions: {}, activeSessionId: null };
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

    clearSession(sessionId) {
        return this.updateSession(sessionId, {
            messages: [],
            conversationHistory: [],
        });
    }

    renameSession(sessionId, newName) {
        if (!newName || !newName.trim()) {
            throw new Error('Session name cannot be empty');
        }

        return this.updateSession(sessionId, { name: newName.trim() });
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

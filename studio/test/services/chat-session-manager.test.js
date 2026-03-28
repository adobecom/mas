import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { ChatSessionManager } from '../../src/services/chat-session-manager.js';

const STORAGE_KEY = 'mas-chat-sessions';
const MAX_SESSIONS = 20;

describe('ChatSessionManager', () => {
    let sandbox;
    let manager;
    let storage;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        storage = {};
        sandbox.stub(localStorage, 'getItem').callsFake((key) => {
            return storage[key] ?? null;
        });
        sandbox.stub(localStorage, 'setItem').callsFake((key, value) => {
            storage[key] = value;
        });
        manager = new ChatSessionManager();
    });

    afterEach(() => {
        sandbox.restore();
    });

    function getStoredData() {
        return JSON.parse(storage[STORAGE_KEY]);
    }

    describe('initializeStorage', () => {
        it('creates initial data when storage is empty', () => {
            const data = getStoredData();
            expect(data.sessions).to.deep.equal({});
            expect(data.activeSessionId).to.equal(null);
        });

        it('preserves existing data in storage', () => {
            const existing = {
                sessions: { 'session-1': { id: 'session-1', name: 'Existing' } },
                activeSessionId: 'session-1',
            };
            storage[STORAGE_KEY] = JSON.stringify(existing);
            const freshManager = new ChatSessionManager();
            const data = freshManager.getData();
            expect(data.sessions['session-1'].name).to.equal('Existing');
            expect(data.activeSessionId).to.equal('session-1');
        });
    });

    describe('createSession', () => {
        it('creates a session with a unique ID', () => {
            const session = manager.createSession();
            expect(session.id).to.be.a('string');
            expect(session.id).to.match(/^session-\d+-[a-z0-9]+$/);
        });

        it('uses default name when none provided', () => {
            const session = manager.createSession();
            expect(session.name).to.equal('New Chat');
        });

        it('uses provided name', () => {
            const session = manager.createSession('My Session');
            expect(session.name).to.equal('My Session');
        });

        it('initializes with empty messages and conversationHistory', () => {
            const session = manager.createSession();
            expect(session.messages).to.deep.equal([]);
            expect(session.conversationHistory).to.deep.equal([]);
        });

        it('sets createdAt and updatedAt timestamps', () => {
            const before = Date.now();
            const session = manager.createSession();
            const after = Date.now();
            expect(session.createdAt).to.be.at.least(before);
            expect(session.createdAt).to.be.at.most(after);
            expect(session.updatedAt).to.equal(session.createdAt);
        });

        it('sets the new session as active', () => {
            const session = manager.createSession();
            const data = getStoredData();
            expect(data.activeSessionId).to.equal(session.id);
        });

        it('persists session to localStorage', () => {
            const session = manager.createSession();
            const data = getStoredData();
            expect(data.sessions[session.id]).to.deep.equal(session);
        });

        it('creates unique IDs for multiple sessions', () => {
            const session1 = manager.createSession();
            const session2 = manager.createSession();
            expect(session1.id).to.not.equal(session2.id);
        });

        it('throws when maximum sessions reached', () => {
            for (let i = 0; i < MAX_SESSIONS; i++) {
                manager.createSession(`Session ${i}`);
            }
            expect(() => manager.createSession()).to.throw(`Maximum number of sessions (${MAX_SESSIONS}) reached`);
        });
    });

    describe('getSession', () => {
        it('retrieves an existing session by ID', () => {
            const created = manager.createSession('Test');
            const retrieved = manager.getSession(created.id);
            expect(retrieved).to.deep.equal(created);
        });

        it('returns null for non-existent session ID', () => {
            const result = manager.getSession('non-existent-id');
            expect(result).to.equal(null);
        });
    });

    describe('getActiveSession', () => {
        it('returns the currently active session', () => {
            const session = manager.createSession('Active');
            const active = manager.getActiveSession();
            expect(active.id).to.equal(session.id);
        });

        it('creates a new session when no active session exists', () => {
            const data = manager.getData();
            data.activeSessionId = null;
            manager.saveData(data);
            const active = manager.getActiveSession();
            expect(active).to.have.property('id');
            expect(active.name).to.equal('New Chat');
        });

        it('creates a new session when active ID references missing session', () => {
            const data = manager.getData();
            data.activeSessionId = 'deleted-session-id';
            manager.saveData(data);
            const active = manager.getActiveSession();
            expect(active).to.have.property('id');
            expect(active.id).to.not.equal('deleted-session-id');
        });
    });

    describe('listSessions', () => {
        it('returns empty array when no sessions exist', () => {
            const sessions = manager.listSessions();
            expect(sessions).to.deep.equal([]);
        });

        it('returns all sessions', () => {
            manager.createSession('First');
            manager.createSession('Second');
            manager.createSession('Third');
            const sessions = manager.listSessions();
            expect(sessions).to.have.lengthOf(3);
        });

        it('sorts sessions by updatedAt descending', () => {
            const first = manager.createSession('First');
            const second = manager.createSession('Second');
            manager.updateSession(first.id, { updatedAt: Date.now() + 1000 });
            const sessions = manager.listSessions();
            expect(sessions[0].id).to.equal(first.id);
            expect(sessions[1].id).to.equal(second.id);
        });
    });

    describe('deleteSession', () => {
        it('removes a session from storage', () => {
            const session = manager.createSession('To Delete');
            manager.deleteSession(session.id);
            const data = getStoredData();
            expect(data.sessions[session.id]).to.be.undefined;
        });

        it('throws for non-existent session', () => {
            expect(() => manager.deleteSession('non-existent')).to.throw('Session non-existent not found');
        });

        it('updates activeSessionId when deleting the active session', () => {
            const session1 = manager.createSession('First');
            const session2 = manager.createSession('Second');
            manager.deleteSession(session2.id);
            const data = getStoredData();
            expect(data.activeSessionId).to.equal(session1.id);
        });

        it('sets activeSessionId to null when deleting the last session', () => {
            const session = manager.createSession('Only');
            manager.deleteSession(session.id);
            const data = getStoredData();
            expect(data.activeSessionId).to.equal(null);
        });

        it('returns the new active session ID', () => {
            const session1 = manager.createSession('First');
            manager.createSession('Second');
            const newActiveId = manager.deleteSession(session1.id);
            expect(newActiveId).to.be.a('string');
        });
    });

    describe('renameSession', () => {
        it('updates the session name', () => {
            const session = manager.createSession('Original');
            manager.renameSession(session.id, 'Renamed');
            const updated = manager.getSession(session.id);
            expect(updated.name).to.equal('Renamed');
        });

        it('trims whitespace from the new name', () => {
            const session = manager.createSession('Original');
            manager.renameSession(session.id, '  Trimmed  ');
            const updated = manager.getSession(session.id);
            expect(updated.name).to.equal('Trimmed');
        });

        it('throws for empty name', () => {
            const session = manager.createSession('Original');
            expect(() => manager.renameSession(session.id, '')).to.throw('Session name cannot be empty');
        });

        it('throws for whitespace-only name', () => {
            const session = manager.createSession('Original');
            expect(() => manager.renameSession(session.id, '   ')).to.throw('Session name cannot be empty');
        });

        it('throws for null name', () => {
            const session = manager.createSession('Original');
            expect(() => manager.renameSession(session.id, null)).to.throw('Session name cannot be empty');
        });

        it('throws for non-existent session', () => {
            expect(() => manager.renameSession('non-existent', 'Name')).to.throw('Session non-existent not found');
        });
    });

    describe('updateSession', () => {
        it('merges updates into the session', () => {
            const session = manager.createSession('Test');
            const messages = [{ role: 'user', content: 'Hello' }];
            manager.updateSession(session.id, { messages });
            const updated = manager.getSession(session.id);
            expect(updated.messages).to.deep.equal(messages);
        });

        it('updates the updatedAt timestamp', () => {
            const session = manager.createSession('Test');
            const originalUpdatedAt = session.updatedAt;
            const clock = sandbox.useFakeTimers(originalUpdatedAt + 5000);
            manager.updateSession(session.id, { name: 'Updated' });
            const updated = manager.getSession(session.id);
            expect(updated.updatedAt).to.be.greaterThan(originalUpdatedAt);
            clock.restore();
        });

        it('throws for non-existent session', () => {
            expect(() => manager.updateSession('non-existent', { name: 'New' })).to.throw('Session non-existent not found');
        });

        it('returns the updated session', () => {
            const session = manager.createSession('Test');
            const result = manager.updateSession(session.id, {
                name: 'Updated',
            });
            expect(result.name).to.equal('Updated');
        });

        it('persists updates to localStorage', () => {
            const session = manager.createSession('Test');
            manager.updateSession(session.id, { name: 'Persisted' });
            const data = getStoredData();
            expect(data.sessions[session.id].name).to.equal('Persisted');
        });
    });

    describe('updateSessionDebounced', () => {
        let clock;

        beforeEach(() => {
            clock = sandbox.useFakeTimers();
        });

        afterEach(() => {
            clock.restore();
        });

        it('delays the update by debounce interval', () => {
            const session = manager.createSession('Test');
            manager.updateSessionDebounced(session.id, { name: 'Debounced' });
            const before = manager.getSession(session.id);
            expect(before.name).to.equal('Test');
            clock.tick(500);
            const after = manager.getSession(session.id);
            expect(after.name).to.equal('Debounced');
        });

        it('cancels previous timer on rapid calls', () => {
            const session = manager.createSession('Test');
            manager.updateSessionDebounced(session.id, { name: 'First' });
            clock.tick(300);
            manager.updateSessionDebounced(session.id, { name: 'Second' });
            clock.tick(500);
            const updated = manager.getSession(session.id);
            expect(updated.name).to.equal('Second');
        });

        it('cleans up timer from map after execution', () => {
            const session = manager.createSession('Test');
            manager.updateSessionDebounced(session.id, { name: 'Done' });
            expect(manager.debounceTimers.has(session.id)).to.be.true;
            clock.tick(500);
            expect(manager.debounceTimers.has(session.id)).to.be.false;
        });
    });

    describe('generateSessionName', () => {
        it('returns date-based name when no message provided', () => {
            const name = manager.generateSessionName();
            expect(name).to.match(/^Chat \d/);
        });

        it('returns date-based name for empty string', () => {
            const name = manager.generateSessionName('');
            expect(name).to.match(/^Chat \d/);
        });

        it('returns the full message when 40 chars or less', () => {
            const message = 'Short message';
            const name = manager.generateSessionName(message);
            expect(name).to.equal('Short message');
        });

        it('truncates message longer than 40 chars with ellipsis', () => {
            const message = 'This is a very long message that exceeds forty characters easily';
            const name = manager.generateSessionName(message);
            expect(name).to.have.lengthOf(43);
            expect(name.endsWith('...')).to.be.true;
            expect(name).to.equal('This is a very long message that exceeds...');
        });

        it('returns exactly 40 chars without ellipsis for boundary', () => {
            const message = 'a'.repeat(40);
            const name = manager.generateSessionName(message);
            expect(name).to.equal(message);
            expect(name).to.have.lengthOf(40);
        });

        it('truncates 41-char message with ellipsis', () => {
            const message = 'a'.repeat(41);
            const name = manager.generateSessionName(message);
            expect(name).to.equal(`${'a'.repeat(40)}...`);
        });
    });

    describe('setActiveSession', () => {
        it('sets the active session ID', () => {
            const session1 = manager.createSession('First');
            const session2 = manager.createSession('Second');
            manager.setActiveSession(session1.id);
            expect(manager.getActiveSessionId()).to.equal(session1.id);
        });

        it('returns the activated session', () => {
            const session = manager.createSession('Test');
            manager.createSession('Other');
            const result = manager.setActiveSession(session.id);
            expect(result.id).to.equal(session.id);
        });

        it('throws for non-existent session', () => {
            expect(() => manager.setActiveSession('non-existent')).to.throw('Session non-existent not found');
        });
    });

    describe('clearSession', () => {
        it('clears messages and conversationHistory', () => {
            const session = manager.createSession('Test');
            manager.updateSession(session.id, {
                messages: [{ role: 'user', content: 'Hello' }],
                conversationHistory: [{ role: 'user', content: 'Hello' }],
            });
            manager.clearSession(session.id);
            const cleared = manager.getSession(session.id);
            expect(cleared.messages).to.deep.equal([]);
            expect(cleared.conversationHistory).to.deep.equal([]);
        });

        it('preserves session name and ID', () => {
            const session = manager.createSession('Keep Name');
            manager.clearSession(session.id);
            const cleared = manager.getSession(session.id);
            expect(cleared.name).to.equal('Keep Name');
            expect(cleared.id).to.equal(session.id);
        });
    });

    describe('getSessionCount', () => {
        it('returns 0 when no sessions exist', () => {
            expect(manager.getSessionCount()).to.equal(0);
        });

        it('returns correct count after creating sessions', () => {
            manager.createSession('One');
            manager.createSession('Two');
            expect(manager.getSessionCount()).to.equal(2);
        });
    });

    describe('isAtMaxSessions', () => {
        it('returns false when under the limit', () => {
            manager.createSession('Test');
            expect(manager.isAtMaxSessions()).to.be.false;
        });

        it('returns true when at the limit', () => {
            for (let i = 0; i < MAX_SESSIONS; i++) {
                manager.createSession(`Session ${i}`);
            }
            expect(manager.isAtMaxSessions()).to.be.true;
        });
    });

    describe('getData', () => {
        it('returns default structure when storage is corrupted', () => {
            storage[STORAGE_KEY] = null;
            const data = manager.getData();
            expect(data).to.deep.equal({
                sessions: {},
                activeSessionId: null,
            });
        });
    });
});

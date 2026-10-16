import assert from 'node:assert/strict';
import { test } from 'node:test';

const entries = new Map();
let reads = 0;
let writes = 0;
let storageFailure;
globalThis.localStorage = {
    getItem(key) {
        reads += 1;
        if (storageFailure && storageFailure.name !== 'QuotaExceededError') throw storageFailure;
        return entries.get(key) ?? null;
    },
    setItem(key, value) {
        writes += 1;
        if (storageFailure) throw storageFailure;
        entries.set(key, value);
    },
};
const { ChatSessionManager } = await import('../../studio/src/services/chat-session-manager.js');

test('importing chat sessions performs no storage access', () => {
    assert.equal(reads, 0);
    assert.equal(writes, 0);
});

test('constructing a session manager does not initialize persistence', () => {
    reads = 0;
    writes = 0;
    new ChatSessionManager();
    assert.equal(reads, 0);
    assert.equal(writes, 0);
});

test('sessions remain usable in memory when storage is denied', () => {
    storageFailure = new DOMException('Storage denied', 'SecurityError');
    try {
        const manager = new ChatSessionManager();
        const session = manager.createSession('Offline');
        assert.equal(manager.getSession(session.id).name, 'Offline');
    } finally {
        storageFailure = null;
    }
});

test('quota failure preserves the new session in memory', () => {
    entries.clear();
    const manager = new ChatSessionManager();
    storageFailure = new DOMException('Storage full', 'QuotaExceededError');
    try {
        const session = manager.createSession('Unsaved');
        manager.renameSession(session.id, 'Renamed');
        assert.equal(manager.getSession(session.id).name, 'Renamed');
    } finally {
        storageFailure = null;
    }
});

test('unexpected storage errors are not swallowed', () => {
    const manager = new ChatSessionManager();
    storageFailure = new Error('Unexpected failure');
    try {
        assert.throws(() => manager.getData(), /Unexpected failure/);
    } finally {
        storageFailure = null;
    }
});

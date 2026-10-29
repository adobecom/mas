import sinon from 'sinon';
import sessionManager from '../../src/services/chat-session-manager.js';

/**
 * Give a chat test its own private localStorage.
 *
 * mas-chat restores the active session in connectedCallback and saves it back
 * on a 500ms debounce. Web Test Runner runs several test files at once in one
 * browser context, so those pages share real localStorage: a file can inherit
 * another file's transcript, and its own debounced save can land in storage
 * after its cleanup has run, while a concurrent page is reading.
 *
 * Clearing the key does not close that race, it only narrows it. Backing the
 * accessors with a per-test object removes the shared state instead, which is
 * the pattern services/chat-session-manager.test.js already uses.
 *
 * Note that `clear` is deliberately not stubbed anywhere in this suite: a
 * blanket localStorage.clear() reaches past these stubs and destroys keys
 * other suites rely on. Remove single keys, never clear.
 *
 * @returns {{restore: () => void}} restore it in afterEach.
 */
export function useIsolatedChatSessionStorage() {
    const sandbox = sinon.createSandbox();
    const storage = {};

    sandbox.stub(localStorage, 'getItem').callsFake((key) => storage[key] ?? null);
    sandbox.stub(localStorage, 'setItem').callsFake((key, value) => {
        storage[key] = String(value);
    });
    sandbox.stub(localStorage, 'removeItem').callsFake((key) => {
        delete storage[key];
    });

    return {
        /**
         * Saves are debounced by 500ms, so a timer armed during the test fires
         * after the stubs come off and writes a session the real store has
         * never heard of. Drop the pending timers before restoring.
         */
        restore() {
            sessionManager.debounceTimers.forEach((timer) => clearTimeout(timer));
            sessionManager.debounceTimers.clear();
            sandbox.restore();
        },
    };
}

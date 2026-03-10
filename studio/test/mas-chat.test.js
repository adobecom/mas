import { expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import '../src/mas-chat.js';
import {
    extractVariant,
    extractOsi,
    getOperationLoadingMessage,
    extractSurfaceFromPath,
    getLastOperationResult,
    getRecentFragments,
} from '../src/services/chat-dispatcher.js';

describe('MasChat', () => {
    let el;

    beforeEach(async () => {
        el = await fixture(html`<mas-chat></mas-chat>`);
    });

    afterEach(() => {
        sinon.restore();
    });

    describe('startOperation / endOperation', () => {
        it('sets isLoading to true when operation starts', () => {
            el.startOperation('search');
            expect(el.isLoading).to.be.true;
            expect(el.activeOperations.has('search')).to.be.true;
        });

        it('keeps isLoading true when multiple operations are active', () => {
            el.startOperation('search');
            el.startOperation('publish');
            el.endOperation('search');
            expect(el.isLoading).to.be.true;
            expect(el.activeOperations.size).to.equal(1);
        });

        it('sets isLoading to false when all operations end', () => {
            el.startOperation('search');
            el.endOperation('search');
            expect(el.isLoading).to.be.false;
            expect(el.activeOperations.size).to.equal(0);
        });
    });

    describe('getTimeGreeting', () => {
        it('returns "Good morning" before noon', () => {
            const clock = sinon.useFakeTimers(new Date(2026, 2, 9, 9, 0, 0).getTime());
            expect(el.getTimeGreeting()).to.equal('Good morning');
            clock.restore();
        });

        it('returns "Good afternoon" between noon and 6pm', () => {
            const clock = sinon.useFakeTimers(new Date(2026, 2, 9, 14, 0, 0).getTime());
            expect(el.getTimeGreeting()).to.equal('Good afternoon');
            clock.restore();
        });

        it('returns "Good evening" after 6pm', () => {
            const clock = sinon.useFakeTimers(new Date(2026, 2, 9, 20, 0, 0).getTime());
            expect(el.getTimeGreeting()).to.equal('Good evening');
            clock.restore();
        });
    });

    describe('getCurrentSurface', () => {
        it('returns null when no path is available', () => {
            expect(el.getCurrentSurface()).to.be.null;
        });

        it('returns mapped surface from hash param', () => {
            const originalHash = window.location.hash;
            window.location.hash = '#path=acom';
            const result = el.getCurrentSurface();
            window.location.hash = originalHash;
            expect(result).to.equal('acom');
        });

        it('returns null for unknown path', () => {
            const originalHash = window.location.hash;
            window.location.hash = '#path=nonexistent';
            const result = el.getCurrentSurface();
            window.location.hash = originalHash;
            expect(result).to.be.null;
        });
    });

    describe('getSurfaceLabel', () => {
        it('returns label for known surface key', () => {
            expect(el.getSurfaceLabel('acom')).to.equal('Adobe.com');
        });

        it('returns key as fallback for unknown surface', () => {
            expect(el.getSurfaceLabel('unknown-surface')).to.equal('unknown-surface');
        });
    });

    describe('fetchUserName', () => {
        it('sets userName from first_name', async () => {
            window.adobeIMS = {
                getProfile: sinon.stub().resolves({ first_name: 'Alice' }),
            };
            await el.fetchUserName();
            expect(el.userName).to.equal('Alice');
            delete window.adobeIMS;
        });

        it('falls back to displayName first word', async () => {
            window.adobeIMS = {
                getProfile: sinon.stub().resolves({ displayName: 'Bob Smith' }),
            };
            await el.fetchUserName();
            expect(el.userName).to.equal('Bob');
            delete window.adobeIMS;
        });

        it('sets userName to null on error', async () => {
            window.adobeIMS = {
                getProfile: sinon.stub().rejects(new Error('auth error')),
            };
            el.userName = 'Previous';
            await el.fetchUserName();
            expect(el.userName).to.be.null;
            delete window.adobeIMS;
        });
    });
});

describe('chat-dispatcher', () => {
    describe('getOperationLoadingMessage', () => {
        it('returns correct message for search_cards', () => {
            expect(getOperationLoadingMessage('search_cards')).to.equal('Searching for cards...');
        });

        it('returns correct message for publish', () => {
            expect(getOperationLoadingMessage('publish')).to.equal('Publishing card...');
        });

        it('returns fallback for unknown operation type', () => {
            expect(getOperationLoadingMessage('unknown_type')).to.equal('Executing operation...');
        });
    });

    describe('extractSurfaceFromPath', () => {
        it('returns surface for valid AEM path', () => {
            expect(extractSurfaceFromPath('/content/dam/mas/acom/en_US/cards')).to.equal('acom');
        });

        it('returns null for path without "mas" segment', () => {
            expect(extractSurfaceFromPath('/content/dam/other/acom')).to.be.null;
        });

        it('returns null for null input', () => {
            expect(extractSurfaceFromPath(null)).to.be.null;
        });

        it('returns null for non-string input', () => {
            expect(extractSurfaceFromPath(42)).to.be.null;
        });
    });

    describe('getLastOperationResult', () => {
        it('returns null when no messages have operation results', () => {
            const messages = [{ role: 'user', content: 'hello' }];
            expect(getLastOperationResult(messages)).to.be.null;
        });

        it('returns the last operation result with fragment IDs', () => {
            const messages = [
                {
                    role: 'assistant',
                    operationResult: {
                        operation: 'search',
                        results: [{ id: 'frag-1' }, { id: 'frag-2' }],
                        count: 2,
                    },
                    timestamp: '2026-03-09T12:00:00Z',
                },
            ];
            const result = getLastOperationResult(messages);
            expect(result.type).to.equal('search');
            expect(result.fragmentIds).to.deep.equal(['frag-1', 'frag-2']);
            expect(result.count).to.equal(2);
        });

        it('returns empty fragmentIds when results are missing', () => {
            const messages = [
                {
                    role: 'assistant',
                    operationResult: { operation: 'delete', count: 1 },
                    timestamp: '2026-03-09T12:00:00Z',
                },
            ];
            const result = getLastOperationResult(messages);
            expect(result.fragmentIds).to.deep.equal([]);
        });
    });

    describe('getRecentFragments', () => {
        it('returns empty array when no messages have results', () => {
            const messages = [{ role: 'user', content: 'hello' }];
            expect(getRecentFragments(messages)).to.deep.equal([]);
        });

        it('extracts fragments from operation results', () => {
            const messages = [
                {
                    role: 'assistant',
                    operationResult: {
                        results: [{ id: 'frag-1', title: 'Card One', path: '/content/dam/mas/acom/en_US/card-one' }],
                    },
                },
            ];
            const fragments = getRecentFragments(messages);
            expect(fragments).to.have.length(1);
            expect(fragments[0].id).to.equal('frag-1');
            expect(fragments[0].title).to.equal('Card One');
            expect(fragments[0].variant).to.equal('card-one');
        });

        it('respects limit parameter', () => {
            const results = Array.from({ length: 10 }, (v, i) => ({
                id: `frag-${i}`,
                title: `Card ${i}`,
                path: `/content/dam/mas/acom/en_US/card-${i}`,
            }));
            const messages = [{ role: 'assistant', operationResult: { results } }];
            expect(getRecentFragments(messages, 3)).to.have.length(3);
        });
    });

    describe('extractVariant', () => {
        it('extracts last path segment from fragment path', () => {
            const fragment = { path: '/content/dam/mas/acom/en_US/catalog' };
            expect(extractVariant(fragment)).to.equal('catalog');
        });

        it('returns "unknown" when no path match', () => {
            const fragment = { id: 'no-slash-id' };
            expect(extractVariant(fragment)).to.equal('unknown');
        });
    });

    describe('extractOsi', () => {
        it('returns osi from top-level property', () => {
            expect(extractOsi({ osi: 'abc123' })).to.equal('abc123');
        });

        it('returns osi from object-style fields', () => {
            expect(extractOsi({ fields: { osi: 'def456' } })).to.equal('def456');
        });

        it('returns osi from array-style fields', () => {
            const fragment = {
                fields: [{ name: 'osi', values: ['ghi789'] }],
            };
            expect(extractOsi(fragment)).to.equal('ghi789');
        });

        it('returns null when no osi found', () => {
            expect(extractOsi({ fields: [] })).to.be.null;
        });
    });
});

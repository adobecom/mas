import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { buildRenameNotice, nextAvailableTitle, resolveUniqueTitle } from '../src/fragment-title-uniqueness.js';

describe('fragment-title-uniqueness', () => {
    describe('nextAvailableTitle', () => {
        it('returns the title unchanged when it is not taken', () => {
            expect(nextAvailableTitle('lucy-card', new Set(['other-card']))).to.deep.equal({
                title: 'lucy-card',
                renamed: false,
            });
        });

        it('appends -1 when the title is taken', () => {
            expect(nextAvailableTitle('lucy-card', new Set(['lucy-card']))).to.deep.equal({
                title: 'lucy-card-1',
                renamed: true,
            });
        });

        it('increments past -1 when it is also taken', () => {
            expect(nextAvailableTitle('lucy-card', new Set(['lucy-card', 'lucy-card-1']))).to.deep.equal({
                title: 'lucy-card-2',
                renamed: true,
            });
        });

        it('returns the original title without throwing when maxAttempts is exhausted', () => {
            const taken = new Set(['lucy-card', 'lucy-card-1', 'lucy-card-2']);
            const result = nextAvailableTitle('lucy-card', taken, 2);
            expect(result).to.deep.equal({ title: 'lucy-card', renamed: false, exhausted: true });
        });
    });

    describe('resolveUniqueTitle', () => {
        it('returns the typed title unchanged and does not notify when it is absent', async () => {
            const notify = sinon.stub();
            const result = await resolveUniqueTitle({
                title: 'lucy-card',
                listTitles: async () => new Set(['other-card']),
                notify,
            });
            expect(result).to.deep.equal({ title: 'lucy-card', renamed: false });
            expect(notify.called).to.be.false;
        });

        it('notifies exactly once with the final title when renamed', async () => {
            const notify = sinon.stub();
            const result = await resolveUniqueTitle({
                title: 'lucy-card',
                listTitles: async () => new Set(['lucy-card']),
                notify,
            });
            expect(result).to.deep.equal({ title: 'lucy-card-1', renamed: true });
            expect(notify.calledOnce).to.be.true;
            expect(notify.firstCall.args[0]).to.equal('lucy-card-1');
        });

        it('never throws and returns the typed title when listTitles rejects', async () => {
            const notify = sinon.stub();
            const result = await resolveUniqueTitle({
                title: 'lucy-card',
                listTitles: async () => {
                    throw new Error('network error');
                },
                notify,
            });
            expect(result).to.deep.equal({ title: 'lucy-card', renamed: false });
            expect(notify.called).to.be.false;
        });

        it('returns the typed title without notifying when listTitles resolves to null', async () => {
            const notify = sinon.stub();
            const result = await resolveUniqueTitle({
                title: 'lucy-card',
                listTitles: async () => null,
                notify,
            });
            expect(result).to.deep.equal({ title: 'lucy-card', renamed: false });
            expect(notify.called).to.be.false;
        });

        it('never throws and returns the typed title when the attempt cap is exhausted', async () => {
            const notify = sinon.stub();
            const taken = new Set(['lucy-card', 'lucy-card-1']);
            const result = await resolveUniqueTitle({
                title: 'lucy-card',
                listTitles: async () => taken,
                notify,
                maxAttempts: 1,
            });
            expect(result).to.deep.equal({ title: 'lucy-card', renamed: false });
            expect(notify.called).to.be.false;
        });
    });

    describe('buildRenameNotice', () => {
        it('embeds the final title in the message', () => {
            expect(buildRenameNotice('lucy-card-1')).to.include('lucy-card-1');
        });
    });
});

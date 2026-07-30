import { expect } from 'chai';
import {
    transformer,
    transformEduWhatsIncluded,
} from '../../src/fragment/transformers/eduWhatsIncluded.js';

const WI =
    '<p class="whats-included-label">Students save 71%</p>' +
    '<div class="section"><h4>Apps</h4></div>';

describe('eduWhatsIncluded — transformEduWhatsIncluded', () => {
    it('promotes the label to the title and injects both placeholders', () => {
        expect(transformEduWhatsIncluded(WI, false)).to.equal(
            '<p class="whats-included-title">Students save 71%</p>' +
                '<p class="whats-included-label">{{whats-included}}</p>' +
                '<div class="section"><h4>Apps</h4></div>' +
                '<div class="whats-included-disclaimer">{{edu-disclaimer}}</div>',
        );
    });

    it('omits the disclaimer when hidden', () => {
        const out = transformEduWhatsIncluded(WI, true);
        expect(out).to.include('<p class="whats-included-title">Students save 71%</p>');
        expect(out).to.include('{{whats-included}}');
        expect(out).to.not.include('whats-included-disclaimer');
    });

    it('is idempotent once the title exists', () => {
        const already =
            '<p class="whats-included-title">X</p>' +
            '<p class="whats-included-label">{{whats-included}}</p>';
        expect(transformEduWhatsIncluded(already, false)).to.equal(already);
    });

    it('leaves content without a label untouched', () => {
        const noLabel = '<div class="section"><h4>Apps</h4></div>';
        expect(transformEduWhatsIncluded(noLabel, false)).to.equal(noLabel);
    });

    it('returns non-string input unchanged', () => {
        expect(transformEduWhatsIncluded(undefined, false)).to.equal(undefined);
    });
});

describe('eduWhatsIncluded — transformer.process', () => {
    const run = (body) => transformer.process({ body });

    it('transforms a pro/edu string field', async () => {
        const ctx = await run({
            fields: { variant: 'pro', size: 'edu', whatsIncluded: WI },
        });
        const wi = ctx.body.fields.whatsIncluded;
        expect(wi).to.include('<p class="whats-included-title">Students save 71%</p>');
        expect(wi).to.include('<p class="whats-included-label">{{whats-included}}</p>');
        expect(wi).to.include('<div class="whats-included-disclaimer">{{edu-disclaimer}}</div>');
    });

    it('transforms a pro/edu text/html field ({ value })', async () => {
        const ctx = await run({
            fields: {
                variant: 'pro',
                size: 'edu',
                whatsIncluded: { mimeType: 'text/html', value: WI },
            },
        });
        expect(ctx.body.fields.whatsIncluded.value).to.include('whats-included-title');
    });

    it('omits the disclaimer when hideEduDisclaimer is set', async () => {
        const ctx = await run({
            settings: { hideEduDisclaimer: true },
            fields: { variant: 'pro', size: 'edu', whatsIncluded: WI },
        });
        expect(ctx.body.fields.whatsIncluded).to.not.include('edu-disclaimer');
        expect(ctx.body.fields.whatsIncluded).to.include('whats-included-title');
    });

    it('ignores non-pro variants', async () => {
        const ctx = await run({
            fields: { variant: 'plans', size: 'edu', whatsIncluded: WI },
        });
        expect(ctx.body.fields.whatsIncluded).to.equal(WI);
    });

    it('ignores non-edu sizes', async () => {
        const ctx = await run({
            fields: { variant: 'pro', size: 'wide', whatsIncluded: WI },
        });
        expect(ctx.body.fields.whatsIncluded).to.equal(WI);
    });

    it('no-ops when whatsIncluded is absent', async () => {
        const ctx = await run({ fields: { variant: 'pro', size: 'edu' } });
        expect(ctx.body.fields.whatsIncluded).to.be.undefined;
    });

    it('leaves an object field without a string value untouched', async () => {
        const field = { mimeType: 'text/html' };
        const ctx = await run({
            fields: { variant: 'pro', size: 'edu', whatsIncluded: field },
        });
        expect(ctx.body.fields.whatsIncluded).to.equal(field);
    });

    it('no-ops when the body has no fields', async () => {
        const ctx = await run({});
        expect(ctx.body).to.deep.equal({});
    });

    it('no-ops when there is no body', async () => {
        const ctx = await transformer.process({});
        expect(ctx).to.deep.equal({});
    });
});

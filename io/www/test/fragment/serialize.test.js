import { expect } from 'chai';
import sinon from 'sinon';
import { transformer as serialize } from '../../src/fragment/transformers/serialize.js';
import { CARD_MODEL_ID, COLLECTION_MODEL_ID } from '../../src/fragment/utils/common.js';

const card = (fields, id = 'card') => ({ id, model: { id: CARD_MODEL_ID }, fields });
const html = (value) => ({ value, mimeType: 'text/html' });

async function run(type, fields, extra = {}) {
    const context = { type, api_key: 'test', body: card(fields), ...extra };
    return (await serialize.process(context)).body.fields;
}

const PRICE =
    '<span class="price price-strikethrough"><sr-only class="strikethrough-aria-label">Regularly at</sr-only>' +
    '<span class="price-currency-symbol">US$</span><span class="price-integer">39</span>' +
    '<span class="price-decimals disabled">00</span><span class="price-recurrence">/mo</span></span> ' +
    '<span class="price"><span class="price-currency-symbol">US$</span><span class="price-integer">29</span></span>';

const RICH =
    '<!-- comment --><p>Get <strong>20+ <em>apps</em></strong>,<br>see <a href="https://www.adobe.com/terms" target="_blank" ' +
    'onclick="steal()">terms</a> &amp; <a href="mailto:a@adobe.com">us</a></p>\n<ul>\n<li>one</li>\n<li><u>two</u></li>\n</ul>' +
    '<h3>Title</h3><script>alert(1)</script><style>p{}</style>';

describe('serialize transformer', () => {
    let logs;
    beforeEach(() => {
        logs = { log: sinon.stub(console, 'log'), error: sinon.stub(console, 'error') };
    });
    afterEach(() => sinon.restore());

    const logged = (stub) => stub.getCalls().map(({ args }) => args[0]);

    it('leaves fields as authored without type', async () => {
        const fields = { description: html(RICH) };
        expect(await run(undefined, structuredClone(fields))).to.deep.equal(fields);
    });

    it('serializes rich text in the Odin multi-line json format', async () => {
        const { description, prices } = await run('json', { description: html(RICH), prices: html(`<p>${PRICE}</p>`) });
        expect(description).to.deep.equal({
            json: [
                {
                    nodeType: 'paragraph',
                    content: [
                        { nodeType: 'text', value: 'Get ' },
                        { nodeType: 'text', value: '20+ ', format: { variants: ['bold'] } },
                        { nodeType: 'text', value: 'apps', format: { variants: ['bold', 'italic'] } },
                        { nodeType: 'text', value: ',' },
                        { nodeType: 'line-break' },
                        { nodeType: 'text', value: 'see ' },
                        { nodeType: 'link', data: { href: 'https://www.adobe.com/terms', target: '_blank' }, value: 'terms' },
                        { nodeType: 'text', value: ' & ' },
                        { nodeType: 'link', data: { href: 'mailto:a@adobe.com' }, value: 'us' },
                    ],
                },
                {
                    nodeType: 'unordered-list',
                    content: [
                        { nodeType: 'list-item', content: [{ nodeType: 'text', value: 'one' }] },
                        {
                            nodeType: 'list-item',
                            content: [{ nodeType: 'text', value: 'two', format: { variants: ['underline'] } }],
                        },
                    ],
                },
                { nodeType: 'header', style: 'h3', content: [{ nodeType: 'text', value: 'Title' }] },
            ],
        });
        expect(prices).to.deep.equal({
            json: [
                {
                    nodeType: 'paragraph',
                    content: [
                        { nodeType: 'text', value: 'US$39/mo', format: { variants: ['strikethrough'] } },
                        { nodeType: 'text', value: ' US$29' },
                    ],
                },
            ],
        });
    });

    it('re-serializes sanitized html', async () => {
        const { description, prices } = await run('html', { description: html(RICH), prices: html(`<p>${PRICE}</p>`) });
        expect(description).to.deep.equal(
            html(
                '<p>Get <strong>20+ </strong><em><strong>apps</strong></em>,<br>see <a href="https://www.adobe.com/terms" ' +
                    'target="_blank" rel="noopener noreferrer">terms</a> &amp; <a href="mailto:a@adobe.com">us</a></p>' +
                    '<ul><li>one</li><li><u>two</u></li></ul><h3>Title</h3>',
            ),
        );
        expect(prices.value).to.equal('<p><s>US$39/mo</s> US$29</p>');
    });

    it('keeps the sanitized tree of rendered prices in json & html', async () => {
        const strikethrough = `<span is="inline-price" data-template="strikethrough" data-wcs-osi="osi">${PRICE.split(' <span class="price">')[0]}</span>`;
        const price =
            '<span is="inline-price" onclick="steal()"><span class="price"><!-- c --><span class="price-currency-symbol">US$</span>' +
            '<a href="/x">2&lt;9</a><span>/mo</span></span></span>';
        const prices = html(`<p>${strikethrough} Pay <strong>${price}</strong> now<span is="inline-price"></span></p>`);
        expect((await run('html', { prices: structuredClone(prices) })).prices.value).to.equal(
            '<p><span is="inline-price" data-template="strikethrough"><span class="price price-strikethrough">' +
                '<span class="price-currency-symbol">US$</span><span class="price-integer">39</span>' +
                '<span class="price-recurrence">/mo</span></span></span> Pay <strong><span is="inline-price"><span class="price">' +
                '<span class="price-currency-symbol">US$</span>2&lt;9<span>/mo</span></span></span></strong> now</p>',
        );
        const text = (value) => ({ nodeType: 'text', value });
        const span = (className, ...content) => ({
            nodeType: 'span',
            ...(className && { data: { class: className } }),
            content,
        });
        expect((await run('json', { prices: structuredClone(prices) })).prices.json[0].content).to.deep.equal([
            {
                nodeType: 'inline-price',
                data: { template: 'strikethrough' },
                content: [
                    span(
                        'price price-strikethrough',
                        span('price-currency-symbol', text('US$')),
                        span('price-integer', text('39')),
                        span('price-recurrence', text('/mo')),
                    ),
                ],
            },
            text(' Pay '),
            {
                nodeType: 'inline-price',
                content: [span('price', span('price-currency-symbol', text('US$')), text('2<9'), span(undefined, text('/mo')))],
                format: { variants: ['bold'] },
            },
            text(' now'),
        ]);
        expect((await run('text', { prices: structuredClone(prices) })).prices.value).to.equal('US$39/mo Pay US$2<9/mo now');
    });

    it('flattens to text, one line per block', async () => {
        const { description, prices } = await run('text', { description: html(RICH), prices: html(`<p>${PRICE}</p>`) });
        expect(description).to.deep.equal({ value: 'Get 20+ apps,\nsee terms & us\none\ntwo\nTitle', mimeType: 'text/plain' });
        expect(prices.value).to.equal('US$39/mo US$29');
    });

    it('groups loose inline content in paragraphs and drops empty blocks', async () => {
        const { description } = await run('json', {
            description: '  loose <b>text</b><p> </p><div>unwrapped</div><p><a href="tel:123">ca<br>ll</a><br></p>',
        });
        expect(description.json).to.deep.equal([
            {
                nodeType: 'paragraph',
                content: [
                    { nodeType: 'text', value: 'loose ' },
                    { nodeType: 'text', value: 'text', format: { variants: ['bold'] } },
                ],
            },
            { nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'unwrapped' }] },
            {
                nodeType: 'paragraph',
                content: [{ nodeType: 'link', data: { href: 'tel:123' }, value: 'call' }, { nodeType: 'line-break' }],
            },
        ]);
    });

    it('drops unsafe links and non rich text elements, and reports them', async () => {
        const { callout } = await run('text', {
            callout: html(
                '<p><a href="javascript:alert(1)">bad</a> <a>none</a> <custom-tag>kept</custom-tag> ' +
                    '<a is="checkout-link" data-wcs-osi="osi">Buy</a><a data-wcs-osi="osi">Buy</a><img src="x">' +
                    '<mas-mnemonic>icon</mas-mnemonic><iframe src="https://evil"></iframe></p>',
            ),
        });
        expect(callout.value).to.equal('bad none kept');
        expect(logged(logs.log).join('\n'))
            .to.include('serialize card.callout: unwrapped link with href "javascript:alert(1)"')
            .and.include('unwrapped link with href "undefined"')
            .and.include('unwrapped unknown <custom-tag>');
        expect(logged(logs.error).join('\n'))
            .to.include('serialize card.callout: rejected <a is="checkout-link">')
            .and.include('rejected <a>')
            .and.include('rejected <img>')
            .and.include('rejected <mas-mnemonic>');
    });

    it('serializes every entry of multiple fields, raw values and empty fields', async () => {
        const fields = await run('html', {
            customFields: html(['<p>one</p>', '<p>two</p>']),
            shortDescription: '<p>raw</p>',
            badge: { mimeType: 'text/html' },
            ctas: html('<a is="checkout-link">Buy</a>'),
            cardTitle: 'Title',
        });
        expect(fields.customFields).to.deep.equal(html(['<p>one</p>', '<p>two</p>']));
        expect(fields.shortDescription).to.deep.equal(html('<p>raw</p>'));
        expect(fields.badge).to.deep.equal(html(''));
        expect(fields.ctas).to.deep.equal(html('<a is="checkout-link">Buy</a>'));
        expect(fields.cardTitle).to.equal('Title');
        expect(fields.callout).to.be.undefined;
        expect((await run('json', { customFields: ['<p>one</p>'] })).customFields).to.deep.equal({
            json: [[{ nodeType: 'paragraph', content: [{ nodeType: 'text', value: 'one' }] }]],
        });
    });

    it("serializes the referenced cards, not the other models' fields", async () => {
        const context = {
            type: 'text',
            api_key: 'test',
            body: {
                id: 'collection',
                model: { id: COLLECTION_MODEL_ID },
                fields: { description: '<p>collection</p>' },
                references: {
                    card: { type: 'content-fragment', value: card({ description: '<p>card</p>' }) },
                    folder: { type: 'folder' },
                },
            },
        };
        const { body } = await serialize.process(context);
        expect(body.fields.description).to.equal('<p>collection</p>');
        expect(body.references.card.value.fields.description).to.deep.equal({ value: 'card', mimeType: 'text/plain' });
    });
});

import { expect } from 'chai';
import { transformer } from '../../src/fragment/transformers/corrector.js';

describe('corrector', () => {
    describe('price literals cleanup', () => {
        it('should remove empty price literals', async () => {
            const context = {
                body: {
                    priceLiterals: {
                        validKey: 'valid value',
                        emptyKey: 'price-literal-something',
                        anotherEmptyKey: '{{price-literal-test}}',
                    },
                },
            };

            const result = await transformer.process(context);

            expect(result.body.priceLiterals).to.deep.equal({
                validKey: 'valid value',
            });
        });

        it('should keep valid price literals', async () => {
            const context = {
                body: {
                    priceLiterals: {
                        valid1: 'value1',
                        valid2: 'value2',
                    },
                },
            };

            const result = await transformer.process(context);

            expect(result.body.priceLiterals).to.deep.equal({
                valid1: 'value1',
                valid2: 'value2',
            });
        });
    });

    describe('adobe-home data-extra-options fixing', () => {
        describe('quote fixing with object ctas', () => {
            const fixingTestCases = [
                {
                    name: 'should fix escaped quotes in ctas field for adobe-home surface',
                    input: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                    expected: '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
                    mimeType: 'text/html',
                },
                {
                    name: 'should fix literal quotes in ctas field for adobe-home surface',
                    input: '<a data-extra-options="{"actionId":"try"}">Test</a>',
                    expected: '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
                    mimeType: 'text/html',
                },
                {
                    name: 'should fix multiple data-extra-options in ctas field',
                    input: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Try</a><a data-extra-options="{\\\"actionId\\\":\\\"buy\\\"}">Buy</a>',
                    expected:
                        '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Try</a><a data-extra-options="{&quot;actionId&quot;:&quot;buy&quot;}">Buy</a>',
                },
                {
                    name: 'should fix complex data-extra-options with multiple properties',
                    input: '<a class="secondary" data-checkout-workflow="UCv3" data-extra-options="{\\\"actionId\\\":\\\"try\\\",\\\"ctx\\\":\\\"if\\\"}">Try</a>',
                    expected:
                        '<a class="secondary" data-checkout-workflow="UCv3" data-extra-options="{&quot;actionId&quot;:&quot;try&quot;,&quot;ctx&quot;:&quot;if&quot;}">Try</a>',
                },
                {
                    name: 'should normalize &quot; to escaped quotes when no escaped quotes present',
                    input: '\u003Ca class=&quot;accent&quot; data-checkout-workflow=&quot;UCv3&quot; data-checkout-workflow-step=&quot;segmentation&quot; data-extra-options=&quot;{&quot;actionId&quot;:&quot;upgrade&quot;,&quot;ctx&quot;:&quot;if&quot;}&quot; data-wcs-osi=&quot;r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8&quot; data-template=&quot;checkoutUrl&quot; title=&quot;Upgrade now&quot; target=&quot;_self&quot; data-analytics-id=&quot;upgrade-now&quot;\u003EMettre à niveau\u003C/a\u003E',
                    expected:
                        '\u003Ca class=\"accent\" data-checkout-workflow=\"UCv3\" data-checkout-workflow-step=\"segmentation\" data-extra-options=\"{&quot;actionId&quot;:&quot;upgrade&quot;,&quot;ctx&quot;:&quot;if&quot;}\" data-wcs-osi=\"r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8\" data-template=\"checkoutUrl\" title=\"Upgrade now\" target=\"_self\" data-analytics-id=\"upgrade-now\"\u003EMettre à niveau\u003C/a\u003E',
                    mimeType: 'text/html',
                },
            ];

            fixingTestCases.forEach(({ name, input, expected, mimeType }) => {
                it(name, async () => {
                    const context = {
                        surface: 'adobe-home',
                        body: {
                            priceLiterals: {},
                            fields: {
                                ctas: {
                                    value: input,
                                    ...(mimeType && { mimeType }),
                                },
                            },
                        },
                    };

                    await transformer.process(context);

                    expect(context.body.fields.ctas.value).to.equal(expected);
                });
            });
        });

        describe('surface-specific behavior', () => {
            const surfaceTestCases = [
                {
                    name: 'should not modify ctas for non-adobe-home surface',
                    surface: 'acom',
                },
                {
                    name: 'should not modify ctas when surface is missing',
                    surface: undefined,
                },
            ];

            const surfacesWithFixTestCases = [
                {
                    name: 'should fix ctas for adobe-home surface',
                    surface: 'adobe-home',
                },
                {
                    name: 'should fix ctas for sandbox surface',
                    surface: 'sandbox',
                },
                {
                    name: 'should fix ctas for ccd surface',
                    surface: 'ccd',
                },
            ];

            surfaceTestCases.forEach(({ name, surface }) => {
                it(name, async () => {
                    const originalValue = '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>';
                    const context = {
                        ...(surface && { surface }),
                        body: {
                            priceLiterals: {},
                            fields: {
                                ctas: {
                                    value: originalValue,
                                },
                            },
                        },
                    };

                    await transformer.process(context);

                    expect(context.body.fields.ctas.value).to.equal(originalValue);
                });
            });

            surfacesWithFixTestCases.forEach(({ name, surface }) => {
                it(name, async () => {
                    const inputValue = '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>';
                    const expectedValue = '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>';
                    const context = {
                        surface,
                        body: {
                            priceLiterals: {},
                            fields: {
                                ctas: {
                                    value: inputValue,
                                },
                            },
                        },
                    };

                    await transformer.process(context);

                    expect(context.body.fields.ctas.value).to.equal(expectedValue);
                });
            });
        });

        describe('edge cases', () => {
            const edgeCaseTests = [
                {
                    name: 'should handle missing ctas field',
                    fields: {},
                    expectUnchanged: true,
                },
                {
                    name: 'should handle null ctas value',
                    fields: { ctas: null },
                    expectUnchanged: true,
                },
                {
                    name: 'should handle undefined ctas value',
                    fields: { ctas: undefined },
                    expectUnchanged: true,
                },
                {
                    name: 'should handle ctas without value property',
                    fields: { ctas: { mimeType: 'text/html' } },
                    expectUnchanged: true,
                },
                {
                    name: 'should handle text without data-extra-options',
                    fields: { ctas: { value: '<a class="primary">Buy Now</a>' } },
                    expectValue: '<a class="primary">Buy Now</a>',
                },
            ];

            edgeCaseTests.forEach(({ name, fields, expectUnchanged, expectValue }) => {
                it(name, async () => {
                    const context = {
                        surface: 'adobe-home',
                        body: {
                            priceLiterals: {},
                            fields,
                        },
                    };

                    const result = await transformer.process(context);

                    if (expectUnchanged) {
                        expect(result).to.equal(context);
                    } else if (expectValue) {
                        expect(context.body.fields.ctas.value).to.equal(expectValue);
                    }
                });
            });
        });

        describe('quote fixing with string ctas', () => {
            const stringCtasTestCases = [
                {
                    name: 'should fix escaped quotes when ctas is a string directly',
                    input: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                    expected: '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
                },
                {
                    name: 'should fix literal quotes when ctas is a string directly',
                    input: '<a data-extra-options="{"actionId":"try"}">Test</a>',
                    expected: '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
                },
            ];

            stringCtasTestCases.forEach(({ name, input, expected }) => {
                it(name, async () => {
                    const context = {
                        surface: 'adobe-home',
                        body: {
                            priceLiterals: {},
                            fields: {
                                ctas: input,
                            },
                        },
                    };

                    await transformer.process(context);

                    expect(context.body.fields.ctas).to.equal(expected);
                });
            });
        });
    });

    describe('corrector transformer integration', () => {
        describe('combined price literals cleanup and ctas fixing', () => {
            const integrationTestCases = [
                {
                    name: 'should remove empty priceLiterals and fix data-extra-options for adobe-home',
                    surface: 'adobe-home',
                    priceLiterals: {
                        validKey: 'valid value',
                        emptyKey: 'price-literal-something',
                        anotherEmptyKey: '{{price-literal-test}}',
                    },
                    ctasInput: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                    expectedPriceLiterals: { validKey: 'valid value' },
                    expectedCtas: '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
                },
                {
                    name: 'should only remove empty priceLiterals for non-adobe-home surface',
                    surface: 'ccd',
                    priceLiterals: {
                        validKey: 'valid value',
                        emptyKey: 'price-literal-something',
                    },
                    ctasInput: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                    expectedPriceLiterals: { validKey: 'valid value' },
                    expectedCtas: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                },
            ];

            integrationTestCases.forEach(({ name, surface, priceLiterals, ctasInput, expectedPriceLiterals, expectedCtas }) => {
                it(name, async () => {
                    const context = {
                        surface,
                        body: {
                            priceLiterals,
                            fields: {
                                ctas: {
                                    value: ctasInput,
                                },
                            },
                        },
                    };

                    const result = await transformer.process(context);

                    expect(result.body.priceLiterals).to.deep.equal(expectedPriceLiterals);
                    expect(result.body.fields.ctas.value).to.equal(expectedCtas);
                });
            });
        });

        it('should handle real-world adobe-home fragment data', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: {
                            value: '<a class="secondary" data-checkout-workflow="UCv3" data-checkout-workflow-step="segmentation" data-extra-options="{\\\"actionId\\\":\\\"try\\\",\\\"ctx\\\":\\\"if\\\"}" data-wcs-osi="JzW8dgW8U1SrgbHDmTE" data-template="checkoutUrl" title="Kostenlos testen" target="_self" data-analytics-id="free-trial">Kostenlos testen</a><a class="primary" data-checkout-workflow="UCv3" data-checkout-workflow-step="segmentation" data-extra-options="{\\\"actionId\\\":\\\"buy\\\",\\\"ctx\\\":\\\"if\\\"}" data-wcs-osi="r_JXAnlFI7xD6FxWKl2ODvZri" data-template="checkoutUrl" title="Abonnieren" target="_self" data-analytics-id="buy-now">Abonnieren</a>',
                            mimeType: 'text/html',
                        },
                        description: {
                            value: '<p>3 Monate lang 50 % Rabatt auf Creative Cloud Pro, danach 9 Monate lang zum regulären Preis. Jahres-Abo erforderlich. <a class="primary-link" title="Siehe Bedingungen" href="https://www.adobe.com/de/offer-terms/cc-full-special-offer.html" target="_blank" rel="noopener" data-analytics-id="see-terms">Siehe Bedingungen</a></p>',
                            mimeType: 'text/html',
                        },
                    },
                },
            };

            const result = await transformer.process(context);

            expect(result.body.fields.ctas.value).to.include(
                'data-extra-options="{&quot;actionId&quot;:&quot;try&quot;,&quot;ctx&quot;:&quot;if&quot;}"',
            );
            expect(result.body.fields.ctas.value).to.include(
                'data-extra-options="{&quot;actionId&quot;:&quot;buy&quot;,&quot;ctx&quot;:&quot;if&quot;}"',
            );

            expect(result.body.fields.description.value).to.include('Siehe Bedingungen');
        });
    });
});

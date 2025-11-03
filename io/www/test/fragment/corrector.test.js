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
        it('should fix escaped quotes in ctas field for adobe-home surface', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: {
                            value: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                            mimeType: 'text/html',
                        },
                    },
                },
            };

            await transformer.process(context);

            expect(context.body.fields.ctas.value).to.equal(
                '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
            );
        });

        it('should fix literal quotes in ctas field for adobe-home surface', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: {
                            value: '<a data-extra-options="{"actionId":"try"}">Test</a>',
                            mimeType: 'text/html',
                        },
                    },
                },
            };

            await transformer.process(context);

            expect(context.body.fields.ctas.value).to.equal(
                '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
            );
        });

        it('should fix multiple data-extra-options in ctas field', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: {
                            value: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Try</a><a data-extra-options="{\\\"actionId\\\":\\\"buy\\\"}">Buy</a>',
                        },
                    },
                },
            };

            await transformer.process(context);

            expect(context.body.fields.ctas.value).to.equal(
                '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Try</a><a data-extra-options="{&quot;actionId&quot;:&quot;buy&quot;}">Buy</a>',
            );
        });

        it('should fix complex data-extra-options with multiple properties', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: {
                            value: '<a class="secondary" data-checkout-workflow="UCv3" data-extra-options="{\\\"actionId\\\":\\\"try\\\",\\\"ctx\\\":\\\"if\\\"}">Try</a>',
                        },
                    },
                },
            };

            await transformer.process(context);

            expect(context.body.fields.ctas.value).to.equal(
                '<a class="secondary" data-checkout-workflow="UCv3" data-extra-options="{&quot;actionId&quot;:&quot;try&quot;,&quot;ctx&quot;:&quot;if&quot;}">Try</a>',
            );
        });

        it('should not modify ctas for non-adobe-home surface', async () => {
            const originalValue = '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>';
            const context = {
                surface: 'ccd',
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

        it('should not modify ctas when surface is missing', async () => {
            const originalValue = '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>';
            const context = {
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

        it('should handle missing ctas field', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {},
                },
            };

            const result = await transformer.process(context);
            expect(result).to.equal(context);
        });

        it('should handle null ctas value', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: null,
                    },
                },
            };

            const result = await transformer.process(context);
            expect(result).to.equal(context);
        });

        it('should handle undefined ctas value', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: undefined,
                    },
                },
            };

            const result = await transformer.process(context);
            expect(result).to.equal(context);
        });

        it('should handle ctas without value property', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: {
                            mimeType: 'text/html',
                        },
                    },
                },
            };

            const result = await transformer.process(context);
            expect(result).to.equal(context);
        });

        it('should handle text without data-extra-options', async () => {
            const originalValue = '<a class="primary">Buy Now</a>';
            const context = {
                surface: 'adobe-home',
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

        it('should fix escaped quotes when ctas is a string directly', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                    },
                },
            };

            await transformer.process(context);

            expect(context.body.fields.ctas).to.equal(
                '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
            );
        });

        it('should fix literal quotes when ctas is a string directly', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {},
                    fields: {
                        ctas: '<a data-extra-options="{"actionId":"try"}">Test</a>',
                    },
                },
            };

            await transformer.process(context);

            expect(context.body.fields.ctas).to.equal(
                '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
            );
        });
    });

    describe('corrector transformer integration', () => {
        it('should remove empty priceLiterals and fix data-extra-options for adobe-home', async () => {
            const context = {
                surface: 'adobe-home',
                body: {
                    priceLiterals: {
                        validKey: 'valid value',
                        emptyKey: 'price-literal-something',
                        anotherEmptyKey: '{{price-literal-test}}',
                    },
                    fields: {
                        ctas: {
                            value: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                        },
                    },
                },
            };

            const result = await transformer.process(context);

            expect(result.body.priceLiterals).to.deep.equal({
                validKey: 'valid value',
            });

            expect(result.body.fields.ctas.value).to.equal(
                '<a data-extra-options="{&quot;actionId&quot;:&quot;try&quot;}">Test</a>',
            );
        });

        it('should only remove empty priceLiterals for non-adobe-home surface', async () => {
            const context = {
                surface: 'ccd',
                body: {
                    priceLiterals: {
                        validKey: 'valid value',
                        emptyKey: 'price-literal-something',
                    },
                    fields: {
                        ctas: {
                            value: '<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>',
                        },
                    },
                },
            };

            const result = await transformer.process(context);

            expect(result.body.priceLiterals).to.deep.equal({
                validKey: 'valid value',
            });

            expect(result.body.fields.ctas.value).to.equal('<a data-extra-options="{\\\"actionId\\\":\\\"try\\\"}">Test</a>');
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

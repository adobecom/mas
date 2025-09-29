export default {
    FeatureName: 'M@S Studio ACOM Plans Individuals',
    features: [
        {
            tcid: '0',
            name: '@studio-plans-individuals-save-edited-variant-change',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },
        {
            tcid: '1',
            name: '@studio-plans-individuals-save-edited-size',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },
        {
            tcid: '2',
            name: '@studio-plans-individuals-save-edited-fields',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                title: 'Change title',
                badge: 'Change badge',
                description: 'New Test Description',
                iconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
                callout: 'AI Assistant add-on available',
                promoText: 'Test promotion text',
                osi: {
                    old: 'yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg',
                    new: '1RwmqQ0NVsrtYr1bj05lZCJBavU6JGa67djrwKE8k8o',
                },
                osiTags: {
                    old: {
                        offerType: 'offer_type/base',
                        marketSegment: 'market_segments/com',
                        planType: 'plan_type/m2m',
                    },
                    new: {
                        offerType: 'offer_type/trial',
                        marketSegment: 'market_segments/edu',
                        planType: 'plan_type/puf',
                    },
                },
                whatsIncludedText: 'List of items:',
                badgeColor: {
                    name: 'Green 900',
                    css: 'rgb(5, 131, 78)',
                },
                badgeBorderColor: {
                    name: 'Green 900',
                    css: 'rgb(5, 131, 78)',
                },
                cardBorderColor: {
                    name: 'Gray 300',
                    css: 'rgb(218, 218, 218)',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },
        {
            tcid: '3',
            name: '@studio-plans-individuals-save-edited-price',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                price: 'US$17.24/mo',
                strikethroughPrice: 'US$34.49/mo',
                newPrice: 'US$17.24/moper license',
                newStrikethroughPrice: 'US$34.49/moper license',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },
        {
            tcid: '4',
            name: '@studio-plans-individuals-save-edited-quantity-selector',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },

        {
            tcid: '5',
            name: '@studio-plans-individuals-save-edited-cta',
            path: '/studio.html',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                osi: 'yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg',
                label: {
                    old: 'Buy now',
                    new: 'New CTA Text',
                },
                variant: {
                    old: 'accent',
                    new: 'primary-outline',
                    oldCSS: {
                        'background-color': 'rgb(59, 99, 251)',
                        color: 'rgb(255, 255, 255)',
                    },
                    newCSS: {
                        color: 'rgb(44, 44, 44)',
                    },
                },
                checkoutParams: {
                    mv: '1',
                    promoid: 'ABC123',
                    mv2: '2',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },
        {
            tcid: '6',
            name: '@studio-plans-individuals-save-add-description-price-legal-disclamer',
            path: '/studio.html',
            data: {
                cardid: 'c72789db-f4c0-4b72-a6ba-3b73b05ae91a',
                osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
                legalDisclaimer: 'par licenceTVA comprise. Annual, billed monthly',
                cardLegalDisclaimer: 'par licenceTVA comprise',
            },
            browserParams: '#locale=fr_FR&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals @acom-plans-individuals-save',
        },
    ],
};

const checkoutData = {
    env: 'PRODUCTION',
    workflowStep: 'commitment',
    clientId: 'testClient',
    country: 'US',
    language: 'en',
    items: [{ id: 'offer', quantity: 2, language: 'en' }],
};

export const urlCases = [
    {
        id: 'commitment',
        data: checkoutData,
        expected:
            'https://commerce.adobe.com/store/commitment?items%5B0%5D%5Bid%5D=offer&items%5B0%5D%5Bq%5D=2&items%5B0%5D%5Blang%5D=en&cli=testClient&co=US&lang=en',
    },
    {
        id: 'staging',
        data: { ...checkoutData, env: 'STAGE' },
        expected:
            'https://commerce-stg.adobe.com/store/commitment?items%5B0%5D%5Bid%5D=offer&items%5B0%5D%5Bq%5D=2&items%5B0%5D%5Blang%5D=en&cli=testClient&co=US&lang=en',
    },
    {
        id: 'segmentation',
        data: {
            ...checkoutData,
            workflowStep: 'segmentation',
            marketSegment: 'EDU',
            customerSegment: 'INDIVIDUAL',
            offerType: 'PROMOTION',
            productArrangementCode: 'main',
            items: [
                { id: 'offer', quantity: 2, productArrangementCode: 'main' },
                { id: 'addon', productArrangementCode: 'stock' },
            ],
        },
        expected:
            'https://commerce.adobe.com/store/segmentation?cli=testClient&co=US&lang=en&ms=EDU&cs=INDIVIDUAL&pa=main&q=2&ao=stock',
    },
    {
        id: 'draft-3in1',
        data: {
            ...checkoutData,
            workflowStep: 'segmentation',
            landscape: 'DRAFT',
            modal: 'twp',
            is3in1: true,
            productArrangementCode: 'main',
            marketSegment: 'COM',
            customerSegment: 'TEAM',
            offerType: 'BASE',
        },
        expected:
            'https://commerce.adobe.com/store/segmentation?cli=mini_plans&co=US&lang=en&af=p_draft_landscape%2Cuc_new_user_iframe%2Cuc_new_system_close&ms=COM&ot=BASE&cs=TEAM&pa=main&q=2&rtc=t&lo=sl',
    },
    {
        id: 'doc-cloud-3in1',
        data: {
            ...checkoutData,
            workflowStep: 'segmentation',
            clientId: 'doc_cloud',
            modal: 'crm',
            is3in1: true,
            productArrangementCode: 'main',
        },
        expected:
            'https://commerce.adobe.com/store/segmentation?cli=doc_cloud&co=US&lang=en&pa=main&q=2&rtc=t&lo=sl&af=uc_new_user_iframe%2Cuc_new_system_close',
    },
    {
        id: 'team-plans',
        data: {
            ...checkoutData,
            workflowStep: 'change-plan/team-upgrade/plans',
            items: undefined,
        },
        expected: 'https://commerce.adobe.com/store/change-plan/team-upgrade/plans?cli=testClient&co=US&lang=en',
    },
    {
        id: 'page-params',
        data: { ...checkoutData, mv: 'input', sdid: 'input', unknown: 'ignored' },
        pageContext: {
            search: '?mv=page%3Fjunk&sdid=page&gid=first&gid=second&cli=ignored&notallowed=x&mv2=',
        },
        expected:
            'https://commerce.adobe.com/store/commitment?items%5B0%5D%5Bid%5D=offer&items%5B0%5D%5Bq%5D=2&items%5B0%5D%5Blang%5D=en&cli=testClient&co=US&lang=en&mv=page&sdid=page&gid=first&mv2=',
    },
    {
        id: 'tw-locale',
        data: checkoutData,
        pageContext: { pathnames: ['/tw/products/foo'] },
        expected:
            'https://commerce.adobe.com/store/commitment?items%5B0%5D%5Bid%5D=offer&items%5B0%5D%5Bq%5D=2&items%5B0%5D%5Blang%5D=zh-Hant&cli=testClient&co=US&lang=zh-Hant',
    },
    {
        id: 'parent-locale',
        data: checkoutData,
        pageContext: { pathnames: ['/libs/embed', '/hk_zh/products/foo'] },
        expected:
            'https://commerce.adobe.com/store/commitment?items%5B0%5D%5Bid%5D=offer&items%5B0%5D%5Bq%5D=2&items%5B0%5D%5Blang%5D=zh-Hant&cli=testClient&co=US&lang=zh-Hant',
    },
];

const offer = {
    offerId: 'test-offer',
    productArrangementCode: 'test-pac',
    marketSegments: ['COM'],
    customerSegment: 'INDIVIDUAL',
    offerType: 'BASE',
};

const options = {
    checkoutClientId: 'creative',
    checkoutWorkflowStep: 'segmentation',
    country: 'US',
    language: 'en',
    promotionCode: 'TESTPROMO',
    quantity: [1],
    env: 'prod',
};

export const offerCases = [
    {
        id: 'buy-segmentation',
        offers: [offer],
        options,
        expected:
            'https://commerce-stg.adobe.com/store/segmentation?apc=TESTPROMO&cli=creative&ctx=fp&co=US&lang=en&ms=COM&ot=BASE&cs=INDIVIDUAL&pa=test-pac',
        intent: 'buy',
    },
    {
        id: 'trial-commitment',
        offers: [{ ...offer, offerType: 'TRIAL' }],
        options: { ...options, checkoutWorkflowStep: 'commitment' },
        expected:
            'https://commerce-stg.adobe.com/store/commitment?items%5B0%5D%5Bid%5D=test-offer&apc=TESTPROMO&cli=creative&ctx=fp&co=US&lang=en',
        intent: 'try',
    },
    {
        id: 'edu-preselection',
        offers: [offer],
        options: { ...options, preselectPlan: 'edu' },
        expected:
            'https://commerce-stg.adobe.com/store/segmentation?apc=TESTPROMO&cli=creative&ctx=fp&co=US&lang=en&ms=EDU&ot=BASE&cs=INDIVIDUAL&pa=test-pac',
        intent: 'buy',
    },
    {
        id: 'team-preselection',
        offers: [offer],
        options: { ...options, preselectPlan: 'team' },
        expected:
            'https://commerce-stg.adobe.com/store/segmentation?apc=TESTPROMO&cli=creative&ctx=fp&co=US&lang=en&ms=COM&ot=BASE&cs=TEAM&pa=test-pac',
        intent: 'buy',
    },
    {
        id: 'multiple-offers',
        offers: [offer, { ...offer, offerId: 'test-offer-2', productArrangementCode: 'stock' }],
        options: { ...options, checkoutWorkflowStep: 'email' },
        expected:
            'https://commerce-stg.adobe.com/store/email?items%5B0%5D%5Bid%5D=test-offer&items%5B1%5D%5Bid%5D=test-offer-2&apc=TESTPROMO&cli=creative&ctx=fp&co=US&lang=en',
        intent: 'buy',
    },
];

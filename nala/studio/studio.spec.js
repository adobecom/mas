export default {
    FeatureName: 'M@S Studio',
    features: [
        {
            tcid: '0',
            name: '@studio-load',
            path: '/studio.html',
            tags: '@mas-studio @monitor',
        },
        {
            tcid: '1',
            name: '@studio-direct-search',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#query=',
            tags: '@mas-studio',
        },
        {
            tcid: '2',
            name: '@studio-search-field',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio',
        },
        {
            tcid: '3',
            name: '@studio-empty-card',
            path: '/studio.html',
            data: {
                cardid: '0bf35134-e5e4-4664-88d9-4b78203bf625',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio',
        },
        {
            tcid: '4',
            name: '@studio-goto-content',
            path: '/studio.html',
            tags: '@mas-studio @monitor',
        },
        {
            tcid: '5',
            name: '@studio-ccd-suggested-editor',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ccd @ccd-suggested',
        },
        {
            tcid: '6',
            name: '@studio-ccd-slice-editor',
            path: '/studio.html',
            data: {
                cardid: '8cf16da3-a95d-4186-8a74-e0a2386631a6',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ccd @ccd-slice',
        },
        {
            tcid: '7',
            name: '@studio-try-buy-widget-editor',
            path: '/studio.html',
            data: {
                cardid: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget',
        },
        {
            tcid: '8',
            name: '@studio-card-dblclick-info',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#query=',
            tags: '@mas-studio',
        },
        {
            tcid: '9',
            name: '@studio-plans-individuals-editor',
            path: '/studio.html',
            data: {
                cardid: '2cbfced4-111c-4099-ae9e-65e2c16d8e69',
            },
            browserParams: '#query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals',
        },
        {
            tcid: '10',
            name: '@studio-promoted-plans-editor',
            path: '/studio.html',
            data: {
                cardid: '031e2f50-5cbc-4e4b-af9b-c63f0e4f2a93',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans',
        },
        {
            tcid: '11',
            name: '@studio-promoted-plans-gradient-border',
            path: '/studio.html',
            data: {
                cardid: '031e2f50-5cbc-4e4b-af9b-c63f0e4f2a93',
                gradientBorderColor: 'gradient',
                gradientBorderCSSColor:
                    'linear-gradient(135deg, #ff4885 0%, #b272eb 50%, #5d89ff 100%)',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans',
        },
        {
            tcid: '12',
            name: '@studio-promoted-plans-acrobat-card',
            path: '/studio.html',
            data: {
                cardid: 'c802c222-a573-42ed-a217-301daf2e05d2',
                title: 'Adobe Acrobat',
                iconURL:
                    'https://www.adobe.com/content/dam/shared/images/product-icons/svg/acrobat.svg',
                borderColor: 'spectrum-gray-200',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans',
        },
    ],
};

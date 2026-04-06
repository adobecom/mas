export default {
    FeatureName: 'M@S Studio Translations',
    features: [
        {
            tcid: '0',
            name: '@studio-translations-list-load',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description:
                'Verify that the Translations page loads and displays the translation projects list sorted newest first',
        },
        {
            tcid: '1',
            name: '@translation-editor-cards-table',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @cards',
            description:
                'Select Items Table, Cards Tab and Collapsible Rows: expand/collapse, checkbox select with sidebar and count verification',
        },
        {
            tcid: '2',
            name: '@translation-editor-search-filters',
            path: '/studio.html',
            data: {
                searchTerm: 'grouped',
                filters: {
                    template: 'Plans',
                    marketSegment: 'com',
                    customerSegment: 'Individual',
                    product: 'Creative Cloud Individual Extra Storage',
                },
            },
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor',
            description:
                'Search and Filters: enter search term and apply Template, Market Segment, Customer Segment, Product filters',
        },
        {
            tcid: '3',
            name: '@translation-editor-copy-offer-id',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor',
            description: 'For a row with offer data, click copy button, verify toast "Offer ID copied to clipboard"',
        },
        {
            tcid: '4',
            name: '@translation-editor-view-only',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala&translationProjectId=5bb5b173-eebb-45be-b7a9-49e6e018676c',
            tags: '@mas-studio @translation-editor',
            description: 'Open existing read-only translation project, verify table shows view-only layout',
        },
        {
            tcid: '5',
            name: '@translation-editor-loading-variations',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @cards',
            description: 'Expand grouped variation, verify spinner while variation details load',
        },
        {
            tcid: '6',
            name: '@translation-editor-actions',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @regression',
            description: 'Translation Editor Actions: create project save, add languages overlay, add files overlay',
        },
    ],
};

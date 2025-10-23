export default {
    name: 'MAS Studio Editor Drag and Position',
    features: [
        {
            tcid: '0',
            name: '@studio-editor-drag',
            desc: 'Validate drag functionality for editor panel',
            path: '/studio.html',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                positions: {
                    initial: { x: 100, y: 100 },
                    afterDrag: { x: 300, y: 200 },
                },
            },
            tags: '@studio @editor @drag @mas-studio',
        },
        {
            tcid: '1',
            name: '@studio-editor-position',
            desc: 'Validate position button functionality',
            path: '/studio.html',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
            },
            tags: '@studio @editor @position @mas-studio',
        },
    ],
};

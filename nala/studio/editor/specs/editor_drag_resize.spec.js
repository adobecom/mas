export default {
    name: 'MAS Studio Editor Drag and Resize',
    features: [
        {
            tcid: '0',
            name: '@studio-editor-drag',
            desc: 'Validate drag functionality for editor panel',
            path: '/studio.html',
            browserParams: '?query=',
            data: {
                cardid: 'com-general-fries',
                positions: {
                    initial: { x: 100, y: 100 },
                    afterDrag: { x: 300, y: 200 },
                },
            },
            tags: '@studio @editor @drag @mas-studio',
        },
        {
            tcid: '1',
            name: '@studio-editor-resize',
            desc: 'Validate resize functionality for editor panel',
            path: '/studio.html',
            browserParams: '?query=',
            data: {
                cardid: 'com-general-fries',
                dimensions: {
                    initial: { width: 460, height: 600 },
                    afterResize: { width: 600, height: 800 },
                },
                minSize: { width: 460, height: 400 },
            },
            tags: '@studio @editor @resize @mas-studio',
        },
        {
            tcid: '2',
            name: '@studio-editor-position',
            desc: 'Validate position button functionality',
            path: '/studio.html',
            browserParams: '?query=',
            data: {
                cardid: 'com-general-fries',
            },
            tags: '@studio @editor @position @mas-studio',
        },
        {
            tcid: '3',
            name: '@studio-editor-persistence',
            desc: 'Validate position and size persistence across editor open/close',
            path: '/studio.html',
            browserParams: '?query=',
            data: {
                cardid: 'com-general-fries',
                customPosition: { x: 400, y: 300 },
                customSize: { width: 500, height: 700 },
            },
            tags: '@studio @editor @persistence @mas-studio',
        },
    ],
};

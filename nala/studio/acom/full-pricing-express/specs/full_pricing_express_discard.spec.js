export default {
    FeatureName: 'M@S Studio ACOM Full Pricing Express Discard',
    features: [
        {
            tcid: '1',
            name: '@studio-full-pricing-express-discard-title-changes',
            path: '/studio.html',
            data: {
                cardid: '9406f1ae-7bee-48c3-9892-49af6816033e',
                title: 'Express Free',
                newTitle: 'Express Free Updated',
                discardDialogText: 'Are you sure you want to discard changes?',
            },
            browserParams: '#query=',
            tags: '@studio-full-pricing-express @mas-studio @express',
        },
        {
            tcid: '2',
            name: '@studio-full-pricing-express-discard-shortDescription-changes',
            path: '/studio.html',
            data: {
                cardid: '9406f1ae-7bee-48c3-9892-49af6816033e',
                shortDescription:
                    'For individuals who want Adobe Express Premium plus 4,000 credits for creative AI and Adobe Photoshop on web and mobile for advanced image editing.',
                newShortDescription: 'Updated additional details that should be discarded.',
                discardDialogText: 'Are you sure you want to discard changes?',
            },
            browserParams: '#query=',
            tags: '@studio-full-pricing-express @mas-studio @express',
        },
        {
            tcid: '3',
            name: '@studio-full-pricing-express-discard-confirmation-dialog',
            path: '/studio.html',
            data: {
                cardid: '9406f1ae-7bee-48c3-9892-49af6816033e',
                title: 'Express Free',
                newTitle: 'Discard Confirmation Test',
                discardDialogText: 'Are you sure you want to discard changes?',
            },
            browserParams: '#query=',
            tags: '@studio-full-pricing-express @mas-studio @express',
        },
    ],
};

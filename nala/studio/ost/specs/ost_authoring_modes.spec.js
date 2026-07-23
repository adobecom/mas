// Authoring-mode E2E coverage for the OST. Reuses the dedicated fr_FR OST
// fragment (see ost.spec.js). Each mode is selected via the "Authoring mode"
// picker on the entitlements step, then verified on the offer step.
export { OST_FR_FRAGMENT } from './ost.spec.js';

export default {
    FeatureName: 'M@S Studio OST Authoring Modes',
    features: [
        {
            tcid: '0',
            name: '@studio-ost-mode-single',
            path: '/studio.html',
            data: { product: 'Photoshop' },
            tags: '@mas-studio @ost @ost-e2e @ost-authoring-modes',
        },
        {
            tcid: '1',
            name: '@studio-ost-mode-trybuy',
            path: '/studio.html',
            data: { product: 'Photoshop' },
            tags: '@mas-studio @ost @ost-e2e @ost-authoring-modes',
        },
        {
            tcid: '2',
            name: '@studio-ost-mode-bundle',
            path: '/studio.html',
            data: { product: 'Photoshop' },
            tags: '@mas-studio @ost @ost-e2e @ost-authoring-modes',
        },
        {
            tcid: '3',
            name: '@studio-ost-mode-no-consult',
            path: '/studio.html',
            data: { product: 'Photoshop' },
            tags: '@mas-studio @ost @ost-e2e @ost-authoring-modes',
        },
    ],
};

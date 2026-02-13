import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { VARIANT_NAMES } from '../editors/variant-picker.js';

export const ICON_LIBRARY = [
    { id: 'sp-icon-star', name: 'Star' },
    { id: 'sp-icon-ribbon', name: 'Ribbon' },
    { id: 'sp-icon-page-rule', name: 'Page rule' },
    { id: 'sp-icon-upload-to-cloud', name: 'Upload to cloud' },
    { id: 'sp-icon-upload-to-cloud-outline', name: 'Upload to cloud outline' },
    { id: 'sp-icon-learn', name: 'Learn' },
    { id: 'sp-icon-data-correlated', name: 'Data correlated' },
    { id: 'sp-icon-apps', name: 'Apps' },
    { id: 'sp-icon-camera', name: 'Camera' },
    { id: 'sp-icon-graphic', name: 'Graphic' },
    { id: 'sp-icon-video-filled', name: 'Video' },
    { id: 'sp-icon-brush', name: 'Brush' },
    { id: 'sp-icon-social-network', name: 'Social network' },
];

const VARIANT_SPECTRUM = {
    [VARIANT_NAMES.PLANS]: 'spectrum',
    [VARIANT_NAMES.PLANS_EDUCATION]: 'spectrum',
    [VARIANT_NAMES.PLANS_STUDENTS]: 'spectrum',
    [VARIANT_NAMES.PLANS_V2]: 'spectrum',
    [VARIANT_NAMES.CATALOG]: 'spectrum',
    [VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS]: 'express',
    [VARIANT_NAMES.FULL_PRICING_EXPRESS]: 'express',
};

export const getSpectrumVersion = (variant) => VARIANT_SPECTRUM[variant] || 'spectrum-two';

export const renderSpIcon = (iconName, variant) => {
    return html`<sp-theme color="light" scale="medium" system="${getSpectrumVersion(variant)}"
        >${unsafeHTML(`<${iconName}></${iconName}>`)}</sp-theme
    >`;
};

export const styles = `
    :host {
        display: contents;
        overflow: visible;
    }

    /* CSS tooltip styles - these are local fallbacks, main styles in global.css.js */
    .css-tooltip {
        position: relative;
        display: inline-block;
        cursor: pointer;
    }

    .css-tooltip .css-tooltip-body {
        position: absolute;
        z-index: 999;
        background: var(--spectrum-gray-800, #323232);
        color: #fff;
        padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
        border-radius: 4px;
        white-space: normal;
        width: max-content;
        max-width: 60px;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
            opacity 0.2s ease,
            visibility 0.2s ease;
        font-size: 12px;
        line-height: 1.4;
        text-align: center;
    }

    .css-tooltip::after {
        content: '';
        position: absolute;
        z-index: 999;
        width: 0;
        height: 0;
        border: 6px solid transparent;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
            opacity 0.1s ease,
            visibility 0.1s ease;
    }

    .css-tooltip.tooltip-visible .css-tooltip-body,
    .css-tooltip.tooltip-visible::after,
    .css-tooltip:focus-visible .css-tooltip-body,
    .css-tooltip:focus-visible::after {
        opacity: 1;
        visibility: visible;
    }

    /* Placement variants (CSS-only mode) */
    .css-tooltip.top .css-tooltip-body {
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-bottom: 16px;
    }

    .css-tooltip.top::after {
        top: -80%;
        left: 50%;
        transform: translateX(-50%);
        border-color: var(--spectrum-gray-800, #323232) transparent
            transparent transparent;
    }

    .css-tooltip.bottom .css-tooltip-body {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 10px;
    }

    .css-tooltip.bottom::after {
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 5px;
        border-bottom-color: var(--spectrum-gray-800, #323232);
    }

    .css-tooltip.left .css-tooltip-body {
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: 10px;
        left: var(--tooltip-left-offset, auto);
    }

    .css-tooltip.left::after {
        right: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-right: 5px;
        border-left-color: var(--spectrum-gray-800, #323232);
    }

    .css-tooltip.right .css-tooltip-body {
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: 10px;
    }

    .css-tooltip.right::after {
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: 5px;
        border-right-color: var(--spectrum-gray-800, #323232);
    }

    /* Smart-placement mode: JS-computed fixed positioning + inner arrow span */
    .css-tooltip.smart .css-tooltip-body {
        position: fixed;
        z-index: 100000;
        max-width: 200px;
        overflow: visible;
        /* Cancel CSS-only placement transforms/margins from above */
        transform: none;
        margin: 0;
        bottom: auto;
        right: auto;
    }

    /* Hide the ::after arrow in smart mode; inner span is used instead */
    .css-tooltip.smart::after {
        content: none;
    }

    .css-tooltip-tip {
        position: absolute;
        width: 0;
        height: 0;
        border: 6px solid transparent;
        pointer-events: none;
    }

    /* Inner arrow span: positioned on the side facing the icon */
    .css-tooltip-tip.top {
        top: 100%;
        border-top-color: var(--spectrum-gray-800, #323232);
    }

    .css-tooltip-tip.bottom {
        top: -6px;
        border-bottom-color: var(--spectrum-gray-800, #323232);
    }

    .css-tooltip-tip.left {
        left: 100%;
        border-left-color: var(--spectrum-gray-800, #323232);
    }

    .css-tooltip-tip.right {
        left: -6px;
        border-right-color: var(--spectrum-gray-800, #323232);
    }

    .css-tooltip-body p {
        margin: 0;
    }

    /* Icon-only (no tooltip): keep inline so icons don't block-stack in <p> */
    .icon-only {
        display: inline-block;
    }
`;

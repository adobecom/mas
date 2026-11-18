export const styles = `
    :host {
        --merch-sidenav-padding: 16px;
        --merch-sidenav-collection-gap: 30px;
        /* Title */
        --merch-sidenav-title-font-size: 12px;
        --merch-sidenav-title-font-weight: 400;
        --merch-sidenav-title-line-height: 16px;
        --merch-sidenav-title-color: var(--spectrum-gray-700, #464646);
        --merch-sidenav-title-padding: 6px 12px 16px;
        /* Search */
        --merch-sidenav-search-gap: 10px;
        /* List */
        --merch-sidenav-list-gap: 0;
        --merch-sidenav-list-title-color: var(--spectrum-gray-700, #464646);
        --merch-sidenav-list-title-font-size: 14px;
        --merch-sidenav-list-title-font-weight: 400;
        --merch-sidenav-list-title-padding: 6px 12px 8px;
        --merch-sidenav-list-title-line-height: 18px;
        --merch-sidenav-item-height: unset;
        --merch-sidenav-item-inline-padding: 12px;
        --merch-sidenav-item-font-weight: 400;
        --merch-sidenav-item-font-size: 14px;
        --merch-sidenav-item-line-height: 18px;
        --merch-sidenav-item-label-top-margin: 6px;
        --merch-sidenav-item-label-bottom-margin: 8px;
        --merch-sidenav-item-icon-top-margin: 7px;
        --merch-sidenav-item-icon-gap: 8px;
        --merch-sidenav-item-selected-color: var(--color-black, #000000);
        --merch-sidenav-item-hover-background: var(
            --spectrum-gray-200,
            #e6e6e6
        );
        --merch-sidenav-item-selected-background: var(
            --spectrum-gray-300,
            #d5d5d5
        );
        --merch-sidenav-list-item-gap: 4px;
        /* Checkbox group */
        --merch-sidenav-checkbox-group-title-font-size: 14px;
        --merch-sidenav-checkbox-group-title-font-weight: 400;
        --merch-sidenav-checkbox-group-title-line-height: 18px;
        --merch-sidenav-checkbox-group-title-color: var(
            --spectrum-gray-700,
            #464646
        );
        --merch-sidenav-checkbox-group-title-padding: 6px 0 8px;
        --merch-sidenav-checkbox-group-gap: 32px;
        --merch-sidenav-checkbox-group-padding: 0 12px;
        --merch-sidenav-checkbox-group-label-font-size: 17px;
        --merch-sidenav-checkbox-group-checkbox-spacing: 22px;
        --merch-sidenav-checkbox-group-label-gap: 13px;
        --merch-sidenav-checkbox-group-label-top-margin: 8px;
        --merch-sidenav-checkbox-group-height: 40px;
        /* Modal */
        --merch-sidenav-modal-close-font-size: 15px;
        --merch-sidenav-modal-close-line-height: 19px;
        --merch-sidenav-modal-close-gap: 10px;
        --merch-sidenav-modal-border-radius: 8px;
        --merch-sidenav-modal-padding: var(--merch-sidenav-padding);

        display: block;
        z-index: 2;
        padding: var(--merch-sidenav-padding);
        margin-inline-end: var(--merch-sidenav-collection-gap);
    }

    ::slotted(merch-sidenav-list) {
        --mod-sidenav-min-height: var(--merch-sidenav-item-height);
        --mod-sidenav-inline-padding: var(
            --merch-sidenav-item-inline-padding
        );
        --mod-sidenav-top-level-font-weight: var(
            --merch-sidenav-item-font-weight
        );
        --mod-sidenav-top-level-font-size: var(
            --merch-sidenav-item-font-size
        );
        --mod-sidenav-top-level-line-height: var(
            --merch-sidenav-item-line-height
        );
        --mod-sidenav-top-to-label: var(
            --merch-sidenav-item-label-top-margin
        );
        --mod-sidenav-bottom-to-label: var(
            --merch-sidenav-item-label-bottom-margin
        );
        --mod-sidenav-top-to-icon: var(
            --merch-sidenav-item-icon-top-margin
        );
        --mod-sidenav-icon-spacing: var(--merch-sidenav-item-icon-gap);
        --mod-sidenav-content-color-default-selected: var(
            --merch-sidenav-item-selected-color
        );
        --mod-sidenav-item-background-default-selected: var(
            --merch-sidenav-item-selected-background
        );
        --mod-sidenav-background-hover-selected: var(
            --merch-sidenav-item-hover-background
        );
        --mod-sidenav-gap: var(--merch-sidenav-list-item-gap);
    }

    ::slotted(merch-sidenav-checkbox-group) {
        --mod-checkbox-font-size: var(
            --merch-sidenav-checkbox-group-label-font-size
        );
        --mod-checkbox-spacing: var(
            --merch-sidenav-checkbox-group-checkbox-spacing
        );
        --mod-checkbox-text-to-control: var(
            --merch-sidenav-checkbox-group-label-gap
        );
        --mod-checkbox-top-to-text: var(
            --merch-sidenav-checkbox-group-label-top-margin
        );
        --mod-checkbox-height: var(--merch-sidenav-checkbox-group-height);
    }

    :host h2 {
        color: var(--merch-sidenav-title-color);
        font-size: var(--merch-sidenav-title-font-size);
        font-weight: var(--merch-sidenav-title-font-weight);
        padding: var(--merch-sidenav-title-padding);
        line-height: var(--merch-sidenav-title-line-height);
        margin: 0;
        text-align: start;
    }

    :host-context([dir='rtl']) h2 {
        text-align: right;
    }

    :host(:dir(rtl)) h2 {
        text-align: right;
    }

    #content {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: baseline;
    }

    ::slotted(merch-search) {
        display: block;
        margin-bottom: var(--merch-sidenav-search-gap);
    }

    :host([modal]) ::slotted(merch-search) {
        display: none;
    }

    #sidenav {
        display: flex;
        flex-direction: column;
        max-width: 248px;
        overflow-y: auto;
        place-items: center;
        position: relative;
        width: 100%;
        border-radius: var(--merch-sidenav-modal-border-radius);
        padding: var(--merch-sidenav-modal-padding);
    }

    sp-dialog-base {
        --mod-modal-confirm-border-radius: var(
            --merch-sidenav-modal-border-radius
        );
        --mod-modal-max-height: 100dvh;
    }

    sp-dialog-base #sidenav {
        box-sizing: border-box;
        max-width: 300px;
        max-height: 95dvh;
        background: #ffffff 0% 0% no-repeat padding-box;
        box-shadow: 0px 1px 4px #00000026;
    }

    :host(:not([autoclose])) #sidenav h2 {
        margin-top: calc(
            var(--merch-sidenav-modal-close-gap) +
                var(--merch-sidenav-modal-close-line-height)
        );
    }

    sp-link {
        position: absolute;
        top: 16px;
        inset-inline-end: 16px;
        font-size: var(--merch-sidenav-modal-close-font-size);
        line-height: var(--merch-sidenav-modal-close-line-height);
    }
`;

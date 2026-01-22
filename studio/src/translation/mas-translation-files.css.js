import { css } from 'lit';

export const styles = css`
    .selected-files-count {
        position: fixed;
        bottom: 98px;
        right: 22px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;

        sp-button {
            --mod-button-background-color-default: transparent;
            --mod-button-background-color-hover: var(--spectrum-gray-200);
            font-weight: 500;
        }

        sp-icon-export {
            transform: rotate(180deg);
            transition: transform 0.3s ease-in-out;
        }

        .flipped {
            transform: rotate(0deg);
        }
    }
`;

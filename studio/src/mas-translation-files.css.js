import { css } from 'lit';

export const styles = css`
    .selected-files-count {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
        margin-bottom: 32px;

        sp-button {
            background-color: transparent;
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

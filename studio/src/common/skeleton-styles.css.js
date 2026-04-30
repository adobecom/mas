import { css } from 'lit';

export const skeletonStyles = css`
    .skeleton-element {
        background: linear-gradient(
            90deg,
            var(--spectrum-gray-200) 25%,
            var(--spectrum-gray-100) 50%,
            var(--spectrum-gray-200) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
    }

    .skeleton-table-cell {
        height: 18px;
        width: 80%;
        border-radius: 4px;
    }

    .skeleton-row sp-table-cell {
        padding: 16px 20px;
    }

    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
`;

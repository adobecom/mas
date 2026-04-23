import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';

const FLOWS = [
    {
        id: 'tryBuy',
        title: 'Try / Buy',
        description: 'Create try + buy checkout buttons or price pair',
    },
    {
        id: 'bundle',
        title: 'Soft Bundle',
        description: 'Combine 2+ offers into one price & checkout URL',
    },
    {
        id: 'consult',
        title: 'Consult',
        description: 'Browse and view offer details (read-only)',
    },
];

export class MasOstWelcomeScreen extends LitElement {
    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
            padding: 48px 24px;
            text-align: center;
            font-family: inherit;
        }

        .welcome-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--spectrum-gray-900);
            margin-bottom: 24px;
        }

        .flow-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            max-width: 460px;
            width: 100%;
        }

        .flow-card {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            padding: 20px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 10px;
            background: var(--spectrum-gray-50);
            cursor: pointer;
            text-align: left;
            transition:
                border-color 0.15s,
                background 0.15s,
                box-shadow 0.15s;
        }

        .flow-card:hover {
            border-color: var(--spectrum-blue-700, #1473e6);
            background: var(--spectrum-blue-100, #e0f2ff);
            box-shadow: 0 2px 8px rgba(20, 115, 230, 0.12);
        }

        .flow-card:focus-visible {
            outline: 2px solid var(--spectrum-blue-900);
            outline-offset: 2px;
        }

        .flow-card-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .flow-card-desc {
            font-size: 12px;
            color: var(--spectrum-gray-700);
            line-height: 1.4;
        }
    `;

    handleFlowClick(flowId) {
        store.authoringFlow = flowId;
        store.flowChosen = true;
        store.notify();
    }

    render() {
        return html`
            <div class="welcome-title">What would you like to do?</div>
            <div class="flow-grid">
                ${FLOWS.map(
                    (flow) => html`
                        <div
                            class="flow-card"
                            tabindex="0"
                            role="button"
                            aria-label="${flow.title}: ${flow.description}"
                            @click=${() => this.handleFlowClick(flow.id)}
                            @keydown=${(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    this.handleFlowClick(flow.id);
                                }
                            }}
                        >
                            <span class="flow-card-title">${flow.title}</span>
                            <span class="flow-card-desc">${flow.description}</span>
                        </div>
                    `,
                )}
            </div>
        `;
    }
}

customElements.define('mas-ost-welcome-screen', MasOstWelcomeScreen);

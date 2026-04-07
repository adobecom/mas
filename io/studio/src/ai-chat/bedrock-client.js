/**
 * AWS Bedrock Client
 *
 * Handles communication with AWS Bedrock for Claude Sonnet 4 API calls.
 * Supports two authentication methods (in priority order):
 * 1. Bedrock API Key (bearer token) — uses direct REST API calls
 * 2. IAM credentials (access key + secret) — uses AWS SDK with SigV4
 *
 * Falls back to process.env if credentials not provided (for local development).
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const MAX_HISTORY_TURNS = 10;

function truncateHistory(conversationHistory) {
    if (conversationHistory.length <= MAX_HISTORY_TURNS * 2) return conversationHistory;
    const firstMessage = conversationHistory[0];
    const recentMessages = conversationHistory.slice(-(MAX_HISTORY_TURNS * 2));
    if (recentMessages[0] === firstMessage) return recentMessages;
    return [firstMessage, ...recentMessages];
}

export class BedrockClient {
    constructor(credentials = {}) {
        const bearerToken = credentials.bearerToken || process.env.AWS_BEARER_TOKEN_BEDROCK;
        const region = credentials.region || process.env.AWS_REGION || 'us-west-2';
        const modelId = credentials.modelId || process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

        this.modelId = modelId;
        this.region = region;

        if (bearerToken) {
            this.authMode = 'bearer';
            this.bearerToken = bearerToken;
            this.endpoint = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/invoke`;
            console.log(
                `BedrockClient bearer auth v2: tokenLen=${bearerToken.length}, prefix=${bearerToken.slice(0, 8)}, suffix=${bearerToken.slice(-6)}, modelId=${modelId}`,
            );
        } else {
            const accessKeyId = credentials.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
            const secretAccessKey = credentials.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

            if (!accessKeyId || !secretAccessKey) {
                const errorMsg =
                    'AWS credentials missing: provide AWS_BEARER_TOKEN_BEDROCK or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY';
                console.error(errorMsg);
                throw new Error(errorMsg);
            }

            this.authMode = 'iam';
            this.client = new BedrockRuntimeClient({
                region,
                credentials: { accessKeyId, secretAccessKey },
            });
        }
    }

    /**
     * Send a message to Claude Sonnet 4 via Bedrock
     * @param {Array} messages - Array of message objects {role, content}
     * @param {string} system - System prompt
     * @param {number} maxTokens - Maximum tokens to generate
     * @returns {Promise<Object>} - Claude response
     */
    async sendMessage(messages, system, maxTokens = 4096) {
        const payload = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: maxTokens,
            system,
            messages,
            temperature: 0.7,
        };

        try {
            const responseBody =
                this.authMode === 'bearer' ? await this.#invokeBearerToken(payload) : await this.#invokeSdk(payload);

            return {
                success: true,
                message: responseBody.content[0].text,
                usage: responseBody.usage,
                stopReason: responseBody.stop_reason,
            };
        } catch (error) {
            console.error('Bedrock API Error:', error);
            return {
                success: false,
                error: error.message,
                errorType: error.name,
            };
        }
    }

    async #invokeBearerToken(payload) {
        const response = await fetch(this.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.bearerToken}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.text();
            const debug = `[tokenLen=${this.bearerToken.length} prefix=${this.bearerToken.slice(0, 10)} suffix=${this.bearerToken.slice(-8)} endpoint=${this.endpoint}]`;
            throw new Error(`Bedrock API returned ${response.status}: ${body} ${debug}`);
        }

        return response.json();
    }

    async #invokeSdk(payload) {
        const command = new InvokeModelCommand({
            modelId: this.modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
        });

        const response = await this.client.send(command);
        return JSON.parse(new TextDecoder().decode(response.body));
    }

    /**
     * Send a message with conversation context
     * @param {Array} conversationHistory - Full conversation history
     * @param {string} userMessage - New user message
     * @param {string} system - System prompt
     * @param {Object} context - Additional context (current card config, etc.)
     * @returns {Promise<Object>} - Claude response
     */
    async sendWithContext(conversationHistory, userMessage, system, context = null, maxTokens = 4096) {
        let enhancedSystem = system;

        if (context) {
            enhancedSystem += '\n\n=== CURRENT CONTEXT ===\n';

            if (context.surface) {
                enhancedSystem += `Current surface: ${context.surface}\n`;
            }
            if (context.currentLocale) {
                enhancedSystem += `Current locale: ${context.currentLocale}\n`;
            }
            if (context.currentPath) {
                enhancedSystem += `Current path: ${context.currentPath}\n`;
            }

            if (context.lastOperation) {
                enhancedSystem += '\nLast operation:\n';
                enhancedSystem += `  Type: ${context.lastOperation.type}\n`;
                enhancedSystem += `  Fragment IDs: ${JSON.stringify(context.lastOperation.fragmentIds)}\n`;
                enhancedSystem += `  Count: ${context.lastOperation.count}\n`;
                enhancedSystem += `  Timestamp: ${context.lastOperation.timestamp}\n`;
            }

            if (context.workingSet && context.workingSet.length > 0) {
                enhancedSystem += `\nWorking set (${context.workingSet.length} items):\n`;
                context.workingSet.forEach((item, i) => {
                    let line = `  ${i + 1}. ${item.title} (${item.variant}) [${item.id}]`;
                    if (item.osi) {
                        line += ` osi:${item.osi}`;
                    }
                    enhancedSystem += `${line}\n`;
                });
            }

            if (context.osi) {
                enhancedSystem += '\n=== ATTACHED OFFER ===\n';
                enhancedSystem += `Offer Selector ID: ${context.osi}\n`;

                if (context.offer) {
                    enhancedSystem += `Product: ${context.offer.productName || 'Unknown'}\n`;
                    if (context.offer.name) {
                        enhancedSystem += `Offer Name: ${context.offer.name}\n`;
                    }
                    if (context.offer.offer_type) {
                        enhancedSystem += `Offer Type: ${context.offer.offer_type}\n`;
                    }
                    if (context.offer.commitment) {
                        enhancedSystem += `Commitment: ${context.offer.commitment}\n`;
                    }
                }
                enhancedSystem += '\nIMPORTANT: This is an Offer Selector ID from OST.\n';
                enhancedSystem += `- To get offer details: Use resolve_offer_selector with mcpParams.offerSelectorId = "${context.osi}"\n`;
                enhancedSystem += `- Do NOT use get_offer_by_id (that requires a direct Offer ID)\n`;
            }

            if (context.cards && context.cards.length > 0) {
                enhancedSystem += '\n=== USER-ATTACHED CARDS ===\n';
                enhancedSystem += `The user has attached ${context.cards.length} card(s) to their message:\n`;
                context.cards.forEach((card, i) => {
                    const cardId = typeof card === 'string' ? card : card.id;
                    const osi = typeof card === 'object' ? card.osi : null;
                    enhancedSystem += `  Card ${i + 1}: ID="${cardId}"${osi ? `, OSI="${osi}"` : ''}\n`;
                });

                const firstCard = context.cards[0];
                const firstId = typeof firstCard === 'string' ? firstCard : firstCard.id;
                const firstOsi = typeof firstCard === 'object' ? firstCard.osi : null;
                const allIds = context.cards.map((c) => (typeof c === 'string' ? c : c.id));

                enhancedSystem +=
                    '\nIMPORTANT: When user says "this card" or asks about attached cards, use these IDs directly:\n';
                enhancedSystem += `- For get_card: use mcpParams.id = "${firstId}"\n`;
                enhancedSystem += `- For bulk operations: use mcpParams.fragmentIds = ${JSON.stringify(allIds)}\n`;

                if (firstOsi) {
                    enhancedSystem += `- For offer/pricing queries: Use resolve_offer_selector with mcpParams.offerSelectorId = "${firstOsi}"\n`;
                } else {
                    enhancedSystem += `- For offer/pricing queries: OSI not available. Call get_card first to get the OSI.\n`;
                }
            }
        }

        const truncated = truncateHistory(conversationHistory);
        const messages = [
            ...truncated,
            {
                role: 'user',
                content: userMessage,
            },
        ];

        return this.sendMessage(messages, enhancedSystem, maxTokens);
    }
}

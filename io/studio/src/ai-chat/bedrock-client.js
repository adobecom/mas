/**
 * AWS Bedrock Client
 *
 * Handles communication with AWS Bedrock for Claude Sonnet 4 API calls.
 * Uses permanent IAM user credentials (no session token required).
 *
 * Constructor accepts credentials object with the following properties:
 * - accessKeyId: IAM user access key (starts with AKIA)
 * - secretAccessKey: IAM user secret key
 * - region: AWS region (default: us-west-2)
 * - modelId: Bedrock model ID (default: anthropic.claude-sonnet-4-20250514-v1:0)
 *
 * Falls back to process.env if credentials not provided (for local development).
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export class BedrockClient {
    constructor(credentials = {}) {
        const accessKeyId = credentials.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = credentials.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
        const region = credentials.region || process.env.AWS_REGION || 'us-west-2';
        const modelId = credentials.modelId || process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-20250514-v1:0';

        console.log('BedrockClient initialization:', {
            hasAccessKeyId: !!accessKeyId,
            accessKeyIdPrefix: accessKeyId ? accessKeyId.substring(0, 4) : 'undefined',
            hasSecretAccessKey: !!secretAccessKey,
            region,
            modelId,
        });

        if (!accessKeyId || !secretAccessKey) {
            const errorMsg = `AWS credentials missing: accessKeyId=${!!accessKeyId}, secretAccessKey=${!!secretAccessKey}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        this.client = new BedrockRuntimeClient({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.modelId = modelId;
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

        const command = new InvokeModelCommand({
            modelId: this.modelId,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify(payload),
        });

        try {
            const response = await this.client.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));

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

    /**
     * Send a message with conversation context
     * @param {Array} conversationHistory - Full conversation history
     * @param {string} userMessage - New user message
     * @param {string} system - System prompt
     * @param {Object} context - Additional context (current card config, etc.)
     * @returns {Promise<Object>} - Claude response
     */
    async sendWithContext(conversationHistory, userMessage, system, context = null) {
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

            const attachedCardsInfo =
                context.cards?.map((c) => ({
                    id: typeof c === 'string' ? c : c.id,
                    osi: typeof c === 'object' ? c.osi : null,
                })) || [];

            console.log('[Bedrock] Context sent to AI:', {
                hasLastOperation: !!context.lastOperation,
                fragmentCount: context.lastOperation?.fragmentIds?.length || 0,
                workingSetSize: context.workingSet?.length || 0,
                surface: context.surface,
                locale: context.currentLocale,
                hasOsi: !!context.osi,
                osi: context.osi || null,
                hasOffer: !!context.offer,
                attachedCardsCount: context.cards?.length || 0,
                attachedCards: attachedCardsInfo,
            });
        }

        const messages = [
            ...conversationHistory,
            {
                role: 'user',
                content: userMessage,
            },
        ];

        return this.sendMessage(messages, enhancedSystem);
    }
}

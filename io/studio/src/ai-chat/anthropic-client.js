/**
 * Anthropic Direct API Client
 *
 * Handles communication with Anthropic's Claude API directly (no AWS Bedrock).
 * More cost-effective and simpler than Bedrock with identical model quality.
 */

export class AnthropicClient {
    constructor() {
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        this.modelId = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
        this.baseURL = 'https://api.anthropic.com/v1/messages';
        this.apiVersion = '2023-06-01';

        if (!this.apiKey) {
            throw new Error('ANTHROPIC_API_KEY environment variable is required');
        }
    }

    /**
     * Send a message to Claude via Anthropic API
     * @param {Array} messages - Array of message objects {role, content}
     * @param {string} system - System prompt
     * @param {number} maxTokens - Maximum tokens to generate
     * @returns {Promise<Object>} - Claude response
     */
    async sendMessage(messages, system, maxTokens = 4096) {
        const payload = {
            model: this.modelId,
            max_tokens: maxTokens,
            system,
            messages,
            temperature: 0.7,
        };

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': this.apiVersion,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `Anthropic API error: ${response.status} ${response.statusText}` +
                        (errorData.error?.message ? ` - ${errorData.error.message}` : ''),
                );
            }

            const responseBody = await response.json();

            return {
                success: true,
                message: responseBody.content[0].text,
                usage: responseBody.usage,
                stopReason: responseBody.stop_reason,
            };
        } catch (error) {
            console.error('Anthropic API Error:', error);
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
            enhancedSystem += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
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

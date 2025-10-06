/**
 * AWS Bedrock Client
 *
 * Handles communication with AWS Bedrock for Claude Sonnet 4 API calls.
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export class BedrockClient {
    constructor() {
        this.client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-20250514-v1:0';
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
        // Add context to system prompt if provided
        let enhancedSystem = system;
        if (context) {
            enhancedSystem += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
        }

        // Build messages array
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

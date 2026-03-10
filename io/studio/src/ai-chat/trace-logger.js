/**
 * Structured Trace Logger for AI Chat Action
 *
 * Captures decision-path traces as JSON for debugging and observability.
 * Each request gets a trace object that accumulates data through the pipeline,
 * then emits a single structured log line on completion.
 */

export function createTrace(message) {
    const startTime = Date.now();

    return {
        _data: {
            timestamp: new Date().toISOString(),
            messagePreview: message?.substring(0, 80),
            intent: null,
            promptType: null,
            ragChunks: 0,
            ragSources: [],
            detectedVariant: null,
            responseType: null,
            mcpTool: null,
            tokenUsage: null,
            durationMs: null,
            error: null,
        },

        setIntent(intent) {
            this._data.intent = intent;
        },

        setPromptType(promptType) {
            this._data.promptType = promptType;
        },

        setRAG(sources) {
            this._data.ragChunks = sources?.length || 0;
            this._data.ragSources = (sources || []).map((s) => s.title || s.url || 'unknown');
        },

        setDetectedVariant(variant) {
            this._data.detectedVariant = variant;
        },

        setResponseType(type) {
            this._data.responseType = type;
        },

        setMCPTool(tool) {
            this._data.mcpTool = tool;
        },

        setTokenUsage(usage) {
            this._data.tokenUsage = usage || null;
        },

        setError(error) {
            this._data.error = error?.message || String(error);
        },

        emit() {
            this._data.durationMs = Date.now() - startTime;
            console.log(`[AI_TRACE] ${JSON.stringify(this._data)}`);
        },
    };
}

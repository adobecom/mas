const CLIENT_ID = 'merch-at-scale-studio';

export function logToLana(message, facts, sampleRate) {
    window.lana?.log(`${message}¶page=${window.location.pathname}¶facts=${JSON.stringify(facts)}`, {
        clientId: CLIENT_ID,
        delimiter: '¶',
        sampleRate,
        tags: 'studio',
    });
}

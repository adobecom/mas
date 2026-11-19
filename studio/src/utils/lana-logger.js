const CLIENT_ID = 'merch-at-scale-studio';

export function logToLana(message, facts, sampleRate) {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const page = encodeURIComponent(hash.get('page') ?? '');
    const path = encodeURIComponent(hash.get('path') ?? '');
    window.lana?.log(`${message}¶page=${page}¶path=${path}¶facts=${JSON.stringify(facts)}`, {
        clientId: CLIENT_ID,
        delimiter: '¶',
        sampleRate,
        tags: 'studio',
    });
}

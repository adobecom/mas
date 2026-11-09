const CLIENT_ID = 'merch-at-scale-studio';

export function logToLana(message, facts, sampleRate) {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    window.lana?.log(
        `${message}¶page=${hash.get('page') ?? ''}¶path=${hash.get('path') ?? ''}¶facts=${JSON.stringify(facts)}`,
        {
            clientId: CLIENT_ID,
            delimiter: '¶',
            sampleRate,
            tags: 'studio',
        },
    );
}

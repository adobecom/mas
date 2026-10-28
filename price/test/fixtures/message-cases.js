const values = {
    plural: [0, 1, 2, 3, 11, 22, 3.5].map((n) => ({ n, g: 'a', m: 1 })).concat({}),
    text: [{ g: 'a', x: 'X', y: 'Y' }, { g: 'z', x: 0, y: null }, { x: null, y: null }, {}],
    number: [1234567.891, 0.5, -1].map((n) => ({ n })).concat({}),
    date: [{ d: Date.UTC(2025, 0, 1, 12) }],
    time: [{ d: Date.UTC(2025, 0, 1, 12) }, { d: Date.UTC(2025, 0, 1, 0, 15) }],
};

export function messageCases(golden, parameters = values) {
    const cases = [];
    for (const [group, messages] of Object.entries(golden)) {
        for (const [message, locales] of Object.entries(messages)) {
            for (const [locale, outputs] of Object.entries(locales)) {
                for (const [index, expected] of outputs.entries()) {
                    cases.push({
                        id: `${group}/${locale}/${message}/${index}`,
                        message,
                        locale,
                        parameters: parameters[group][index],
                        expected,
                    });
                }
            }
        }
    }
    return cases;
}

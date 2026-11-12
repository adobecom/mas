const values = {
    text: [{ g: 'a', x: 'X', y: 'Y' }, { g: 'z', x: 0, y: null }, { x: null, y: null }, {}],
    number: [1234567.891, 0.5, -1].map((n) => ({ n })).concat({}),
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

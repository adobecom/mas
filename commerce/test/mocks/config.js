import { priceLiteralsURL } from './fetch.js';

export const mockConfig =
    (
        commerce = {},
        locale = {},
        env = {
            // replace prod with 'local' to enable debugging
            name: 'prod',
        }
    ) =>
    () => ({
        commerce: {
            priceLiteralsURL,
            ...commerce,
        },
        env,
        locale,
    });

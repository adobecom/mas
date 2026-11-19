// Node only: `utils/cache.js`, which uses the client through `context.files`, is also loaded by Studio in the browser.
import filesLib from '@adobe/aio-lib-files';
import { logError } from './log.js';

let files;
let filesInit;

/**
 * Returns the Files client once initialised, `undefined` until then: its first initialisation in a container takes
 * a couple of seconds, which requests do not wait for (their stored responses are then just not read nor written).
 */
function getFilesClient(context) {
    filesInit ??= filesLib
        .init()
        .then((client) => (files = client))
        .catch((error) => {
            logError(`failed to initialise Files: ${error.message}`, context);
            filesInit = undefined;
        });
    return files;
}

function resetFilesClient() {
    files = undefined;
    filesInit = undefined;
}

export { getFilesClient, resetFilesClient };
// code sync

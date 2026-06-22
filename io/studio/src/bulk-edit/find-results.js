const { readResults } = require('./state.js');
const { readExportFullItems, readExportItems } = require('./export.js');

async function resolveFindSourceItems(jobId, job) {
    const stateResults = await readResults(jobId);
    if (stateResults?.length) return stateResults;
    const fullItems = await readExportFullItems(jobId);
    if (fullItems.length) return fullItems;
    if (job?.results?.length) return job.results;
    if (job?.exportReady) {
        try {
            return await readExportItems(jobId);
        } catch {
            return [];
        }
    }
    return [];
}

module.exports = {
    resolveFindSourceItems,
};

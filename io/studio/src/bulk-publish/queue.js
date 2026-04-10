let activeRun = Promise.resolve();

function enqueue(task) {
    const next = activeRun.catch(() => {}).then(() => task());
    activeRun = next.catch(() => {});
    return next;
}

function resetQueue() {
    activeRun = Promise.resolve();
}

module.exports = { enqueue, resetQueue };

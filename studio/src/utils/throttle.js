/**
 * When some UI functions are called too frequently, it can cause performance issues.
 * This function can be used to throttle the function calls to a certain limit.
 * @param {Function} func to throttle
 * @param {Number} limit timeout in ms
 * @returns a throttled version of the input function.
 */
function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function (...args) {
        const context = this;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(
                function () {
                    if (Date.now() - lastRan >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                },
                limit - (Date.now() - lastRan),
            );
        }
    };
}

export default throttle;

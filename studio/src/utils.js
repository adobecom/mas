export function preventDefault(fn) {
    return function (event) {
        event.preventDefault();
        fn(event);
    };
}

export function extractValue(fn) {
    return function (event) {
        fn(event.target.value);
    };
}

export function setHashParam(params, param, value) {
    if (!value) {
        if (params.has(param)) {
            params.delete(param);
        }
    } else {
        params.set(param, value);
    }
}

export function setHashParams(params, obj) {
    Object.keys(obj).map((key) => {
        setHashParam(params, key, obj[key]);
    });
}

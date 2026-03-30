const openwhisk = require('openwhisk');

const DEFAULT_PACKAGE_NAME = 'MerchAtScaleStudio';

function buildSiblingActionName(params = {}, targetActionName, options = {}) {
    if (!targetActionName) {
        throw new Error('Target action name is required');
    }

    const overrideParamName = options.overrideParamName;
    if (overrideParamName && params[overrideParamName]) {
        return params[overrideParamName];
    }

    const currentActionName = params.__ow_action_name;
    if (currentActionName) {
        return currentActionName.replace(/[^/]+$/, targetActionName);
    }

    return `${options.defaultPackageName || DEFAULT_PACKAGE_NAME}/${targetActionName}`;
}

function createRuntimeClient(params = {}, options = {}) {
    const openwhiskFactory = options.openwhiskFactory || openwhisk;
    return openwhiskFactory({
        api_key: params.__ow_api_key,
        apihost: params.__ow_api_host,
        namespace: params.__ow_namespace,
    });
}

async function invokeAsyncAction(actionName, actionParams, params = {}, options = {}) {
    const client = options.client || createRuntimeClient(params, options);
    return client.actions.invoke({
        name: actionName,
        params: actionParams,
        blocking: false,
    });
}

module.exports = {
    DEFAULT_PACKAGE_NAME,
    buildSiblingActionName,
    createRuntimeClient,
    invokeAsyncAction,
};

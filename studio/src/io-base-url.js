const IO_PROJECTS = ['masstudio', 'merchatscale'];
const IO_WORKSPACE = /^[a-z0-9-]{1,40}$/;

/**
 * Studio's IO runtime base URL, from studio.html's query string. The namespace is
 * 14257-<project>[-<workspace>]: io.project picks the console project (masStudio by
 * default; MerchAtScale hosts the Piñata bot workspace), io.studio.env (else aem.env)
 * the workspace. Both land in the host, so only known projects and bare labels count.
 * @param {string} search window.location.search
 * @returns {string}
 */
export function resolveIoBaseUrl(search) {
    const params = new URLSearchParams(search);
    const requestedProject = params.get('io.project');
    const project = IO_PROJECTS.includes(requestedProject) ? requestedProject : 'masstudio';
    const workspace = params.get('io.studio.env') || params.get('aem.env') || '';
    const suffix = IO_WORKSPACE.test(workspace) ? `-${workspace}` : '';
    return `https://14257-${project}${suffix}.adobeioruntime.net/api/v1/web/MerchAtScaleStudio`;
}

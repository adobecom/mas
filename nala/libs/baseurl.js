import pkg from 'axios';

const { head } = pkg;
export async function isBranchURLValid(url) {
    if (url && url.includes('localhost')) {
        console.info(`\nSkipping URL validation for localhost: ${url}`);
        return true;
    }
    try {
        const response = await head(url);
        if (response.status === 200) {
            console.info(`\nURL (${url}) returned a 200 status code. It is valid.`);
            return true;
        } else {
            console.info(`\nURL (${url}) returned a non-200 status code (${response.status}). It is invalid.`);
            return false;
        }
    } catch (error) {
        const status = error.response?.status ?? error.code ?? 'connection failed';
        console.info(`\nError checking URL (${url}): ${status}`);
        return false;
    }
}

import { slackNotification, getLocalConfigs, getSnowCmrUrl } from './helpers.js';

async function main({
    github = getLocalConfigs().github,
    context = getLocalConfigs().context,
    transaction_id = process.env.TRANSACTION_ID,
    change_id = process.env.CHANGE_ID,
    planned_start_time = process.env.PLANNED_START_TIME,
    planned_end_time = process.env.PLANNED_END_TIME,
    path_identifier = '',
} = {}) {
    if (!github || !context) {
        throw new Error('GitHub context is missing. Ensure you are running in the correct environment.');
    }

    const { pull_request } = context.payload;
    if (!pull_request) {
        console.log('No pull_request found in context payload. Skipping notification.');
        return;
    }

    const { number, title, html_url } = pull_request;
    const isOpen = process.env.PR_STATE === 'open';
    const environment = process.env.ENVIRONMENT || 'stage';
    const envLabel = environment === 'stage' ? ' in the QA ServiceNow environment' : '';
    const pathLabel = path_identifier ? ` [${path_identifier.toUpperCase()}]` : '';
    const prefix = isOpen
        ? ':servicenow_logo: ServiceNow Change Request Created and in progress' +
          envLabel +
          pathLabel +
          ': Transaction ID: ' +
          transaction_id +
          '\nPlanned start: ' +
          planned_start_time +
          ' | end: ' +
          planned_end_time +
          '\n'
        : ':servicenow_logo: ServiceNow Change Request Closed' +
          envLabel +
          pathLabel +
          '\n' +
          (change_id && change_id !== 'None'
              ? 'Change ID (CMR): ' + change_id + ', ' + getSnowCmrUrl(change_id) + '\n'
              : 'Change ID (CMR): unknown. Search for it by planned start and end time\n');

    console.log(`Sending SNOW CR notification for PR #${number}: ${title}${pathLabel}`);

    await slackNotification(`${prefix}<${html_url}|PR #${number}>: ${title}.`, process.env.SLACK_WEBHOOK_URL);
}

export default main;

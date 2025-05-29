# refreshUsers.mjs Documentation

This script fetches users from LDAP, deduplicates them, and sends them to a target endpoint to keep a user list synchronized in MAS Studio.

## Core Functionality

1.  **Authenticates** with Adobe IMS to get an access token.
2.  **Fetches LDAP members** from predefined groups across multiple tenants.
3.  **Deduplicates users** based on `userPrincipalName`.
4.  **Sends unique users** to a `TARGET_ENDPOINT`.

## Required Environment Variables

*   `CLIENT_ID`: Adobe I/O client ID.
*   `CLIENT_SECRET`: Adobe I/O client secret.
*   `LDAP_BASE_URL`: LDAP API base URL.
*   `TARGET_ENDPOINT`: Endpoint URL for the user list.
*   `ORG_ID`: Adobe Organization ID.

Missing variables will cause the script to error and exit.

## Obtaining `CLIENT_ID` and `CLIENT_SECRET`

1.  Go to [https://developer.adobe.com/console](https://developer.adobe.com/console).
2.  Select the "**Merch at Scale Studio**" project.
3.  Configure the workspace for OAuth Server-to-Server communication.<br>
    see [https://developer.adobe.com/developer-console/docs/guides/authentication/ServerToServerAuthentication/implementation](https://developer.adobe.com/developer-console/docs/guides/authentication/ServerToServerAuthentication/implementation) for instructions
4.  Find `Client ID` and `Client Secret` under the project's "Credentials" or API integration details.

## Execution

This script is designed to be run from Rundeck.

```bash
node scripts/app/refreshUsers.mjs
```
Ensure all environment variables are set before running.

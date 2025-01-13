# gen-locales.mjs

## Description
The `gen-locales.mjs` script is used to generate locale content tree for a MAS sub tenant in Odin.

## Usage

### Prerequisites
- Node.js installed on your machine

- Required environment variables:
  - `accessToken`: The IMS access token of a user, copy it from your IMS session in MAS Studio.
  - `apiKey`: The API key for authentication, api key used in MAS Studio.

- Required parameters:
  - `bucket`: The AEM bucket name, e.g: author-p22655-e155390 for Odin QA
  - `consumer`: The consumer identifier, e.g: ccd

### Running the Script
3. Run the script:
    ```sh
    export accessToken="your-access-token"
    export apiKey="your-api-key"

    node gen-locales.mjs author-p22655-e155390 drafts
    ```
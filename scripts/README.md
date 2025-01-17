# gen-locales.mjs

## Description
The `gen-locales.mjs` script is used to generate locale content tree for a MAS sub tenant in Odin.

## Usage

### Prerequisites
- Node.js installed on your machine

- Required environment variables:
  - `accessToken`: The IMS access token of a user, copy it from your IMS session in MAS Studio, typically using `copy(adobeid.authorize())` in the console.
  - `apiKey`: The API key for authentication, api key used in MAS Studio.

- Required parameters:
  - `bucket`: The AEM bucket name, e.g: author-p22655-e155390 for Odin QA
  - `consumer`: The consumer identifier, e.g: ccd

### Running the Script
3. Run the script:
    ```sh
    export MAS_ACCESS_TOKEN="your-access-token"
    export MAS_API_KEY="mas-studio"

    node gen-locales.mjs author-p22655-e155390 drafts
    ```
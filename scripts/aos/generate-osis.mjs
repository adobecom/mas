import fetch from 'node-fetch';
const AOS_URL = 'https://aos-stage.adobe.io';
const OFFERS_SELECTORS_API = `${AOS_URL}/offer_selectors`;

const offerUrl = (id) =>
    `${AOS_URL}/offers/${id}?api_key=dexter-commerce-offers`;

// Function to sanitize the token for header use
function getAuthHeader(token) {
    if (!token) return '';
    // Remove any potential problematic characters
    const sanitizedToken = token.trim();
    return `Bearer ${sanitizedToken}`;
}

function getOffers(offerIds) {
    // Get auth token from environment variable
    const authHeader = getAuthHeader(process.env.AOS_TOKEN);
    if (!authHeader) {
        console.error(
            'Error: AOS_TOKEN environment variable is not set or invalid',
        );
        process.exit(1);
    }
    return Promise.allSettled(
        offerIds.map(
            (id) =>
                new Promise((resolve, reject) => {
                    const url = offerUrl(id);
                    console.log(`fetching: ${url}`);
                    return fetch(url, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': 'dexter-commerce-offers',
                            authorization: authHeader,
                        },
                    }).then((response) => {
                        if (!response.ok) {
                            reject(
                                `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
                            );
                            console.error(message);
                        }
                        response
                            .json()
                            .then(resolve)
                            .catch((error) => {
                                console.error(
                                    `Error parsing JSON from ${url}:`,
                                    error.message,
                                );
                                reject(error);
                            });
                    });
                }),
        ),
    );
}

function getOffersOSIS(offers) {
    // Get auth token from environment variable
    const authHeader = getAuthHeader(process.env.AOS_TOKEN);

    return Promise.allSettled(
        offers.map(
            (offer) =>
                new Promise((resolve, reject) => {
                    const {
                        offer_id,
                        product_arrangement_code,
                        buying_program,
                        commitment,
                        term,
                        customer_segment,
                        market_segment,
                        sales_channel,
                        offer_type,
                        price_point,
                    } = offer.value[0];
                    const body = JSON.stringify({
                        product_arrangement_code,
                        buying_program,
                        commitment,
                        term,
                        customer_segment,
                        market_segment,
                        sales_channel,
                        offer_type,
                        price_point,
                        language: 'MULT',
                        country: 'US',
                    });
                    console.log(
                        `Generating OSI for offer: ${offer_id} and body: ${body}`,
                    );
                    return fetch(OFFERS_SELECTORS_API, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': 'dexter-commerce-offers',
                            authorization: authHeader,
                        },
                        body,
                    }).then((response) => {
                        if (!response.ok) {
                            reject(
                                `Failed to generate OSI: ${response.status} ${response.statusText}`,
                            );
                        }
                        response
                            .json()
                            .then(resolve)
                            .catch((error) => {
                                console.error(
                                    `Error parsing JSON from OFFERS_SELECTORS_API:`,
                                    error.message,
                                );
                                reject(error);
                            });
                    });
                }),
        ),
    );
}

async function main() {
    // Verify AOS_TOKEN is set
    if (!process.env.AOS_TOKEN) {
        console.error(
            'Error: AOS_TOKEN environment variable is not set. Please set it before running this script.',
        );
        console.error('Example: export AOS_TOKEN="your_token_here"');
        process.exit(1);
    }

    let args = process.argv.slice(2);
    if (!args.length) {
        console.log('you should provide comma separated offer ids');
        return;
    }
    const offerids = args[0].split(',').map((id) => id.trim());
    const offers = await getOffers(offerids);
    console.log(`Fetched ${offers.length} offers`);
    if (offers.length === 0) {
        console.log('No valid offers found. Exiting.');
        return;
    }
    const osis = await getOffersOSIS(offers);
    console.log('Generated OSIS:', JSON.stringify(osis, null, 2));
}

main().catch((error) => {
    console.error('Error executing script:', error);
    process.exit(1);
});

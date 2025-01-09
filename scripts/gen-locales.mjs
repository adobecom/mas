import https from 'https';

/**
 * This script creates locale tree for the locales below for a given bucket(env) and consumer in Odin.
 * e.g: node gen-locales.mjs author-p22655-e155390 drafts
 */

const locales = [
    'cs_CZ',
    'da_DK',
    'es_ES',
    'fi_FI',
    'hu_HU',
    'id_ID',
    'it_IT',
    'ko_KR',
    'nb_NO',
    'nl_NL',
    'pl_PL',
    'pt_BR',
    'ru_RU',
    'sv_SE',
    'th_TH',
    'tr_TR',
    'uk_UA',
    'vi_VN',
    'zh_CN',
    'zh_TW',
    'ja_JP',
    'de_DE',
    'es_MX',
    'fr_CA',
    'fr_FR',
    'en_US', // displayed first in AEM by default
];

const args = process.argv.slice(2);
const bucket = args[0];
const consumer = args[1];

const jwtToken = process.env.MAS_JWT_TOKEN;
const apiKey = process.env.MAS_API_KEY;

if (!bucket || !consumer || !jwtToken || !apiKey) {
    console.error('Usage: node gen-locales.mjs <bucket> <consumer>');
    console.error(
        'Ensure MAS_JWT_TOKEN and MAS_API_KEY are set as environment variables.',
    );
    process.exit(1);
}

async function run() {
    const batchSize = 5;
    for (let i = 0; i < locales.length; i += batchSize) {
        const batch = locales.slice(i, i + batchSize).map((locale) => ({
            path: `/content/dam/mas/${consumer}/${locale}`,
            title: locale,
        }));

        const options = {
            hostname: `${bucket}.adobeaemcloud.com`,
            path: '/adobe/folders/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Adobe-Accept-Experimental': '1',
                Authorization: `Bearer ${jwtToken}`,
                'x-api-key': apiKey,
            },
        };

        await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(
                            `Batch processed successfully: ${JSON.stringify(batch)}`,
                        );
                        resolve();
                    } else {
                        console.error(
                            `Failed to process batch: ${JSON.stringify(batch)}`,
                            res.statusCode,
                            data,
                        );
                        reject(
                            new Error(
                                `Failed to process batch: ${res.statusCode}`,
                            ),
                        );
                    }
                });
            });

            req.on('error', (error) => {
                console.error(
                    `Error processing batch: ${JSON.stringify(batch)}`,
                    error,
                );
                reject(error);
            });

            req.write(JSON.stringify(batch));
            req.end();
        });
    }

    console.log('All batches processed.');
}

run();

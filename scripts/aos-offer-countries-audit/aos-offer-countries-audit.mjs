#!/usr/bin/env node
/**
 * Audit AOS offer responses: validate that countries in the response
 * include US and include all supported countries.
 *
 * Usage: node scripts/aos-offer-countries-audit/aos-offer-countries-audit.mjs
 * Or with AOS_API_KEY: AOS_API_KEY=your_key node scripts/aos-offer-countries-audit/aos-offer-countries-audit.mjs
 */

import fetch from 'node-fetch';

const AOS_BASE = 'https://aos.adobe.io/offers/{offerId}?service_providers=PRICING&locale=en_us&country=US&api_key=aos';
const MAX_FETCH_TIMEOUT = 15000;

// Offer IDs to audit (from provided list)
const OFFER_IDS = [
    '70C6FDFC57461D5E449597CC8F327CF1',
    'D16C0A08E2BEDC5CFB08CDEFB263BD67',
    '1806D4A496C88306F57A880004071D8C',
    'BB99DAA4399E36DB60A11D60C4AAE6FB',
    '2FFB4BED0F77E1E78AD4E1F26F99A154',
    '65F98D520C6B20248A93C571FF82C359',
];

// From web-components/src/constants.js SUPPORTED_COUNTRIES
const SUPPORTED_COUNTRIES = [
    'AE',
    'AM',
    'AR',
    'AT',
    'AU',
    'AZ',
    'BB',
    'BD',
    'BE',
    'BG',
    'BH',
    'BO',
    'BR',
    'BS',
    'BY',
    'CA',
    'CH',
    'CL',
    'CN',
    'CO',
    'CR',
    'CY',
    'CZ',
    'DE',
    'DK',
    'DO',
    'DZ',
    'EC',
    'EE',
    'EG',
    'ES',
    'FI',
    'FR',
    'GB',
    'GE',
    'GH',
    'GR',
    'GT',
    'HK',
    'HN',
    'HR',
    'HU',
    'ID',
    'IE',
    'IL',
    'IN',
    'IQ',
    'IS',
    'IT',
    'JM',
    'JO',
    'JP',
    'KE',
    'KG',
    'KR',
    'KW',
    'KZ',
    'LA',
    'LB',
    'LK',
    'LT',
    'LU',
    'LV',
    'MA',
    'MD',
    'MO',
    'MT',
    'MU',
    'MX',
    'MY',
    'NG',
    'NI',
    'NL',
    'NO',
    'NP',
    'NZ',
    'OM',
    'PA',
    'PE',
    'PH',
    'PK',
    'PL',
    'PR',
    'PT',
    'PY',
    'QA',
    'RO',
    'RS',
    'RU',
    'SA',
    'SE',
    'SG',
    'SI',
    'SK',
    'SV',
    'TH',
    'TJ',
    'TM',
    'TN',
    'TR',
    'TT',
    'TW',
    'TZ',
    'UA',
    'US',
    'UY',
    'UZ',
    'VE',
    'VN',
    'YE',
    'ZA',
];

function getCountriesFromResponse(data) {
    const countries = new Set();
    const items = Array.isArray(data) ? data : [data];
    for (const item of items) {
        if (item && Array.isArray(item.countries)) {
            item.countries.forEach((c) => countries.add(c));
        }
    }
    return countries;
}

async function fetchOffer(offerId, apiKey = 'aos') {
    const url = AOS_BASE.replace('{offerId}', offerId).replace('api_key=aos', `api_key=${encodeURIComponent(apiKey)}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MAX_FETCH_TIMEOUT);
    const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json();
}

function runAudit(apiKey = 'aos') {
    const results = [];
    return Promise.all(
        OFFER_IDS.map(async (offerId) => {
            try {
                const data = await fetchOffer(offerId, apiKey);
                const countries = getCountriesFromResponse(data);
                const hasUS = countries.has('US');
                const missingSupported = SUPPORTED_COUNTRIES.filter((c) => !countries.has(c));
                const allSupported = missingSupported.length === 0;
                results.push({
                    offerId,
                    ok: true,
                    hasUS,
                    allSupported,
                    countryCount: countries.size,
                    missingSupported,
                });
            } catch (err) {
                results.push({
                    offerId,
                    ok: false,
                    error: err.message,
                });
            }
        }),
    ).then(() => results);
}

function printReport(results) {
    console.log('AOS Offer Countries Audit\n');
    console.log(
        'Endpoint pattern: https://aos.adobe.io/offers/{offerId}?service_providers=PRICING&locale=en_us&country=US&api_key=...\n',
    );

    let passed = 0;
    let failed = 0;

    for (const r of results) {
        console.log(`Offer: ${r.offerId}`);
        if (!r.ok) {
            console.log(`  Status: FAIL – ${r.error}\n`);
            failed += 1;
            continue;
        }
        const usOk = r.hasUS ? '✓' : '✗';
        const supportedOk = r.allSupported ? '✓' : '✗';
        console.log(`  Has US: ${usOk}`);
        console.log(`  All supported countries present: ${supportedOk} (${r.countryCount} countries in response)`);
        if (r.missingSupported.length > 0) {
            console.log(`  Missing supported countries (${r.missingSupported.length}): ${r.missingSupported.join(', ')}`);
        }
        if (r.hasUS && r.allSupported) {
            passed += 1;
            console.log('  Result: PASS');
        } else {
            failed += 1;
            console.log('  Result: FAIL');
        }
        console.log('');
    }

    console.log('---');
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
}

const apiKey = process.env.AOS_API_KEY || 'aos';
runAudit(apiKey)
    .then(printReport)
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });

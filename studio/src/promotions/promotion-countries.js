import { getSurfaceLocales } from '../locales.js';
import { isLocaleTagId, isPznCountryTagId, tagRefToTagId, PZN_TAG_ID_PREFIX } from '../common/utils/personalization-utils.js';

const COUNTRY_TAG_PREFIX = `${PZN_TAG_ID_PREFIX}country/`;

export function toCountryTag(country, tags = []) {
    const matches = [...new Set(tags.map(tagRefToTagId))].filter((tag) => getSelectedCountries([tag]).includes(country));
    const countryWide = matches.filter((tag) => tag.slice(COUNTRY_TAG_PREFIX.length).toUpperCase() === country);
    const candidates = countryWide.length ? countryWide : matches;
    if (!candidates.length) throw new Error(`Cannot resolve an AEM country tag for ${country}.`);
    return [...candidates].sort()[0];
}

const isCountryGeo = (geo) => isPznCountryTagId(tagRefToTagId(geo));

const isPersonalizationGeo = (geo) => {
    const tagId = tagRefToTagId(geo);
    return isLocaleTagId(tagId) || (!!tagId?.startsWith(PZN_TAG_ID_PREFIX) && !isPznCountryTagId(tagId));
};

export function getSelectedCountries(geos = []) {
    const codes = geos
        .filter(isCountryGeo)
        .map((g) => tagRefToTagId(g).slice(COUNTRY_TAG_PREFIX.length).split('_').pop().toUpperCase())
        .filter(Boolean);
    return [...new Set(codes)];
}

export function getPersonalizationGeos(geos = []) {
    return geos.filter(isPersonalizationGeo);
}

export function getEligibleCountries(surfaces = []) {
    if (!surfaces.length) return [];
    const [first, ...rest] = surfaces.map((surface) => new Set(getSurfaceLocales(surface).map(({ country }) => country)));
    return [...first].filter((country) => rest.every((countries) => countries.has(country))).sort();
}

export function setCountriesInGeos(geos = [], countries = [], tags = []) {
    const selected = new Set(countries);
    const existing = new Set(getSelectedCountries(geos));
    return [
        ...geos.filter((geo) => !isCountryGeo(geo) || selected.has(getSelectedCountries([geo])[0])),
        ...countries.filter((country) => !existing.has(country)).map((country) => toCountryTag(country, tags)),
    ];
}

export function setPersonalizationGeos(geos = [], personalizationGeos = []) {
    return [...geos.filter((geo) => !isPersonalizationGeo(geo)), ...personalizationGeos];
}

export function pruneIneligibleCountries(geos = [], surfaces = []) {
    const eligible = new Set(getEligibleCountries(surfaces));
    const selected = getSelectedCountries(geos);
    const kept = selected.filter((country) => eligible.has(country));
    return kept.length === selected.length ? geos : setCountriesInGeos(geos, kept);
}

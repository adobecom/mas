import { getSurfaceLocales } from '../locales.js';
import { isPznCountryTagId, tagRefToTagId, PZN_TAG_ID_PREFIX } from '../common/utils/personalization-utils.js';

const COUNTRY_TAG_PREFIX = `${PZN_TAG_ID_PREFIX}country/`;

export const toCountryTag = (country) => `${COUNTRY_TAG_PREFIX}${country}`;

const isCountryGeo = (geo) => isPznCountryTagId(tagRefToTagId(geo));

const isPersonalizationGeo = (geo) => {
    const tagId = tagRefToTagId(geo);
    return Boolean(tagId?.startsWith(PZN_TAG_ID_PREFIX)) && !isPznCountryTagId(tagId);
};

export function getSelectedCountries(geos = []) {
    return geos
        .filter(isCountryGeo)
        .map((geo) => tagRefToTagId(geo).slice(COUNTRY_TAG_PREFIX.length).toUpperCase())
        .filter(Boolean);
}

export function getPersonalizationGeos(geos = []) {
    return geos.filter(isPersonalizationGeo);
}

export function getEligibleCountries(surfaces = []) {
    if (!surfaces.length) return [];
    const [first, ...rest] = surfaces.map((surface) => new Set(getSurfaceLocales(surface).map(({ country }) => country)));
    return [...first].filter((country) => rest.every((countries) => countries.has(country))).sort();
}

export function setCountriesInGeos(geos = [], countries = []) {
    return [...geos.filter((geo) => !isCountryGeo(geo)), ...countries.map(toCountryTag)];
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

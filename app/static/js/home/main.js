/**
 * Ponto de entrada do módulo Home
 */

import { state } from './state.js';
import { getCountries, fetchCountryDetails } from './api.js';
import { initMap, renderMarkers, focusCountry } from './map.js';
import { renderList, markActive } from './list.js';
import { renderCoverageAvailable, renderCoverageUnavailable, renderPlaceholder } from './details.js';

export function findCountryKey(code) {
    if (!code) return null;
    const target = code.trim().toLowerCase();
    return Object.keys(state.countries).find((k) => k.toLowerCase() === target) || null;
}

export function resolveSearchTerm(term) {
    const byCode = findCountryKey(term);
    if (byCode) return byCode;

    const lower = term.toLowerCase();
    const byName = Object.entries(state.countries)
        .find(([, c]) => (c.name || '').toLowerCase() === lower);
    if (byName) return byName[0];

    const partial = Object.entries(state.countries)
        .filter(([, c]) => (c.name || '').toLowerCase().includes(lower));
    if (partial.length === 1) return partial[0][0];

    return term;
}

export async function checkCoverageByCode(rawCode) {
    const code = rawCode.trim().toUpperCase();
    const matchedKey = findCountryKey(code);

    renderPlaceholder('Consultando cobertura na Tabela Hash...');

    try {
        const result = await fetchCountryDetails(code);
        if (result.found) {
            const key = matchedKey || code;
            state.selectedId = key;
            markActive(key);

            const active = document.querySelector('#country-list li.active');
            if (active) active.scrollIntoView({ block: 'nearest' });

            const country = state.countries[key];
            if (country) {
                focusCountry(key, country);
            }

            renderCoverageAvailable(code, result.data);
        } else {
            state.selectedId = null;
            markActive(null);
            renderCoverageUnavailable(code, result.data);
        }
    } catch (error) {
        console.error('Erro ao consultar cobertura:', error);
        renderPlaceholder('Não foi possível consultar a cobertura.');
    }
}

export async function selectCountry(countryId) {
    await checkCoverageByCode(countryId);
}

export async function initHome() {
    const point = window.initialPoint || { lat: 0, lng: 0, zoom: 4 };
    initMap(point);

    state.countries = await getCountries();

    renderMarkers(state.countries, selectCountry);
    renderList(state.countries, '', state.selectedId, selectCountry);

    const searchInput = document.getElementById('country-search');
    searchInput?.addEventListener('input', (e) => {
        renderList(state.countries, e.target.value, state.selectedId, selectCountry);
    });

    const coverageForm = document.getElementById('coverage-form');
    coverageForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const term = searchInput?.value?.trim();
        if (!term) return;
        await checkCoverageByCode(resolveSearchTerm(term));
    });

    if (window.initialSearchedCode) {
        if (searchInput) searchInput.value = '';
        renderList(state.countries, '', state.selectedId, selectCountry);
        const matchedKey = findCountryKey(window.initialSearchedCode);
        if (matchedKey) {
            state.selectedId = matchedKey;
            markActive(matchedKey);
            const country = state.countries[matchedKey];
            if (country) {
                focusCountry(matchedKey, country);
            }
        }
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initHome();
    });
}

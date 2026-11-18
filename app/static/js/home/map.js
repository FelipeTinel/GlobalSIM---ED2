/**
 * Inicialização e manipulação do Mapa Leaflet da Home
 */

import { state } from './state.js';

export function initMap(point = { lat: 0, lng: 0, zoom: 4 }) {
    state.map = L.map('map', { zoomControl: false }).setView([point.lat, point.lng], point.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 6,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(state.map);

    return state.map;
}

export function renderMarkers(countries, onSelect) {
    // Limpa marcadores anteriores se houver
    Object.values(state.markers).forEach(m => m.remove());
    state.markers = {};

    Object.entries(countries).forEach(([countryId, country]) => {
        if (!country.coordinates) return;
        const marker = L.marker(country.coordinates).addTo(state.map);
        marker.bindTooltip(`${country.name || countryId} (${countryId.toUpperCase()})`);
        marker.on('click', () => onSelect(countryId));
        state.markers[countryId] = marker;
    });
}

export function focusCountry(countryId, country) {
    if (!state.map) return;
    if (country && country.coordinates) {
        state.map.panTo(country.coordinates);
        if (state.markers[countryId]) {
            state.markers[countryId].openTooltip();
        }
    }
}

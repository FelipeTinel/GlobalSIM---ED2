import { el } from '../shared/dom.js';
import { getCoords } from '../shared/coords.js';

let map = null;
let markerLayer = null;
const markers = {};

export function initMap(containerId = 'admin-map') {
    map = L.map(containerId).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 10,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
}

export function renderMarkers(countries, onSelect) {
    markerLayer.clearLayers();
    Object.keys(markers).forEach((key) => delete markers[key]);

    Object.entries(countries).forEach(([id, country]) => {
        const coords = getCoords(country);
        if (!coords) return;

        const marker = L.marker(coords).addTo(markerLayer);
        marker.bindTooltip(el('span', '', country.name || id));
        marker.on('click', () => onSelect(id));
        markers[id] = marker;
    });
}

export function focusCountry(id, country) {
    const coords = getCoords(country);
    if (!coords) return;

    map.flyTo(coords, 5, { duration: 0.6 });
    if (markers[id]) markers[id].openTooltip();
}
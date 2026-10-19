const LABELS = {
    continent: 'Continente',
    provider: 'Provedor',
    tech: 'Tecnologia',
};

const detailsCache = {};
let map;
let markers = {};
let countries = {};

async function initMap() {
    const point = window.initialPoint || { lat: 0, lng: 0, zoom: 4 };

    map = L.map('map', { zoomControl: false }).setView([point.lat, point.lng], point.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 4,
        maxZoom: 4,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    try {
        const response = await fetch('/api/countries');
        countries = await response.json();
    } catch (error) {
        console.error("Erro ao carregar países:", error);
        return;
    }

    Object.entries(countries).forEach(([countryId, country]) => {
        const marker = L.marker(country.coordinates).addTo(map);
        marker.bindTooltip(country.name || countryId);
        marker.on('click', () => selectCountry(countryId));
        markers[countryId] = marker;
    });

    renderList('');
    document.getElementById('country-search')
        .addEventListener('input', (e) => renderList(e.target.value));
}

function renderList(filter) {
    const list = document.getElementById('country-list');
    const term = filter.trim().toLowerCase();
    list.innerHTML = '';

    Object.entries(countries)
        .filter(([id, c]) => (c.name || id).toLowerCase().includes(term))
        .sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || '', 'pt'))
        .forEach(([id, c]) => {
            const li = document.createElement('li');
            li.textContent = c.name || id;
            li.dataset.id = id;
            li.addEventListener('click', () => selectCountry(id));
            list.appendChild(li);
        });

    if (selectedId) markActive(selectedId);
}

let selectedId = null;

function markActive(countryId) {
    document.querySelectorAll('#country-list li').forEach(li => {
        li.classList.toggle('active', li.dataset.id === countryId);
    });
}

async function selectCountry(countryId) {
    selectedId = countryId;
    markActive(countryId);

    const active = document.querySelector('#country-list li.active');
    if (active) active.scrollIntoView({ block: 'nearest' });

    const country = countries[countryId];
    if (country && country.coordinates) {
        map.panTo(country.coordinates);
    }

    const panel = document.getElementById('details-panel');
    panel.innerHTML = '<p class="placeholder">Carregando...</p>';

    try {
        if (!detailsCache[countryId]) {
            detailsCache[countryId] = await fetchCountryDetails(countryId);
        }
        if (selectedId === countryId) {
            renderDetails(countryId, detailsCache[countryId]);
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        panel.innerHTML = '<p class="placeholder">Não foi possível carregar os detalhes.</p>';
    }
}

function formatValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
}

function renderDetails(countryId, details) {
    const panel = document.getElementById('details-panel');
    panel.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = details.name || countryId;
    panel.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'details-grid';

    Object.entries(details)
        .filter(([key]) => key !== 'name')
        .forEach(([key, value]) => {
            const item = document.createElement('div');

            const label = document.createElement('span');
            label.className = 'label';
            label.textContent = LABELS[key] || key;

            const val = document.createElement('span');
            val.className = 'value';
            val.textContent = formatValue(value);

            item.append(label, val);
            grid.appendChild(item);
        });

    panel.appendChild(grid);
}

async function fetchCountryDetails(countryId) {
    const response = await fetch(`/api/countries/${countryId}`, {
        method: 'GET',
        headers: { 'Content-type': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
}

document.addEventListener("DOMContentLoaded", () => {
    initMap();
});
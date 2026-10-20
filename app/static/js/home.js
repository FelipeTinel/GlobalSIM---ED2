let map;
let markers = {};
let countries = {};
let selectedId = null;

async function initMap() {
    const point = window.initialPoint || { lat: 0, lng: 0, zoom: 4 };

    map = L.map('map', { zoomControl: false }).setView([point.lat, point.lng], point.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 6,
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
        if (!country.coordinates) return;
        const marker = L.marker(country.coordinates).addTo(map);
        marker.bindTooltip(`${country.name || countryId} (${countryId.toUpperCase()})`);
        marker.on('click', () => selectCountry(countryId));
        markers[countryId] = marker;
    });

    renderList('');
    const searchInput = document.getElementById('country-search');
    searchInput.addEventListener('input', (e) => renderList(e.target.value));

    // Enter na busca: consulta a cobertura na Tabela Hash (por código ou nome)
    const coverageForm = document.getElementById('coverage-form');
    if (coverageForm) {
        coverageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const term = searchInput.value.trim();
            if (!term) return;
            await checkCoverageByCode(resolveSearchTerm(term));
        });
    }

    if (window.initialSearchedCode) {
        searchInput.value = '';
        renderList('');
        const matchedKey = findCountryKey(window.initialSearchedCode);
        if (matchedKey) {
            selectedId = matchedKey;
            markActive(matchedKey);
            const country = countries[matchedKey];
            if (country && country.coordinates) {
                map.panTo(country.coordinates);
            }
        }
    }
}

function findCountryKey(code) {
    const target = code.trim().toLowerCase();
    return Object.keys(countries).find((k) => k.toLowerCase() === target) || null;
}

// Converte o texto digitado em código: aceita código ("it") ou nome ("Itália").
function resolveSearchTerm(term) {
    const byCode = findCountryKey(term);
    if (byCode) return byCode;

    const lower = term.toLowerCase();
    const byName = Object.entries(countries)
        .find(([, c]) => (c.name || '').toLowerCase() === lower);
    if (byName) return byName[0];

    const partial = Object.entries(countries)
        .filter(([, c]) => (c.name || '').toLowerCase().includes(lower));
    if (partial.length === 1) return partial[0][0];

    return term;
}

function renderList(filter) {
    const list = document.getElementById('country-list');
    const term = filter.trim().toLowerCase();
    list.innerHTML = '';

    Object.entries(countries)
        .filter(([id, c]) => {
            const name = (c.name || '').toLowerCase();
            return name.includes(term) || id.toLowerCase().includes(term);
        })
        .sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || '', 'pt'))
        .forEach(([id, c]) => {
            const li = document.createElement('li');
            li.dataset.id = id;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = c.name || id;

            const codeSpan = document.createElement('span');
            codeSpan.className = 'list-code';
            codeSpan.textContent = id.toUpperCase();

            li.append(nameSpan, codeSpan);
            li.addEventListener('click', () => selectCountry(id));
            list.appendChild(li);
        });

    if (selectedId) markActive(selectedId);
}

function markActive(countryId) {
    document.querySelectorAll('#country-list li').forEach(li => {
        li.classList.toggle('active', li.dataset.id === countryId);
    });
}

async function checkCoverageByCode(rawCode) {
    const code = rawCode.trim().toUpperCase();
    const matchedKey = findCountryKey(code);

    const panel = document.getElementById('details-panel');
    panel.innerHTML = '<p class="placeholder">Consultando cobertura na Tabela Hash...</p>';

    try {
        const result = await fetchCountryDetails(code);
        if (result.found) {
            const key = matchedKey || code;
            selectedId = key;
            markActive(key);

            const active = document.querySelector('#country-list li.active');
            if (active) active.scrollIntoView({ block: 'nearest' });

            const country = countries[key];
            if (country && country.coordinates) {
                map.panTo(country.coordinates);
                if (markers[key]) markers[key].openTooltip();
            }

            renderCoverageAvailable(code, result.data);
        } else {
            selectedId = null;
            markActive(null);
            renderCoverageUnavailable(code, result.data);
        }
    } catch (error) {
        console.error("Erro ao consultar cobertura:", error);
        panel.innerHTML = '<p class="placeholder">Não foi possível consultar a cobertura.</p>';
    }
}

async function selectCountry(countryId) {
    await checkCoverageByCode(countryId);
}

function formatValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
}

function renderCoverageAvailable(countryId, details) {
    const panel = document.getElementById('details-panel');
    panel.innerHTML = '';

    const code = (details.code || countryId).toUpperCase();
    const headerRow = document.createElement('div');
    headerRow.className = 'details-header-row';

    const title = document.createElement('h2');
    title.textContent = `${details.name || code} (${code})`;

    const badge = document.createElement('span');
    badge.className = 'coverage-badge available';
    badge.textContent = 'COBERTURA DISPONÍVEL';

    headerRow.append(title, badge);
    panel.appendChild(headerRow);

    const grid = document.createElement('div');
    grid.className = 'details-grid';

    const fields = [
        ['País', details.name],
        ['Código', code],
        ['Região', details.continent],
        ['Operadora', details.provider],
        ['Tecnologia', details.tech],
    ];

    if (details.bucket !== undefined && details.bucket !== null) {
        const compCount = details.comparisons ?? 1;
        fields.push(['Tabela Hash', `Bucket #${details.bucket} (${compCount} comp.)`]);
    }

    fields.forEach(([labelText, value]) => {
        const item = document.createElement('div');

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = labelText;

        const val = document.createElement('span');
        val.className = 'value';
        val.textContent = formatValue(value);

        item.append(label, val);
        grid.appendChild(item);
    });

    panel.appendChild(grid);
}

function renderCoverageUnavailable(code, errorData) {
    const panel = document.getElementById('details-panel');
    panel.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'details-header-row';

    const title = document.createElement('h2');
    title.textContent = `Código: ${code.toUpperCase()}`;

    const badge = document.createElement('span');
    badge.className = 'coverage-badge unavailable';
    badge.textContent = 'COBERTURA INDISPONÍVEL';

    headerRow.append(title, badge);
    panel.appendChild(headerRow);

    const msg = document.createElement('p');
    msg.className = 'placeholder';
    const bucketInfo = (errorData && errorData.bucket !== undefined && errorData.bucket !== null)
        ? ` (verificado no Bucket #${errorData.bucket} com ${errorData.comparisons ?? 0} comparação(ões))`
        : '';
    msg.textContent = `O código "${code.toUpperCase()}" não possui cobertura cadastrada na GlobalSIM${bucketInfo}.`;
    panel.appendChild(msg);
}

async function fetchCountryDetails(countryId) {
    const response = await fetch(`/api/countries/${encodeURIComponent(countryId)}`, {
        method: 'GET',
        headers: { 'Content-type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 404) {
        return { found: false, data };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { found: true, data };
}

document.addEventListener("DOMContentLoaded", () => {
    initMap();
});

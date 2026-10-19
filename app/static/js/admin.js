export async function getCountries() {
    try {
        const response = await fetch('/admin/api/countries', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Erro ao buscar países");

        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function createCountry(countryData) {
    try {
        const response = await fetch('/admin/api/countries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(countryData)
        });

        if (!response.ok) throw new Error("Erro ao criar país");

        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

export async function updateCountry(countryId, countryData) {
    try {
        const response = await fetch(`/admin/api/countries/${countryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(countryData)
        });

        if (!response.ok) throw new Error("Erro ao atualizar país");

        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

export async function deleteCountry(countryId) {
    try {
        const response = await fetch(`/admin/api/countries/${countryId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error("Erro ao deletar país");

        return await response.json();
    } catch (error) {
        console.error(error);
    }
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------
let countriesData = {};
let editingCountryId = null;
let selectedId = null;
let map = null;
let markerLayer = null;
const markers = {};

const $ = (id) => document.getElementById(id);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// Aceita tanto {lat, lng} quanto {coordinates: [lat, lng]}
function getCoords(country) {
    if (country.lat != null && country.lng != null) return [country.lat, country.lng];
    if (Array.isArray(country.coordinates) && country.coordinates.length === 2) return country.coordinates;
    return null;
}

// ---------------------------------------------------------------------------
// Mapa
// ---------------------------------------------------------------------------
function initMap() {
    map = L.map('admin-map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2,
        maxZoom: 10,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);
}

function refreshMarkers() {
    markerLayer.clearLayers();
    Object.keys(markers).forEach((key) => delete markers[key]);

    Object.entries(countriesData).forEach(([id, country]) => {
        const coords = getCoords(country);
        if (!coords) return;

        const marker = L.marker(coords).addTo(markerLayer);
        marker.bindTooltip(el('span', '', country.name || id));
        marker.on('click', () => selectCountry(id));
        markers[id] = marker;
    });
}

// ---------------------------------------------------------------------------
// Lista e seleção
// ---------------------------------------------------------------------------
export async function loadCountryList() {
    const data = await getCountries();
    countriesData = (data && !Array.isArray(data)) ? data : {};

    if (selectedId && !countriesData[selectedId]) selectedId = null;

    const list = $('countries-list');
    list.innerHTML = '';

    const entries = Object.entries(countriesData)
        .sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || '', 'pt'));

    $('countries-count').textContent = entries.length;

    if (entries.length === 0) {
        const empty = el('li', 'placeholder', 'Nenhum país cadastrado.');
        empty.style.padding = '8px 0';
        list.appendChild(empty);
    }

    entries.forEach(([id, country]) => {
        const li = el('li', 'country-item');
        li.dataset.id = id;

        const main = el('div', 'country-main');
        main.append(
            el('span', 'country-name', country.name || 'Sem nome'),
            el('span', 'country-meta', [country.continent, country.provider].filter(Boolean).join(' · '))
        );

        const actions = el('div', 'item-actions');
        const editBtn = el('button', 'btn-edit', 'Editar');
        editBtn.type = 'button';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startEdit(id);
        });

        const deleteBtn = el('button', 'btn-delete', 'Excluir');
        deleteBtn.type = 'button';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleDelete(id);
        });
        actions.append(editBtn, deleteBtn);

        li.append(el('span', 'country-code', id.toUpperCase()), main, actions);
        li.addEventListener('click', () => selectCountry(id));
        list.appendChild(li);
    });

    refreshMarkers();
    markActive();
    renderDetails();
}

function markActive() {
    document.querySelectorAll('#countries-list .country-item').forEach((li) => {
        const active = li.dataset.id === selectedId;
        li.classList.toggle('active', active);
        if (active) li.scrollIntoView({ block: 'nearest' });
    });
}

function selectCountry(id) {
    if (!countriesData[id]) return;
    selectedId = id;
    markActive();
    renderDetails();

    const coords = getCoords(countriesData[id]);
    if (coords) {
        map.flyTo(coords, 5, { duration: 0.6 });
        if (markers[id]) markers[id].openTooltip();
    }
}

function renderDetails() {
    const card = $('details-card');
    card.innerHTML = '';

    const country = countriesData[selectedId];
    if (!country) {
        card.appendChild(el('p', 'placeholder', 'Selecione um país na lista ou no mapa para ver os detalhes.'));
        return;
    }

    const header = el('div', 'details-header');
    header.appendChild(el('h2', 'section-title', country.name || selectedId));

    const actions = el('div', 'item-actions');
    const editBtn = el('button', 'btn-edit', 'Editar');
    editBtn.type = 'button';
    editBtn.addEventListener('click', () => startEdit(selectedId));

    const deleteBtn = el('button', 'btn-delete', 'Excluir');
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => handleDelete(selectedId));
    actions.append(editBtn, deleteBtn);
    header.appendChild(actions);
    card.appendChild(header);

    const coords = getCoords(country);
    const fields = [
        ['ID', selectedId.toUpperCase()],
        ['Continente', country.continent],
        ['Operadora', country.provider],
        ['Tecnologia', country.tech],
        ['Latitude', coords ? coords[0] : null],
        ['Longitude', coords ? coords[1] : null],
    ];

    const grid = el('div', 'info-grid');
    fields.forEach(([label, value]) => {
        const item = el('div');
        item.append(
            el('span', 'info-label', label),
            el('span', 'info-value', value === null || value === undefined || value === '' ? '—' : String(value))
        );
        grid.appendChild(item);
    });
    card.appendChild(grid);
}

// ---------------------------------------------------------------------------
// Formulário: criar x editar
// ---------------------------------------------------------------------------
function setFormMode(editing) {
    $('form-title').textContent = editing ? 'Editar País' : 'Cadastrar País';
    $('form-mode').hidden = !editing;
    $('editing-label').textContent = editing ? editingCountryId.toUpperCase() : '';
    $('submit-btn').textContent = editing ? 'Salvar alterações' : 'Salvar País';
    $('cancel-btn').hidden = !editing;
    $('country-id').disabled = editing;
}

function resetForm() {
    $('country-form').reset();
    editingCountryId = null;
    setFormMode(false);
}

function startEdit(id) {
    const country = countriesData[id];
    if (!country) return;

    editingCountryId = id;
    const coords = getCoords(country) || ['', ''];

    $('country-id').value = id;
    $('country-name').value = country.name || '';
    $('country-lat').value = coords[0];
    $('country-lng').value = coords[1];
    $('country-continent').value = country.continent || '';
    $('country-provider').value = country.provider || '';
    $('country-tech').value = country.tech || '';

    setFormMode(true);
    selectCountry(id);
    $('country-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function handleDelete(id) {
    const name = (countriesData[id] && countriesData[id].name) || id;
    if (!confirm(`Excluir "${name}"? Essa ação não pode ser desfeita.`)) return;

    await deleteCountry(id);

    if (editingCountryId === id) resetForm();
    if (selectedId === id) selectedId = null;

    await loadCountryList();
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Painel do ADM funcional");
    initMap();
    await loadCountryList();

    const form = $('country-form');

    $('cancel-btn').addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const isEditing = editingCountryId !== null;
        const id = isEditing ? editingCountryId : $('country-id').value.trim();
        if (!id) return;

        // Criando um país novo: não deixa sobrescrever um que já existe
        if (!isEditing) {
            const exists = Object.keys(countriesData).some(
                (key) => key.toLowerCase() === id.toLowerCase()
            );
            if (exists) {
                alert(`Já existe um país com o ID "${id}". Use o botão Editar na lista para alterá-lo.`);
                return;
            }
        }

        const countryData = {
            code: id,
            name: $('country-name').value.trim(),
            lat: parseFloat($('country-lat').value),
            lng: parseFloat($('country-lng').value),
            continent: $('country-continent').value.trim(),
            provider: $('country-provider').value.trim(),
            tech: $('country-tech').value.trim()
        };

        const result = isEditing
            ? await updateCountry(id, countryData)
            : await createCountry(countryData);

        if (result === null || result === undefined) {
            alert("Ocorreu um erro ao salvar os dados. Verifique o console.");
            return;
        }

        resetForm();
        await loadCountryList();

        const key = Object.keys(countriesData).find((k) => k.toLowerCase() === id.toLowerCase());
        if (key) selectCountry(key);
    });
});
import { $ } from '../shared/dom.js';
import { getCoords } from '../shared/coords.js';

// editingId = null → modo "cadastrar"; string → modo "editar"
function setFormMode(editingId) {
    const editing = editingId !== null;

    $('form-title').textContent = editing ? 'Editar País' : 'Cadastrar País';
    $('form-mode').hidden = !editing;
    $('editing-label').textContent = editing ? editingId.toUpperCase() : '';
    $('submit-btn').textContent = editing ? 'Salvar alterações' : 'Salvar País';
    $('cancel-btn').hidden = !editing;
    $('country-id').disabled = editing;
}

export function bindForm({ onSubmit, onCancel }) {
    $('country-form').addEventListener('submit', (e) => {
        e.preventDefault();
        onSubmit();
    });
    $('cancel-btn').addEventListener('click', onCancel);
}

export function readForm() {
    return {
        id: $('country-id').value.trim(),
        name: $('country-name').value.trim(),
        lat: parseFloat($('country-lat').value),
        lng: parseFloat($('country-lng').value),
        continent: $('country-continent').value.trim(),
        provider: $('country-provider').value.trim(),
        tech: $('country-tech').value.trim(),
    };
}

export function fillForm(id, country) {
    const coords = getCoords(country) || ['', ''];

    $('country-id').value = id;
    $('country-name').value = country.name || '';
    $('country-lat').value = coords[0];
    $('country-lng').value = coords[1];
    $('country-continent').value = country.continent || '';
    $('country-provider').value = country.provider || '';
    $('country-tech').value = country.tech || '';

    setFormMode(id);
    $('country-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function resetForm() {
    $('country-form').reset();
    setFormMode(null);
}
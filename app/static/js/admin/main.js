import { state } from './state.js';
import { getCountries, createCountry, updateCountry, deleteCountry } from './api.js';
import { initMap, renderMarkers, focusCountry } from './map.js';
import { renderList, markActive } from './list.js';
import { renderDetails } from './details.js';
import { bindForm, fillForm, readForm, resetForm } from './form.js';

const handlers = {
    onSelect: selectCountry,
    onEdit: startEdit,
    onDelete: handleDelete,
};

async function loadCountries() {
    const data = await getCountries();
    state.countries = (data && !Array.isArray(data)) ? data : {};

    if (state.selectedId && !state.countries[state.selectedId]) state.selectedId = null;

    renderList(state.countries, state.selectedId, handlers);
    renderMarkers(state.countries, selectCountry);
    renderDetails(state.selectedId, state.countries[state.selectedId], handlers);
}

function selectCountry(id) {
    const country = state.countries[id];
    if (!country) return;

    state.selectedId = id;
    markActive(id);
    renderDetails(id, country, handlers);
    focusCountry(id, country);
}

function startEdit(id) {
    const country = state.countries[id];
    if (!country) return;

    state.editingId = id;
    fillForm(id, country);
    selectCountry(id);
}

function cancelEdit() {
    state.editingId = null;
    resetForm();
}

async function handleDelete(id) {
    const name = (state.countries[id] && state.countries[id].name) || id;
    if (!confirm(`Excluir "${name}"? Essa ação não pode ser desfeita.`)) return;

    await deleteCountry(id);

    if (state.editingId === id) cancelEdit();
    if (state.selectedId === id) state.selectedId = null;

    await loadCountries();
}

async function handleSubmit() {
    const { id: typedId, ...fields } = readForm();
    const isEditing = state.editingId !== null;
    const id = isEditing ? state.editingId : typedId;
    if (!id) return;

    // Criando: não deixa sobrescrever um país que já existe
    if (!isEditing) {
        const exists = Object.keys(state.countries).some(
            (key) => key.toLowerCase() === id.toLowerCase()
        );
        if (exists) {
            alert(`Já existe um país com o ID "${id}". Use o botão Editar na lista para alterá-lo.`);
            return;
        }
    }

    const countryData = { code: id, ...fields };
    const result = isEditing
        ? await updateCountry(id, countryData)
        : await createCountry(countryData);

    if (result === null || result === undefined) {
        alert("Ocorreu um erro ao salvar os dados. Verifique o console.");
        return;
    }

    cancelEdit();
    await loadCountries();

    const key = Object.keys(state.countries).find((k) => k.toLowerCase() === id.toLowerCase());
    if (key) selectCountry(key);
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Painel do ADM funcional");
    initMap();
    bindForm({ onSubmit: handleSubmit, onCancel: cancelEdit });
    await loadCountries();
});
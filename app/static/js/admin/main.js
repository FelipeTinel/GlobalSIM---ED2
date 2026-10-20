import { state } from './state.js';
import { getCountries, getCountry, getInstrumentation, createCountry, updateCountry, deleteCountry } from './api.js';
import { initMap, renderMarkers, focusCountry } from './map.js';
import { renderList, markActive } from './list.js';
import { renderDetails } from './details.js';
import { bindForm, fillForm, readForm, resetForm } from './form.js';
import { bindInstrumentationSearch, renderInstrumentation, renderSearchFeedback } from './instrumentation.js';

const handlers = {
    onSelect: selectCountry,
    onEdit: startEdit,
    onDelete: handleDelete,
};

async function refreshInstrumentation() {
    const inst = await getInstrumentation();
    renderInstrumentation(inst, (code) => {
        const key = findCountryKey(code);
        if (key) selectCountry(key);
    });
    return inst;
}

function findCountryKey(code) {
    if (!code) return null;
    const target = code.trim().toLowerCase();
    return Object.keys(state.countries).find((k) => k.toLowerCase() === target) || null;
}

async function loadCountries() {
    const data = await getCountries();
    state.countries = (data && !Array.isArray(data)) ? data : {};

    if (state.selectedId && !state.countries[state.selectedId]) state.selectedId = null;

    renderList(state.countries, state.selectedId, handlers);
    renderMarkers(state.countries, selectCountry);
    renderDetails(state.selectedId, state.countries[state.selectedId], handlers);
    await refreshInstrumentation();
}

async function selectCountry(id) {
    const country = state.countries[id];
    if (!country) return;

    state.selectedId = id;
    markActive(id);
    renderDetails(id, country, handlers);
    focusCountry(id, country);

    await getCountry(id);
    const inst = await refreshInstrumentation();
    if (inst && inst.last_search_key) {
        renderSearchFeedback(
            `Busca na Tabela Hash por "${inst.last_search_key}": encontrado no Bucket #${inst.last_search_bucket} com ${inst.last_search_comparisons} comparação(ões).`
        );
    }
}

async function handleSimulateSearch(rawKey) {
    const key = rawKey.trim().toUpperCase();
    const res = await getCountry(key);
    const inst = await refreshInstrumentation();

    const matchedKey = findCountryKey(key);
    if (res.ok && matchedKey) {
        state.selectedId = matchedKey;
        markActive(matchedKey);
        renderDetails(matchedKey, state.countries[matchedKey], handlers);
        focusCountry(matchedKey, state.countries[matchedKey]);
    }

    if (inst) {
        const statusMsg = res.ok
            ? `encontrado (${res.data.country || key})`
            : 'não encontrado';
        renderSearchFeedback(
            `Busca na Tabela Hash por "${key}": ${statusMsg} — Bucket #${inst.last_search_bucket} inspecionado com ${inst.last_search_comparisons} comparação(ões).`
        );
    }
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

    renderSearchFeedback(null);
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

    const key = findCountryKey(id);
    if (key) selectCountry(key);
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Painel do ADM funcional");
    initMap();
    bindForm({ onSubmit: handleSubmit, onCancel: cancelEdit });
    bindInstrumentationSearch(handleSimulateSearch);
    await loadCountries();
});

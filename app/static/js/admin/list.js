import { $, el } from '../shared/dom.js';
import { createActionButtons } from './components.js';

export function renderList(countries, selectedId, { onSelect, onEdit, onDelete }) {
    const list = $('countries-list');
    list.innerHTML = '';

    const entries = Object.entries(countries)
        .sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || '', 'pt'));

    $('countries-count').textContent = entries.length;

    if (entries.length === 0) {
        const empty = el('li', 'placeholder', 'Nenhum país cadastrado.');
        empty.style.padding = '8px 0';
        list.appendChild(empty);
        return;
    }

    entries.forEach(([id, country]) => {
        const li = el('li', 'country-item');
        li.dataset.id = id;

        const main = el('div', 'country-main');
        main.append(
            el('span', 'country-name', country.name || 'Sem nome'),
            el('span', 'country-meta', [country.continent, country.provider].filter(Boolean).join(' · '))
        );

        li.append(
            el('span', 'country-code', id.toUpperCase()),
            main,
            createActionButtons(id, { onEdit, onDelete })
        );
        li.addEventListener('click', () => onSelect(id));
        list.appendChild(li);
    });

    markActive(selectedId);
}

export function markActive(selectedId) {
    document.querySelectorAll('#countries-list .country-item').forEach((li) => {
        const active = li.dataset.id === selectedId;
        li.classList.toggle('active', active);
        if (active) li.scrollIntoView({ block: 'nearest' });
    });
}
import { $, el } from '../shared/dom.js';
import { getCoords } from '../shared/coords.js';
import { createActionButtons } from './components.js';

export function renderDetails(id, country, handlers) {
    const card = $('details-card');
    card.innerHTML = '';

    if (!id || !country) {
        card.appendChild(el('p', 'placeholder', 'Selecione um país na lista ou no mapa para ver os detalhes.'));
        return;
    }

    const header = el('div', 'details-header');
    header.append(
        el('h2', 'section-title', country.name || id),
        createActionButtons(id, handlers)
    );
    card.appendChild(header);

    const coords = getCoords(country);
    const fields = [
        ['ID', id.toUpperCase()],
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
/**
 * Renderização e controle da lista lateral de países
 */

export function renderList(countries, filterText = '', selectedId = null, onSelect = () => {}) {
    const list = document.getElementById('country-list');
    if (!list) return;

    const term = filterText.trim().toLowerCase();
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
            li.addEventListener('click', () => onSelect(id));
            list.appendChild(li);
        });

    if (selectedId) {
        markActive(selectedId);
    }
}

export function markActive(countryId) {
    document.querySelectorAll('#country-list li').forEach(li => {
        li.classList.toggle('active', li.dataset.id === countryId);
    });
}

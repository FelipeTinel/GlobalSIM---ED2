/**
 * Renderização dos detalhes de cobertura no painel inferior
 */

function formatValue(value) {
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
}

export function renderPlaceholder(message) {
    const panel = document.getElementById('details-panel');
    if (!panel) return;
    panel.innerHTML = `<p class="placeholder">${message}</p>`;
}

export function renderCoverageAvailable(countryId, details) {
    const panel = document.getElementById('details-panel');
    if (!panel) return;
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

export function renderCoverageUnavailable(code, errorData) {
    const panel = document.getElementById('details-panel');
    if (!panel) return;
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

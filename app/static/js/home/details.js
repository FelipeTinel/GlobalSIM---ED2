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

export function renderConnectivityResult(data) {
    const panel = document.getElementById('details-panel');
    if (!panel) return;
    panel.innerHTML = '';

    const { client, destination, connectivity } = data;

    // Header do card integrado
    const headerRow = document.createElement('div');
    headerRow.className = 'details-header-row';

    const titleBox = document.createElement('div');
    const title = document.createElement('h2');
    title.innerHTML = `<i class="bi bi-airplane-engines-fill"></i> Consulta de Viagem & Conectividade`;
    const subtitle = document.createElement('p');
    subtitle.className = 'connectivity-summary-msg';
    subtitle.textContent = connectivity.message;
    titleBox.append(title, subtitle);

    const badge = document.createElement('span');
    let badgeClass = 'available';
    if (connectivity.status === 'unavailable') badgeClass = 'unavailable';
    else if (connectivity.status === 'inactive') badgeClass = 'warning';
    badge.className = `coverage-badge ${badgeClass}`;
    badge.textContent = connectivity.label.toUpperCase();

    headerRow.append(titleBox, badge);
    panel.appendChild(headerRow);

    // Grid comparativo das duas estruturas
    const comparisonGrid = document.createElement('div');
    comparisonGrid.className = 'connectivity-structures-grid';

    // 1. Card Árvore B (Cliente)
    const btreeCard = document.createElement('div');
    btreeCard.className = 'structure-card btree-box';
    btreeCard.innerHTML = `
        <div class="structure-card-header">
            <i class="bi bi-diagram-3-fill"></i>
            <div>
                <h4>Dados do Cliente</h4>
                <span class="structure-sub">Busca por chave primária em O(log n)</span>
            </div>
        </div>
        <div class="structure-fields">
            <div><span class="lbl">Nome:</span> <span class="val">${client.name}</span></div>
            <div><span class="lbl">ID:</span> <span class="val">#${client.id}</span></div>
            <div><span class="lbl">eSIM:</span> <span class="val">${client.esim || '—'}</span></div>
            <div><span class="lbl">Pacote:</span> <span class="val">${client.pkg_name} (#${client.pkg})</span></div>
            <div><span class="lbl">Dados / Validade:</span> <span class="val">${client.pkg_data || '—'} • ${client.pkg_validity || '—'}</span></div>
            <div><span class="lbl">Status da Linha:</span> <span class="val status-pill status-${client.status}">${(client.status || 'ativo').toUpperCase()}</span></div>
            <div class="structure-metric">
                <i class="bi bi-speedometer2"></i> ${client.btree_search.comparisons} comparação(ões) / ${client.btree_search.nodes_visited} nó(s) inspecionado(s)
            </div>
        </div>
    `;

    // 2. Card Tabela Hash (Destino)
    const hashCard = document.createElement('div');
    hashCard.className = 'structure-card hash-box';
    const destName = destination.name ? `${destination.name} (${destination.code})` : destination.code;
    const destTech = destination.tech || 'Não disponível';
    const destProvider = destination.provider || 'Não disponível';
    const destContinent = destination.continent || '—';

    hashCard.innerHTML = `
        <div class="structure-card-header">
            <i class="bi bi-hash"></i>
            <div>
                <h4>Destino Consultado</h4>
                <span class="structure-sub">Indexação polinomial em O(1) médio</span>
            </div>
        </div>
        <div class="structure-fields">
            <div><span class="lbl">País:</span> <span class="val">${destName}</span></div>
            <div><span class="lbl">Região:</span> <span class="val">${destContinent}</span></div>
            <div><span class="lbl">Operadora:</span> <span class="val">${destProvider}</span></div>
            <div><span class="lbl">Tecnologia:</span> <span class="val">${destTech}</span></div>
            <div><span class="lbl">Cobertura:</span> <span class="val status-pill status-${destination.available ? 'ativo' : 'inativo'}">${destination.available ? 'DISPONÍVEL' : 'INDISPONÍVEL'}</span></div>
            <div class="structure-metric">
                <i class="bi bi-speedometer2"></i> Bucket #${destination.hash_search.bucket ?? '—'} (${destination.hash_search.comparisons ?? 0} comparação(ões) no encadeamento)
            </div>
        </div>
    `;

    comparisonGrid.append(btreeCard, hashCard);
    panel.appendChild(comparisonGrid);
}


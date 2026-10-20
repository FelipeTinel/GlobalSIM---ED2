import { $, el } from '../shared/dom.js';

export function bindInstrumentationSearch(onSearchKey) {
    const form = $('inst-search-form');
    const input = $('inst-search-input');
    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const key = input.value.trim();
        if (!key) return;
        onSearchKey(key);
    });
}

export function renderSearchFeedback(message) {
    const feedback = $('inst-search-feedback');
    if (!feedback) return;

    if (!message) {
        feedback.hidden = true;
        feedback.textContent = '';
        return;
    }

    feedback.hidden = false;
    feedback.textContent = message;
}

export function renderInstrumentation(inst, onSelectCountry) {
    if (!inst) return;

    const capBadge = $('inst-capacity-badge');
    if (capBadge) {
        capBadge.textContent = `M = ${inst.capacity}`;
    }

    const metricsContainer = $('inst-metrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = '';

        const lastSearchSub = inst.last_search_key
            ? `Chave "${inst.last_search_key}" (Bucket #${inst.last_search_bucket})`
            : 'Nenhuma busca realizada';

        const metrics = [
            ['Elementos (N)', String(inst.size), 'Países na estrutura'],
            ['Capacidade (M)', String(inst.capacity), 'Total de buckets'],
            ['Fator de Carga (α)', String(inst.load_factor), 'Razão N / M'],
            ['Buckets Ocupados', `${inst.occupied_buckets} / ${inst.capacity}`, `${inst.capacity - inst.occupied_buckets} livre(s)`],
            ['Colisões', String(inst.collisions), 'Chaves em mesmo índice'],
            ['Última Busca', `${inst.last_search_comparisons} comp.`, lastSearchSub],
        ];

        metrics.forEach(([label, value, sub]) => {
            const box = el('div', 'metric-box');
            box.append(
                el('span', 'info-label', label),
                el('span', 'info-value', value),
                el('span', 'metric-sub', sub)
            );
            metricsContainer.appendChild(box);
        });
    }

    const bucketsList = $('buckets-list');
    if (!bucketsList) return;
    bucketsList.innerHTML = '';

    (inst.buckets || []).forEach((bucket) => {
        const classes = ['bucket-row'];
        if (bucket.has_collision) classes.push('has-collision');
        if (inst.last_search_bucket === bucket.index) classes.push('searched-bucket');

        const row = el('div', classes.join(' '));
        const indexBadge = el('span', 'bucket-index', `#${bucket.index}`);
        const chain = el('div', 'bucket-chain');

        if (!bucket.items || bucket.items.length === 0) {
            chain.appendChild(el('span', 'bucket-empty', 'Vazio'));
        } else {
            bucket.items.forEach((item, idx) => {
                if (idx > 0) {
                    chain.appendChild(el('span', 'bucket-arrow', '→'));
                }
                const code = (item.code || bucket.keys[idx] || '').toUpperCase();
                const name = item.country || item.name || code;

                const nodeBtn = el('button', 'bucket-node');
                nodeBtn.type = 'button';
                nodeBtn.append(
                    el('span', 'bucket-node-code', code),
                    el('span', '', name)
                );
                nodeBtn.addEventListener('click', () => {
                    if (onSelectCountry) onSelectCountry(code);
                });
                chain.appendChild(nodeBtn);
            });
        }

        let statusClass = 'bucket-status status-empty';
        let statusText = 'Livre';
        if (bucket.count === 1) {
            statusClass = 'bucket-status status-ok';
            statusText = '1 item';
        } else if (bucket.count > 1) {
            statusClass = 'bucket-status status-collision';
            statusText = `Colisão (${bucket.count} itens)`;
        }

        const statusBadge = el('span', statusClass, statusText);
        row.append(indexBadge, chain, statusBadge);
        bucketsList.appendChild(row);
    });
}


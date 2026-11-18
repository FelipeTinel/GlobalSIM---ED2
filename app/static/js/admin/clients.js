/**
 * Módulo de Gerenciamento de Clientes no Painel de Admin
 * Visualização, Edição e Exclusão (Árvore B / JSONL)
 */

import { getAllClients, getClient, createClient, updateClient, deleteClient } from '../session/api.js';

let clients = [];
let selectedClientId = null;
let editingClientId = null;

const elements = {
    countBadge: document.getElementById('admin-clients-count'),
    searchInput: document.getElementById('admin-clients-search'),
    list: document.getElementById('admin-clients-list'),
    detailsCard: document.getElementById('admin-client-details-card'),
    form: document.getElementById('admin-client-form'),
    formTitle: document.getElementById('client-form-title'),
    formMode: document.getElementById('client-form-mode'),
    editingLabel: document.getElementById('client-editing-label'),
    submitBtn: document.getElementById('client-submit-btn'),
    cancelBtn: document.getElementById('client-cancel-btn'),
    feedback: document.getElementById('admin-client-feedback'),

    inputId: document.getElementById('admin-client-id'),
    inputName: document.getElementById('admin-client-name'),
    inputEmail: document.getElementById('admin-client-email'),
    inputEsim: document.getElementById('admin-client-esim'),
    inputPkg: document.getElementById('admin-client-pkg'),
    inputStatus: document.getElementById('admin-client-status'),
    inputLogged: document.getElementById('admin-client-logged')
};

export async function initAdminClients() {
    bindEvents();
    await loadClients();
}

async function loadClients() {
    if (!elements.list) return;
    elements.list.innerHTML = '<li class="placeholder">Carregando clientes da Árvore B...</li>';

    const { ok, data } = await getAllClients();
    if (ok && Array.isArray(data)) {
        clients = data;
        if (elements.countBadge) {
            elements.countBadge.textContent = clients.length;
        }
        renderClientsList('');
    } else {
        elements.list.innerHTML = '<li class="placeholder">Não foi possível carregar os clientes.</li>';
    }
}

function renderClientsList(filter = '') {
    if (!elements.list) return;
    elements.list.innerHTML = '';

    const term = filter.trim().toLowerCase();
    const filtered = clients.filter(c => {
        const name = (c.name || '').toLowerCase();
        const idStr = String(c.id);
        return name.includes(term) || idStr.includes(term);
    });

    if (filtered.length === 0) {
        elements.list.innerHTML = '<li class="placeholder">Nenhum cliente encontrado.</li>';
        return;
    }

    filtered.forEach(c => {
        const li = document.createElement('li');
        li.className = 'admin-client-item';
        li.dataset.id = c.id;
        if (selectedClientId === c.id) {
            li.classList.add('active');
        }

        const idBadge = document.createElement('span');
        idBadge.className = 'admin-client-id-badge';
        idBadge.textContent = `#${c.id}`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'admin-client-name';
        nameSpan.textContent = c.name || `Cliente #${c.id}`;

        li.append(idBadge, nameSpan);
        li.addEventListener('click', () => selectClient(c.id));
        elements.list.appendChild(li);
    });
}

async function selectClient(clientId) {
    selectedClientId = clientId;

    document.querySelectorAll('#admin-clients-list li').forEach(li => {
        li.classList.toggle('active', li.dataset.id == clientId);
    });

    if (!elements.detailsCard) return;
    elements.detailsCard.innerHTML = '<p class="placeholder">Buscando dados do cliente na Árvore B...</p>';

    const { ok, data: client } = await getClient(clientId);
    if (!ok || !client) {
        elements.detailsCard.innerHTML = '<p class="placeholder">Erro ao carregar detalhes do cliente.</p>';
        return;
    }

    renderClientDetails(client);
}

function renderClientDetails(client) {
    if (!elements.detailsCard) return;
    elements.detailsCard.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'client-details-header';

    const title = document.createElement('h3');
    title.style.margin = '0';
    title.textContent = `${client.name} (#${client.id})`;

    const badgesContainer = document.createElement('div');
    badgesContainer.style.display = 'flex';
    badgesContainer.style.gap = '8px';

    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${client.status === 'ativo' ? 'badge-logged-in' : 'badge-logged-out'}`;
    statusBadge.textContent = (client.status || 'ativo').toUpperCase();

    const loggedBadge = document.createElement('span');
    loggedBadge.className = `status-badge ${client.is_logged ? 'badge-logged-in' : 'badge-unregistered'}`;
    loggedBadge.textContent = client.is_logged ? 'LOGADO' : 'DESLOGADO';

    badgesContainer.append(statusBadge, loggedBadge);
    header.append(title, badgesContainer);
    elements.detailsCard.appendChild(header);

    // Grid de Informações
    const grid = document.createElement('div');
    grid.className = 'client-details-grid';

    const fields = [
        ['ID do Cliente', `#${client.id}`],
        ['Nome Completo', client.name],
        ['E-mail', client.email || 'Não informado'],
        ['Código eSIM', client.esim || 'Não associado'],
        ['Plano / Pacote', `Pacote #${client.pkg || 101}`],
        ['Status do eSIM', client.status || 'ativo'],
        ['Sessão Ativa', client.is_logged ? 'Sim (Autenticado)' : 'Não (Desconectado)']
    ];

    fields.forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'client-details-item';

        const lbl = document.createElement('span');
        lbl.className = 'client-details-label';
        lbl.textContent = label;

        const val = document.createElement('span');
        val.className = 'client-details-value';
        val.textContent = value;

        item.append(lbl, val);
        grid.appendChild(item);
    });

    elements.detailsCard.appendChild(grid);

    // Ações: Editar e Deletar
    const actionsRow = document.createElement('div');
    actionsRow.className = 'client-details-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-primary';
    editBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Editar Cliente';
    editBtn.addEventListener('click', () => startEditClient(client));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-danger';
    deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i> Excluir Cliente';
    deleteBtn.addEventListener('click', () => handleDeleteClient(client));

    actionsRow.append(editBtn, deleteBtn);
    elements.detailsCard.appendChild(actionsRow);
}

function startEditClient(client) {
    editingClientId = client.id;

    if (elements.formTitle) elements.formTitle.innerHTML = '<i class="bi bi-pencil-square"></i> Editar Cliente';
    if (elements.formMode) elements.formMode.hidden = false;
    if (elements.editingLabel) elements.editingLabel.textContent = `${client.name} (#${client.id})`;
    if (elements.submitBtn) elements.submitBtn.textContent = 'Salvar Alterações';
    if (elements.cancelBtn) elements.cancelBtn.hidden = false;

    if (elements.inputId) {
        elements.inputId.value = client.id;
        elements.inputId.disabled = true; // Não permite alterar chave primária da Árvore B
    }
    if (elements.inputName) elements.inputName.value = client.name || '';
    if (elements.inputEmail) elements.inputEmail.value = client.email || '';
    if (elements.inputEsim) elements.inputEsim.value = client.esim || '';
    if (elements.inputPkg) elements.inputPkg.value = client.pkg || 101;
    if (elements.inputStatus) elements.inputStatus.value = client.status || 'ativo';
    if (elements.inputLogged) elements.inputLogged.value = String(Boolean(client.is_logged));

    elements.form?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetForm() {
    editingClientId = null;
    elements.form?.reset();

    if (elements.formTitle) elements.formTitle.innerHTML = '<i class="bi bi-person-gear"></i> Cadastrar Cliente';
    if (elements.formMode) elements.formMode.hidden = true;
    if (elements.submitBtn) elements.submitBtn.textContent = 'Salvar Cliente';
    if (elements.cancelBtn) elements.cancelBtn.hidden = true;
    if (elements.inputId) elements.inputId.disabled = false;
    if (elements.feedback) elements.feedback.hidden = true;
}

async function handleDeleteClient(client) {
    const confirmed = window.confirm(`Tem certeza de que deseja excluir permanentemente o cliente ${client.name} (ID: ${client.id}) da Árvore B?`);
    if (!confirmed) return;

    const res = await deleteClient(client.id);
    if (res.ok) {
        alert(`Cliente #${client.id} (${client.name}) foi excluído com sucesso!`);
        selectedClientId = null;
        if (editingClientId === client.id) {
            resetForm();
        }
        if (elements.detailsCard) {
            elements.detailsCard.innerHTML = '<p class="placeholder">Selecione um cliente na lista acima para visualizar, editar ou deletar.</p>';
        }
        await loadClients();
    } else {
        alert(res.data?.error || 'Erro ao excluir o cliente.');
    }
}

function bindEvents() {
    elements.searchInput?.addEventListener('input', (e) => {
        renderClientsList(e.target.value);
    });

    elements.cancelBtn?.addEventListener('click', resetForm);

    elements.form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = parseInt(elements.inputId?.value, 10);
        const name = elements.inputName?.value?.trim();
        const email = elements.inputEmail?.value?.trim();
        const esim = elements.inputEsim?.value?.trim();
        const pkg = parseInt(elements.inputPkg?.value || 101, 10);
        const status = elements.inputStatus?.value || 'ativo';
        const is_logged = elements.inputLogged?.value === 'true';

        const payload = { id, name, email, esim, pkg, status, is_logged };

        if (elements.feedback) {
            elements.feedback.className = 'feedback-msg info';
            elements.feedback.textContent = editingClientId ? 'Atualizando cliente...' : 'Cadastrando cliente...';
            elements.feedback.hidden = false;
        }

        let res;
        if (editingClientId) {
            res = await updateClient(editingClientId, payload);
        } else {
            res = await createClient(payload);
        }

        if (res.ok) {
            if (elements.feedback) {
                elements.feedback.className = 'feedback-msg success';
                elements.feedback.textContent = editingClientId
                    ? `Cliente #${editingClientId} atualizado com sucesso!`
                    : `Cliente #${payload.id} cadastrado com sucesso!`;
            }
            const savedId = editingClientId || payload.id;
            resetForm();
            await loadClients();
            await selectClient(savedId);
        } else {
            if (elements.feedback) {
                elements.feedback.className = 'feedback-msg error';
                elements.feedback.textContent = res.data?.error || 'Erro ao processar a operação.';
            }
        }
    });
}

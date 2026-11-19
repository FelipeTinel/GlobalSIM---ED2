/**
 * Renderização e Manipulação de Interface da Sessão
 */

import { checkSession } from './auth.js';

export function setupTabs(tabLogin, tabRegister, sectionLogin, sectionRegister) {
    function setTab(tab) {
        if (tab === 'login') {
            tabLogin?.classList.add('active');
            tabRegister?.classList.remove('active');
            sectionLogin?.removeAttribute('hidden');
            sectionRegister?.setAttribute('hidden', '');
        } else {
            tabRegister?.classList.add('active');
            tabLogin?.classList.remove('active');
            sectionRegister?.removeAttribute('hidden');
            sectionLogin?.setAttribute('hidden', '');
        }
    }

    tabLogin?.addEventListener('click', () => setTab('login'));
    tabRegister?.addEventListener('click', () => setTab('register'));

    return { setTab };
}

export async function renderSessionStatus(elements) {
    const {
        statusBadge,
        statusDesc,
        userInfoBox,
        userNameEl,
        userIdEl,
        userEmailEl,
        userEsimEl,
        userPkgEl,
        logoutBtn,
        loginIdInput
    } = elements;

    const session = await checkSession();

    if (session.state === 'logged_in') {
        if (statusBadge) {
            statusBadge.className = 'status-badge badge-logged-in';
            statusBadge.textContent = 'LOGADO';
        }
        if (statusDesc) {
            statusDesc.textContent = `Você está autenticado como ${session.client.name}.`;
        }

        if (userInfoBox) userInfoBox.hidden = false;
        if (userNameEl) userNameEl.textContent = session.client.name;
        if (userIdEl) userIdEl.textContent = session.client.id;
        if (userEmailEl) userEmailEl.textContent = session.client.email || 'Não informado';
        if (userEsimEl) userEsimEl.textContent = session.client.esim || 'Não associado';
        if (userPkgEl) {
            userPkgEl.textContent = session.client.pkg_name
                ? `${session.client.pkg_name} (${session.client.pkg_data} • ${session.client.pkg_validity})`
                : (session.client.pkg ? `Pacote #${session.client.pkg}` : 'Padrão');
        }
        if (logoutBtn) logoutBtn.hidden = false;

    } else if (session.state === 'logged_out') {
        if (statusBadge) {
            statusBadge.className = 'status-badge badge-logged-out';
            statusBadge.textContent = 'DESLOGADO';
        }
        if (statusDesc) {
            statusDesc.textContent = `O cliente ${session.client.name} (ID: ${session.client.id}) está desconectado.`;
        }

        if (userInfoBox) userInfoBox.hidden = true;
        if (logoutBtn) logoutBtn.hidden = true;

        if (loginIdInput && !loginIdInput.value) {
            loginIdInput.value = session.client.id;
        }

    } else {
        if (statusBadge) {
            statusBadge.className = 'status-badge badge-unregistered';
            statusBadge.textContent = 'NÃO CADASTRADO / SEM SESSÃO';
        }
        if (statusDesc) {
            statusDesc.textContent = 'Nenhuma sessão ativa. Digite seu ID para entrar ou faça o cadastro caso ainda não possua conta.';
        }

        if (userInfoBox) userInfoBox.hidden = true;
        if (logoutBtn) logoutBtn.hidden = true;
    }

    return session;
}

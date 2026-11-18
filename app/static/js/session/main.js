/**
 * Ponto de entrada do módulo de Sessão
 */

import { login, logout, register } from './auth.js';
import { setupTabs, renderSessionStatus } from './ui.js';

export function initSessionPage() {
    const elements = {
        statusCard: document.getElementById('session-status-card'),
        statusBadge: document.getElementById('session-status-badge'),
        statusDesc: document.getElementById('session-status-desc'),
        userInfoBox: document.getElementById('session-user-info'),
        userNameEl: document.getElementById('user-name'),
        userIdEl: document.getElementById('user-id'),
        userEmailEl: document.getElementById('user-email'),
        userEsimEl: document.getElementById('user-esim'),
        userPkgEl: document.getElementById('user-pkg'),
        logoutBtn: document.getElementById('btn-logout'),
        loginIdInput: document.getElementById('login-id')
    };

    const tabLogin = document.getElementById('tab-btn-login');
    const tabRegister = document.getElementById('tab-btn-register');
    const sectionLogin = document.getElementById('section-login');
    const sectionRegister = document.getElementById('section-register');

    const formLogin = document.getElementById('form-login');
    const loginFeedback = document.getElementById('login-feedback');
    const formRegister = document.getElementById('form-register');
    const registerFeedback = document.getElementById('register-feedback');

    const { setTab } = setupTabs(tabLogin, tabRegister, sectionLogin, sectionRegister);

    // Submissão do Login
    formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idInput = document.getElementById('login-id');
        const idValue = idInput?.value?.trim();

        if (!idValue) return;

        loginFeedback.className = 'feedback-msg info';
        loginFeedback.textContent = 'Verificando dados no sistema...';
        loginFeedback.hidden = false;

        const result = await login(idValue);

        if (result.success) {
            loginFeedback.className = 'feedback-msg success';
            loginFeedback.textContent = result.message;
            await renderSessionStatus(elements);
        } else {
            loginFeedback.className = 'feedback-msg error';
            loginFeedback.innerHTML = `${result.message} <button type="button" class="btn-link" id="btn-quick-register">Ir para Cadastro &rarr;</button>`;

            document.getElementById('btn-quick-register')?.addEventListener('click', () => {
                setTab('register');
                const regId = document.getElementById('reg-id');
                if (regId) regId.value = idValue;
            });
        }
    });

    // Submissão do Cadastro
    formRegister?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            id: document.getElementById('reg-id')?.value?.trim(),
            name: document.getElementById('reg-name')?.value?.trim(),
            email: document.getElementById('reg-email')?.value?.trim(),
            esim: document.getElementById('reg-esim')?.value?.trim(),
            pkg: document.getElementById('reg-pkg')?.value?.trim(),
            status: document.getElementById('reg-status')?.value || 'ativo'
        };

        registerFeedback.className = 'feedback-msg info';
        registerFeedback.textContent = 'Cadastrando cliente...';
        registerFeedback.hidden = false;

        const result = await register(formData);

        if (result.success) {
            registerFeedback.className = 'feedback-msg success';
            registerFeedback.textContent = result.message;
            formRegister.reset();
            await renderSessionStatus(elements);
            setTimeout(() => setTab('login'), 1500);
        } else {
            registerFeedback.className = 'feedback-msg error';
            registerFeedback.textContent = result.message;
        }
    });

    // Botão de Logout
    elements.logoutBtn?.addEventListener('click', async () => {
        await logout();
        await renderSessionStatus(elements);
        if (loginFeedback) {
            loginFeedback.className = 'feedback-msg info';
            loginFeedback.textContent = 'Você saiu da sessão.';
            loginFeedback.hidden = false;
        }
    });

    renderSessionStatus(elements);
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('session-status-card')) {
            initSessionPage();
        }
    });
}

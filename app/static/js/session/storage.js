/**
 * Gerenciamento de Persistência Local da Sessão (localStorage)
 */

const STORAGE_KEY = 'globalsim_client_session';

export function getStoredUser() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setStoredUser(user) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (err) {
        console.warn('Não foi possível persistir no localStorage:', err);
    }
}

export function clearStoredUser() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.warn('Não foi possível remover do localStorage:', err);
    }
}

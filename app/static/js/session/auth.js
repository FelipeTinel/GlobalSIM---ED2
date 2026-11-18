/**
 * Regras de Negócio de Autenticação e Sessão
 */

import { getClient, createClient, updateClient } from './api.js';
import { getStoredUser, setStoredUser, clearStoredUser } from './storage.js';

/**
 * Identifica o status atual do usuário acessando o sistema:
 * - 'logged_in': Usuário logado
 * - 'logged_out': Usuário deslogado
 * - 'unregistered': Usuário não cadastrado ou sem sessão
 */
export async function checkSession() {
    const stored = getStoredUser();
    if (!stored || !stored.id) {
        return {
            state: 'unregistered',
            client: null,
            message: 'Nenhum usuário em sessão. Por favor, entre ou cadastre-se.'
        };
    }

    const { ok, status, data } = await getClient(stored.id);
    if (!ok || status === 404) {
        clearStoredUser();
        return {
            state: 'unregistered',
            client: null,
            message: 'Cliente salvo não encontrado no sistema. Necessário cadastrar.'
        };
    }

    const client = data;
    const isLogged = Boolean(client.is_logged);

    setStoredUser({
        id: client.id,
        name: client.name,
        email: client.email,
        is_logged: isLogged
    });

    if (isLogged) {
        return {
            state: 'logged_in',
            client,
            message: `Usuário ${client.name} está logado no sistema.`
        };
    } else {
        return {
            state: 'logged_out',
            client,
            message: `Usuário ${client.name} está deslogado.`
        };
    }
}

/**
 * Realiza o login do cliente pelo ID.
 */
export async function login(clientId) {
    const numericId = parseInt(clientId, 10);
    if (isNaN(numericId)) {
        return { success: false, reason: 'invalid_id', message: 'ID do cliente inválido.' };
    }

    const { ok, status, data: client } = await getClient(numericId);
    if (!ok || status === 404) {
        return {
            success: false,
            reason: 'not_found',
            message: `Cliente com ID ${numericId} não foi encontrado. É necessário cadastrar!`
        };
    }

    // Atualiza status do cliente para logado no backend via PUT
    const updateRes = await updateClient(numericId, {
        ...client,
        is_logged: true
    });

    if (!updateRes.ok) {
        return {
            success: false,
            reason: 'update_failed',
            message: updateRes.data?.error || 'Erro ao atualizar status de login.'
        };
    }

    const updated = updateRes.data;
    setStoredUser({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        is_logged: true
    });

    return {
        success: true,
        client: updated,
        message: `Bem-vindo(a), ${updated.name}! Login efetuado com sucesso.`
    };
}

/**
 * Realiza o logout do cliente (desloga).
 */
export async function logout(clientId = null) {
    const targetId = clientId || getStoredUser()?.id;
    if (targetId) {
        const { ok, data: client } = await getClient(targetId);
        if (ok && client) {
            await updateClient(targetId, {
                ...client,
                is_logged: false
            });
        }
    }

    const stored = getStoredUser();
    if (stored) {
        setStoredUser({ ...stored, is_logged: false });
    }

    return { success: true, message: 'Usuário deslogado com sucesso.' };
}

/**
 * Cadastra um novo cliente e já o inicia logado.
 */
export async function register(formData) {
    const payload = {
        id: parseInt(formData.id, 10),
        name: String(formData.name || '').trim(),
        email: String(formData.email || '').trim(),
        esim: String(formData.esim || '').trim(),
        pkg: parseInt(formData.pkg || 101, 10),
        status: String(formData.status || 'ativo').trim(),
        is_logged: true
    };

    const res = await createClient(payload);
    if (!res.ok) {
        return {
            success: false,
            reason: 'create_failed',
            message: res.data?.error || 'Erro ao realizar cadastro.'
        };
    }

    const created = res.data;
    setStoredUser({
        id: created.id,
        name: created.name,
        email: created.email,
        is_logged: true
    });

    return {
        success: true,
        client: created,
        message: `Cadastro realizado com sucesso! Bem-vindo(a), ${created.name}.`
    };
}

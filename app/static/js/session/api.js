/**
 * Comunicação com a API de Clientes (/clients)
 */

const BASE = '/clients';

async function request(url, method, body) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
}

export async function getClient(clientId) {
    try {
        return await request(`${BASE}/${encodeURIComponent(clientId)}`, 'GET');
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return { ok: false, status: 0, data: { error: 'Falha na conexão com o servidor' } };
    }
}

export async function getAllClients() {
    try {
        return await request(BASE, 'GET');
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        return { ok: false, status: 0, data: [] };
    }
}

export async function createClient(clientData) {
    try {
        return await request(BASE, 'POST', clientData);
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        return { ok: false, status: 0, data: { error: 'Falha na conexão com o servidor' } };
    }
}

export async function updateClient(clientId, clientData) {
    try {
        return await request(`${BASE}/${encodeURIComponent(clientId)}`, 'PUT', clientData);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return { ok: false, status: 0, data: { error: 'Falha na conexão com o servidor' } };
    }
}

export async function deleteClient(clientId) {
    try {
        return await request(`${BASE}/${encodeURIComponent(clientId)}`, 'DELETE');
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        return { ok: false, status: 0, data: { error: 'Falha na conexão com o servidor' } };
    }
}

export async function getClientInstrumentation() {
    try {
        return await request(`${BASE}/instrumentation`, 'GET');
    } catch (error) {
        console.error('Erro ao obter instrumentação da Árvore B:', error);
        return { ok: false, status: 0, data: {} };
    }
}

export async function getClientsByCountry(countryCode) {
    try {
        return await request(`${BASE}/country/${encodeURIComponent(countryCode)}`, 'GET');
    } catch (error) {
        console.error('Erro ao buscar clientes por país:', error);
        return { ok: false, status: 0, data: {} };
    }
}


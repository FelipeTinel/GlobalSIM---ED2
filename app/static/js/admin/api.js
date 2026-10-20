const BASE = '/admin/api/countries';

async function request(url, method, body) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`${method} ${url} falhou (HTTP ${response.status})`);
    return await response.json();
}

export async function getCountries() {
    try {
        return await request(BASE, 'GET');
    } catch (error) {
        console.error(error);
        return [];
    }
}

export async function getCountry(countryId) {
    const response = await fetch(`${BASE}/${encodeURIComponent(countryId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
}

export async function getInstrumentation() {
    try {
        return await request('/admin/api/instrumentation', 'GET');
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function createCountry(countryData) {
    try {
        return await request(BASE, 'POST', countryData);
    } catch (error) {
        console.error(error);
    }
}

export async function updateCountry(countryId, countryData) {
    try {
        return await request(`${BASE}/${encodeURIComponent(countryId)}/update`, 'POST', countryData);
    } catch (error) {
        console.error(error);
    }
}

export async function deleteCountry(countryId) {
    try {
        return await request(`${BASE}/${encodeURIComponent(countryId)}/delete`, 'POST');
    } catch (error) {
        console.error(error);
    }
}

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

export async function createCountry(countryData) {
    try {
        return await request(BASE, 'POST', countryData);
    } catch (error) {
        console.error(error);
    }
}

export async function updateCountry(countryId, countryData) {
    try {
        return await request(`${BASE}/${countryId}`, 'PUT', countryData);
    } catch (error) {
        console.error(error);
    }
}

export async function deleteCountry(countryId) {
    try {
        return await request(`${BASE}/${countryId}`, 'DELETE');
    } catch (error) {
        console.error(error);
    }
}
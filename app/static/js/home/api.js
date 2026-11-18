/**
 * Requisições HTTP da página inicial (Home)
 */

export async function getCountries() {
    try {
        const response = await fetch('/api/countries');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar países:', error);
        return {};
    }
}

export async function fetchCountryDetails(countryId) {
    const response = await fetch(`/api/countries/${encodeURIComponent(countryId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 404) {
        return { found: false, data };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { found: true, data };
}

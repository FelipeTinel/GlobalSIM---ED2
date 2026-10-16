export async function initMap () {

    const point = window.initialPoint || { lat: 0, lng: 0, zoom: 4 };

    const map = L.map('map', { zoomControl: false }).setView([point.lat, point.lng], point.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 3,
        maxZoom: 3,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    try {
        const response = await fetch('/api/countries');
        const countries = await response.json();
    
        console.log("Países carregados:", countries);
    } catch (error) {
        console.error("Erro ao carregar países:", error);
    }
}

async function fetchCountryDetails(countryId) {
    const response = await fetch(`/api/countries/${countryId}`);
    return await response.json();
}

async function selectUserCountry(userId, countryId) {
    const response = await fetch(`/api/users/${userId}/country`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ country_id: countryId })
    });
    return await response.json();
}
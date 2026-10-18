async function initMap () {

    const point = window.initialPoint || { lat: 0, lng: 0, zoom: 4 };

    const map = L.map('map', { zoomControl : false }).setView([point.lat, point.lng], point.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 4,
        maxZoom: 4,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let countries = {};
    
    try {
        const response = await fetch('/api/countries');
        countries = await response.json();
        console.log("Países carregados:", countries);
    } catch (error) {
        console.error("Erro ao carregar países:", error);
        return;
    }

    Object.entries(countries).forEach(([countryId, coord]) => {
        const marker = L.marker(coord).addTo(map);
        
        marker.on('click', async () => {

            marker.bindPopup("Carregando...").openPopup();
            const details = await fetchCountryDetails(countryId);
            marker.setPopupContent(`<b>${details.name || countryId}</b>`);
        
        });
    });

}

async function fetchCountryDetails(countryId) {
    const response = await fetch(`/api/countries/${countryId}`,
        {
            method :'GET',
            headers : { 'Content-type' : 'application/json' },
        }
    );    
    return await response.json();
}

// async function selectUserCountry(userId, countryId) {
//     const response = await fetch(`/api/users/${userId}/country`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ country_id: countryId })
//     });
//     return await response.json();
// }

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Frontend funcional");
    initMap();

})
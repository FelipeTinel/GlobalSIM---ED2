function initMap() {
  const mapElement = document.getElementsByClassName(".map");
  if (!mapElement) return;
  
  const initialPoint = JSON.parse(mapElement.dataset.point);

  const map = L.map(".map").setView(
    [initialPoint.lat, initialPoint.lng],
    initialPoint.zoom
  );

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}

document.addEventListener('DOMContentLoaded', initMap);
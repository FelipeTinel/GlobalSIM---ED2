export function getCoords(country) {
    if (country.lat != null && country.lng != null) return [country.lat, country.lng];
    if (Array.isArray(country.coordinates) && country.coordinates.length === 2) return country.coordinates;
    return null;
}
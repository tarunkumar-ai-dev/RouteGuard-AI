// ==========================================
// ROUTEGUARD AI - REAL DASHBOARD
// REAL ROUTES + REAL GPS VEHICLES
// ==========================================

const API_BASE = "/api";

let map = null;
let routeLayers = [];
let vehicleMarkers = {};
let currentRouteData = null;
let routesAnalyzedCount = 0;
let riskAlertsCount = 0;


// ==========================================
// INITIALIZE MAP
// ==========================================

function initializeMap() {

    const mapElement = document.getElementById("realMap");

    if (!mapElement) {
        console.error("Map element not found.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Leaflet is not loaded.");
        return;
    }

    map = L.map("realMap");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

    map.setView([26.8467, 80.9462], 6);

    loadRealRoute("Delhi", "Lucknow");
}


// ==========================================
// LOAD REAL ROUTE
// ==========================================

async function loadRealRoute(origin, destination) {

    const loading = document.getElementById("mapLoading");

    try {

        if (loading) {
            loading.textContent = `Finding real route: ${origin} → ${destination}`;
        }

        const url =
            `${API_BASE}/route` +
            `?origin=${encodeURIComponent(origin)}` +
            `&destination=${encodeURIComponent(destination)}`;

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error || "Route service unavailable.");
        }

        const data = await response.json();

        if (!data.success || !data.routes || data.routes.length === 0) {
            throw new Error("No real road route found.");
        }

        currentRouteData = data;

        routesAnalyzedCount++;
        const routesMonitoredEl = document.getElementById("routesMonitored");
        if (routesMonitoredEl) routesMonitoredEl.textContent = routesAnalyzedCount;

        loadRouteRisk(data.routes[0]);

        drawAllRoutes(data);

        updateRouteInformation(data);

        if (loading) {
            loading.remove();
        }

    } catch (error) {

        console.error("REAL ROUTE ERROR:", error);

        if (loading) {
            loading.textContent = "Unable to load real route.";
        }

    }

}


// ==========================================
// DRAW ALL REAL ROUTES
// ==========================================

function drawAllRoutes(data) {

    if (!map) return;

    routeLayers.forEach(layer => {
        map.removeLayer(layer);
    });

    routeLayers = [];

    const bounds = [];

    data.routes.forEach((route, index) => {

        const isPrimary = index === 0;

        const layer = L.geoJSON(route.geometry, {
            style: {
                weight: isPrimary ? 6 : 4,
                opacity: isPrimary ? 0.95 : 0.65
            }
        });

        layer.addTo(map);
        routeLayers.push(layer);

        layer.bindPopup(`
            <strong>Route ${index + 1}</strong>
            <br>
            Distance: ${route.distance_km} km
            <br>
            Duration: ${formatDuration(route.duration_minutes)}
        `);

        const layerBounds = layer.getBounds();

        if (layerBounds.isValid()) {
            bounds.push(layerBounds);
        }

    });

    const originLat = data.origin.latitude;
    const originLon = data.origin.longitude;
    const destinationLat = data.destination.latitude;
    const destinationLon = data.destination.longitude;

    L.marker([originLat, originLon])
        .addTo(map)
        .bindPopup(`<strong>Origin</strong><br>${escapeHtml(data.origin.query)}`);

    L.marker([destinationLat, destinationLon])
        .addTo(map)
        .bindPopup(`<strong>Destination</strong><br>${escapeHtml(data.destination.query)}`);

    if (bounds.length > 0) {

        let combined = bounds[0];

        for (let i = 1; i < bounds.length; i++) {
            combined = combined.extend(bounds[i]);
        }

        map.fitBounds(combined, { padding: [30, 30] });

    }

}


// ==========================================
// ROUTE INFORMATION
// ==========================================

function updateRouteInformation(data) {

    const firstRoute = data.routes[0];
    const distance = `${firstRoute.distance_km} km`;
    const duration = formatDuration(firstRoute.duration_minutes);

    const distanceElement = document.getElementById("routeDistance");
    const durationElement = document.getElementById("routeDuration");

    if (distanceElement) distanceElement.textContent = distance;
    if (durationElement) durationElement.textContent = duration;

    const smallDistance = document.getElementById("routeDistanceSmall");
    const smallDuration = document.getElementById("routeDurationSmall");

    if (smallDistance) smallDistance.textContent = distance;
    if (smallDuration) smallDuration.textContent = duration;

    const originElement = document.getElementById("routeOrigin");
    const destinationElement = document.getElementById("routeDestination");

    if (originElement) originElement.textContent = data.origin.query;
    if (destinationElement) destinationElement.textContent = data.destination.query;

    createAlternateRoutes(data.routes);

}


// ==========================================
// ALTERNATE ROUTES UI
// ==========================================

function createAlternateRoutes(routes) {

    let container = document.getElementById("alternateRoutes");

    if (!container) {

        const routeCard = document.querySelector(".route-info-card");

        if (!routeCard) return;

        container = document.createElement("div");
        container.id = "alternateRoutes";

        routeCard.appendChild(container);

    }

    container.innerHTML = "";

    const title = document.createElement("div");
    title.className = "alternate-title";
    title.textContent = "AVAILABLE REAL ROUTES";

    container.appendChild(title);

    routes.forEach((route, index) => {

        const button = document.createElement("button");
        button.className = "alternate-route";

        if (index === 0) {
            button.classList.add("selected");
        }

        button.innerHTML = `
            <span>Route ${index + 1}</span>
            <strong>${route.distance_km} km</strong>
            <small>${formatDuration(route.duration_minutes)}</small>
        `;

        button.addEventListener("click", () => {
            selectRoute(index);
        });

        container.appendChild(button);

    });

}


// ==========================================
// SELECT ROUTE
// ==========================================

function selectRoute(selectedIndex) {

    if (!currentRouteData || !currentRouteData.routes[selectedIndex]) {
        return;
    }

    const selectedRoute = currentRouteData.routes[selectedIndex];

    document.querySelectorAll(".alternate-route").forEach((button, index) => {
        button.classList.toggle("selected", index

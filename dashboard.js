// ==========================================
// ROUTEGUARD AI - REAL DASHBOARD
// ==========================================

const API_BASE = "/api";

let map = null;
let routeLayer = null;
let startMarker = null;
let endMarker = null;


// ==========================================
// INITIALIZE REAL MAP
// ==========================================

function initializeMap() {

    const mapElement =
        document.getElementById("realMap");

    if (!mapElement || typeof L === "undefined") {
        console.error("Leaflet/map not available.");
        return;
    }

    map = L.map("realMap");

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    // Initial India view
    map.setView(
        [26.8467, 80.9462],
        6
    );


    loadRealRoute(
        "Delhi",
        "Lucknow"
    );
}


// ==========================================
// LOAD REAL ROUTE
// ==========================================

async function loadRealRoute(
    origin,
    destination
) {

    const loading =
        document.getElementById(
            "mapLoading"
        );

    try {

        if (loading) {
            loading.textContent =
                `Finding real route: ${origin} → ${destination}`;
        }


        const response =
            await fetch(
                `${API_BASE}/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
            );


        if (!response.ok) {

            const error =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                error.error ||
                "Route service unavailable"
            );
        }


        const data =
            await response.json();


        if (!data.success ||
            !data.routes ||
            !data.routes.length) {

            throw new Error(
                "No real road route found."
            );
        }


        drawRoute(data);


        if (loading) {
            loading.remove();
        }


    } catch (error) {

        console.error(
            "Real route error:",
            error
        );


        if (loading) {

            loading.textContent =
                "Real route unavailable";

        }

    }
}


// ==========================================
// DRAW REAL GEOJSON ROUTE
// ==========================================

function drawRoute(data) {

    if (!map) return;


    // Remove previous route
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }


    if (startMarker) {
        map.removeLayer(startMarker);
    }


    if (endMarker) {
        map.removeLayer(endMarker);
    }


    const route =
        data.routes[0];


    // --------------------------------------
    // REAL ROUTE GEOMETRY
    // --------------------------------------

    routeLayer =
        L.geoJSON(
            route.geometry,
            {
                style: {
                    weight: 6,
                    opacity: 0.9
                }
            }
        ).addTo(map);


    // --------------------------------------
    // START
    // --------------------------------------

    const startLat =
        data.origin.latitude;

    const startLon =
        data.origin.longitude;


    // --------------------------------------
    // DESTINATION
    // --------------------------------------

    const endLat =
        data.destination.latitude;

    const endLon =
        data.destination.longitude;


    startMarker =
        L.marker([
            startLat,
            startLon
        ])
        .addTo(map)
        .bindPopup(
            `<strong>Origin</strong><br>
             ${data.origin.query}`
        );


    endMarker =
        L.marker([
            endLat,
            endLon
        ])
        .addTo(map)
        .bindPopup(
            `<strong>Destination</strong><br>
             ${data.destination.query}`
        );


    // --------------------------------------
    // FIT MAP TO ROUTE
    // --------------------------------------

    map.fitBounds(
        routeLayer.getBounds(),
        {
            padding: [30, 30]
        }
    );


    console.log(
        "REAL ROUTE:",
        route
    );

    console.log(
        "Distance:",
        route.distance_km,
        "km"
    );

    console.log(
        "Duration:",
        route.duration_minutes,
        "minutes"
    );
}


// ==========================================
// ROUTE BUTTON
// ==========================================

const routeButton =
    document.querySelector(
        ".route-btn"
    );


if (routeButton) {

    routeButton.addEventListener(
        "click",
        async function () {

            const inputs =
                document.querySelectorAll(
                    ".route-inputs input"
                );


            const origin =
                inputs[0]?.value.trim();

            const destination =
                inputs[1]?.value.trim();


            if (!origin || !destination) {

                alert(
                    "Please enter origin and destination."
                );

                return;
            }


            await loadRealRoute(
                origin,
                destination
            );

        }
    );
}


// ==========================================
// SYSTEM STATUS
// ==========================================

async function loadSystemStatus() {

    try {

        const response =
            await fetch(
                `${API_BASE}/status`
            );


        if (!response.ok) {
            throw new Error(
                "Status unavailable"
            );
        }


        const data =
            await response.json();


        console.log(
            "SYSTEM STATUS:",
            data
        );


        const backend =
            document.getElementById(
                "backendStatus"
            );


        if (backend) {

            backend.textContent =
                data.backend === "online"
                    ? "Online"
                    : "Offline";

        }


    } catch (error) {

        console.error(
            "Status error:",
            error
        );

    }
}


// ==========================================
// VEHICLES
// ==========================================

async function loadVehicles() {

    try {

        const response =
            await fetch(
                `${API_BASE}/vehicles`
            );


        if (!response.ok) {
            throw new Error(
                "Vehicle service unavailable"
            );
        }


        const data =
            await response.json();


        const vehicles =
            data.vehicles || [];


        console.log(
            "REAL VEHICLES:",
            vehicles
        );


        const active =
            vehicles.filter(
                vehicle =>
                    vehicle.status === "active"
            );


        const delayed =
            vehicles.filter(
                vehicle =>
                    vehicle.status === "delayed"
            );


        const activeElement =
            document.getElementById(
                "activeVehicles"
            );


        const delayedElement =
            document.getElementById(
                "delayedVehicles"
            );


        if (activeElement) {
            activeElement.textContent =
                active.length;
        }


        if (delayedElement) {
            delayedElement.textContent =
                delayed.length;
        }


    } catch (error) {

        console.error(
            "Vehicle error:",
            error
        );

    }
}


// ==========================================
// DASHBOARD START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMap();

        loadSystemStatus();

        loadVehicles();

    }
);

// ==========================================
// ROUTEGUARD AI - REAL OPERATIONS DASHBOARD
// ==========================================

const API_BASE = "/api";

let map = null;

let routeLayers = [];
let startMarker = null;
let endMarker = null;

let vehicleMarkers = {};

let currentRouteData = null;
let selectedRouteIndex = 0;


// ==========================================
// INITIALIZE MAP
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
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);

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

        if (
            !data.success ||
            !data.routes ||
            !data.routes.length
        ) {

            throw new Error(
                "No real road route found."
            );
        }

        currentRouteData = data;

        selectedRouteIndex = 0;

        drawRoutes(data);

        updateRouteInformation(data);

        await loadRouteRisk(
            data.routes[0]
        );

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
// DRAW ALL REAL ROUTES
// ==========================================

function drawRoutes(data) {

    if (!map) return;

    // Remove old route layers

    routeLayers.forEach(
        layer => {

            map.removeLayer(layer);

        }
    );

    routeLayers = [];


    // Remove old markers

    if (startMarker) {

        map.removeLayer(
            startMarker
        );

        startMarker = null;
    }

    if (endMarker) {

        map.removeLayer(
            endMarker
        );

        endMarker = null;
    }


    // Draw routes

    data.routes.forEach(
        (route, index) => {

            const layer =
                L.geoJSON(
                    route.geometry,
                    {
                        style: {

                            weight:
                                index === 0
                                    ? 7
                                    : 4,

                            opacity:
                                index === 0
                                    ? 0.95
                                    : 0.45

                        }
                    }
                ).addTo(map);


            layer.bindPopup(`
                <strong>
                    Route ${index + 1}
                </strong>
                <br>
                Distance:
                ${route.distance_km} km
                <br>
                Duration:
                ${formatDuration(
                    route.duration_minutes
                )}
            `);


            routeLayers.push(
                layer
            );


            // Click route to select it

            layer.on(
                "click",
                function () {

                    selectRoute(
                        index
                    );

                }
            );

        }
    );


    // Origin

    startMarker =
        L.marker([
            data.origin.latitude,
            data.origin.longitude
        ])
        .addTo(map)
        .bindPopup(`
            <strong>Origin</strong>
            <br>
            ${escapeHtml(
                data.origin.query
            )}
        `);


    // Destination

    endMarker =
        L.marker([
            data.destination.latitude,
            data.destination.longitude
        ])
        .addTo(map)
        .bindPopup(`
            <strong>Destination</strong>
            <br>
            ${escapeHtml(
                data.destination.query
            )}
        `);


    // Fit map

    if (routeLayers.length) {

        const bounds =
            L.featureGroup(
                routeLayers
            ).getBounds();

        if (bounds.isValid()) {

            map.fitBounds(
                bounds,
                {
                    padding: [30, 30]
                }
            );

        }

    }

}


// ==========================================
// UPDATE ROUTE INFORMATION
// ==========================================

function updateRouteInformation(
    data
) {

    const route =
        data.routes[
            selectedRouteIndex
        ] || data.routes[0];


    if (!route) return;


    const distance =
        `${Number(
            route.distance_km
        ).toFixed(1)} km`;


    const duration =
        formatDuration(
            route.duration_minutes
        );


    // Main cards

    setText(
        "routeDistance",
        distance
    );

    setText(
        "routeDuration",
        duration
    );


    // Small route information

    setText(
        "routeDistanceSmall",
        distance
    );

    setText(
        "routeDurationSmall",
        duration
    );


    // Locations

    setText(
        "routeOrigin",
        data.origin.query
    );

    setText(
        "routeDestination",
        data.destination.query
    );


    // Create alternate routes

    updateAlternateRoutes(
        data.routes
    );

}


// ==========================================
// ALTERNATE ROUTES
// ==========================================

function updateAlternateRoutes(
    routes
) {

    let container =
        document.getElementById(
            "alternateRoutes"
        );


    if (!container) {

        const card =
            document.querySelector(
                ".route-info-card"
            );

        if (!card) return;


        container =
            document.createElement(
                "div"
            );

        container.id =
            "alternateRoutes";

        card.appendChild(
            container
        );

    }


    container.innerHTML = `
        <div class="alternate-title">
            AVAILABLE REAL ROUTES
        </div>
    `;


    routes.forEach(
        (route, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "alternate-route";


            if (
                index === selectedRouteIndex
            ) {

                button.classList.add(
                    "selected"
                );

            }


            button.innerHTML = `

                <span>
                    Route ${index + 1}
                </span>

                <strong>
                    ${Number(
                        route.distance_km
                    ).toFixed(1)} km
                </strong>

                <small>
                    ${formatDuration(
                        route.duration_minutes
                    )}
                </small>

            `;


            button.addEventListener(
                "click",
                function () {

                    selectRoute(
                        index
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );

}


// ==========================================
// SELECT ROUTE
// ==========================================

async function selectRoute(
    index
) {

    if (
        !currentRouteData ||
        !currentRouteData.routes[index]
    ) {

        return;

    }


    selectedRouteIndex =
        index;


    const route =
        currentRouteData.routes[
            index
        ];


    // Highlight map routes

    routeLayers.forEach(
        (layer, routeIndex) => {

            layer.setStyle({

                weight:
                    routeIndex === index
                        ? 7
                        : 4,

                opacity:
                    routeIndex === index
                        ? 0.95
                        : 0.45

            });

        }
    );


    // Update cards

    updateRouteInformation(
        currentRouteData
    );


    // Recalculate risk for selected route

    await loadRouteRisk(
        route
    );

}


// ==========================================
// ROUTE WEATHER + RISK
// ==========================================

async function loadRouteRisk(
    route
) {

    try {

        const response =
            await fetch(
                `${API_BASE}/route-risk`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            route: route
                        })
                }
            );


        if (!response.ok) {

            const error =
                await response.json()
                    .catch(() => ({}));


            throw new Error(
                error.error ||
                "Route risk unavailable."
            );

        }


        const data =
            await response.json();


        console.log(
            "REAL ROUTE RISK:",
            data
        );


        updateRiskPanel(
            data.risk
        );


    } catch (error) {

        console.error(
            "Route risk error:",
            error
        );


        updateRiskPanel({
            risk_level: "UNKNOWN",
            risk_score: null,
            reasons: [
                "Live weather risk is currently unavailable."
            ]
        });

    }

}


// ==========================================
// RISK PANEL
// ==========================================

function updateRiskPanel(
    risk
) {

    const alertList =
        document.getElementById(
            "alertList"
        );


    if (!alertList || !risk) {
        return;
    }


    const level =
        String(
            risk.risk_level ||
            "UNKNOWN"
        ).toUpperCase();


    const score =
        risk.risk_score;


    const reasons =
        Array.isArray(
            risk.reasons
        )
            ? risk.reasons
            : [];


    let icon =
        "ℹ️";


    if (level === "HIGH") {
        icon = "🔴";
    }

    else if (level === "MEDIUM") {
        icon = "🟡";
    }

    else if (level === "LOW") {
        icon = "🟢";
    }


    const reasonText =
        reasons.length
            ? reasons.join(" • ")
            : "No specific weather risk detected.";


    alertList.innerHTML = `

        <div class="alert-item">

            <div class="alert-icon">
                ${icon}
            </div>

            <div class="alert-content">

                <strong>
                    Route Weather Risk:
                    ${escapeHtml(level)}
                </strong>

                <p>
                    Risk Score:
                    ${
                        score !== null &&
                        score !== undefined
                            ? escapeHtml(
                                String(score)
                            )
                            : "Unavailable"
                    }
                </p>

                <small>
                    ${escapeHtml(
                        reasonText
                    )}
                </small>

            </div>

        </div>

    `;

}


// ==========================================
// REAL VEHICLES
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


        // Stats

        const active =
            vehicles.filter(
                vehicle =>
                    vehicle.status ===
                    "active"
            );


        const delayed =
            vehicles.filter(
                vehicle =>
                    vehicle.status ===
                    "delayed"
            );


        setText(
            "activeVehicles",
            active.length
        );


        setText(
            "delayedVehicles",
            delayed.length
        );


        // Table

        updateVehicleTable(
            vehicles
        );


        // Map

        updateVehicleMarkers(
            vehicles
        );


    } catch (error) {

        console.error(
            "Vehicle error:",
            error
        );

    }

}


// ==========================================
// VEHICLE TABLE
// ==========================================

function updateVehicleTable(
    vehicles
) {

    const container =
        document.getElementById(
            "vehicleRows"
        );


    if (!container) return;


    if (!vehicles.length) {

        container.innerHTML = `
            <div class="empty-table">
                No live vehicles registered.
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    vehicles.forEach(
        vehicle => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "table-row";


            const status =
                vehicle.status ||
                "unknown";


            row.innerHTML = `

                <span>
                    <strong>
                        ${escapeHtml(
                            vehicle.vehicle_id ||
                            "Vehicle"
                        )}
                    </strong>
                </span>

                <span>
                    ${
                        Number(
                            vehicle.latitude
                        ).toFixed(5)
                    },
                    ${
                        Number(
                            vehicle.longitude
                        ).toFixed(5)
                    }
                </span>

                <span
                    class="status-badge ${
                        status === "active"
                            ? "active"
                            : "delayed"
                    }"
                >
                    ● ${escapeHtml(status)}
                </span>

                <span>
                    ${formatUpdatedAt(
                        vehicle.updated_at
                    )}
                </span>

            `;


            container.appendChild(
                row
            );

        }
    );

}


// ==========================================
// VEHICLE MAP MARKERS
// ==========================================

function updateVehicleMarkers(
    vehicles
) {

    if (!map) return;


    const currentIds =
        new Set();


    vehicles.forEach(
        vehicle => {

            const id =
                String(
                    vehicle.vehicle_id ||
                    ""
                );


            const lat =
                Number(
                    vehicle.latitude
                );


            const lon =
                Number(
                    vehicle.longitude
                );


            if (
                !id ||
                !Number.isFinite(lat) ||
                !Number.isFinite(lon)
            ) {

                return;

            }


            currentIds.add(id);


            const popup = `

                <strong>
                    Vehicle ${escapeHtml(id)}
                </strong>

                <br>

                Status:
                ${escapeHtml(
                    vehicle.status ||
                    "unknown"
                )}

                <br>

                Speed:
                ${
                    vehicle.speed !== null &&
                    vehicle.speed !== undefined
                        ? escapeHtml(
                            String(
                                vehicle.speed
                            )
                        ) + " km/h"
                        : "Not provided"
                }

                <br>

                GPS:
                ${lat.toFixed(5)},
                ${lon.toFixed(5)}

            `;


            if (
                vehicleMarkers[id]
            ) {

                vehicleMarkers[id]
                    .setLatLng([
                        lat,
                        lon
                    ])
                    .setPopupContent(
                        popup
                    );

            }

            else {

                vehicleMarkers[id] =
                    L.marker([
                        lat,
                        lon
                    ])
                    .addTo(map)
                    .bindPopup(
                        popup
                    );

            }

        }
    );


    // Remove disappeared vehicles

    Object.keys(
        vehicleMarkers
    ).forEach(
        id => {

            if (
                !currentIds.has(id)
            ) {

                map.removeLayer(
                    vehicleMarkers[id]
                );

                delete vehicleMarkers[id];

            }

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


        setText(
            "backendStatus",
            data.backend === "online"
                ? "Online"
                : "Offline"
        );


        setText(
            "systemOnline",
            data.backend === "online"
                ? "ONLINE"
                : "OFFLINE"
        );


        setText(
            "weatherStatus",
            data.weather_api ||
            "Connected"
        );


        setText(
            "vehicleStatus",
            data.vehicle_tracking ||
            "GPS service connected"
        );


        setText(
            "riskStatus",
            data.risk_engine ||
            "Route weather risk"
        );


        setText(
            "routingStatus",
            data.routing_engine ||
            "OSRM routing connected"
        );


    } catch (error) {

        console.error(
            "Status error:",
            error
        );


        setText(
            "backendStatus",
            "Offline"
        );


        setText(
            "systemOnline",
            "OFFLINE"
        );

    }

}


// ==========================================
// ROUTE BUTTON
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

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


                    if (
                        !origin ||
                        !destination
                    ) {

                        alert(
                            "Please enter origin and destination."
                        );

                        return;

                    }


                    routeButton.disabled =
                        true;


                    routeButton.textContent =
                        "CALCULATING REAL ROUTE...";


                    await loadRealRoute(
                        origin,
                        destination
                    );


                    routeButton.disabled =
                        false;


                    routeButton.textContent =
                        "ANALYZE REAL ROUTE →";

                }
            );

        }

    }
);


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    if (
        confirm(
            "Are you sure you want to logout?"
        )
    ) {

        window.location.href =
            "index.html";

    }

}


// ==========================================
// NAVIGATION
// ==========================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    document
                        .querySelectorAll(
                            ".nav-item"
                        )
                        .forEach(
                            nav => {

                                nav.classList.remove(
                                    "active"
                                );

                            }
                        );


                    this.classList.add(
                        "active"
                    );

                }
            );

        }
    );


// ==========================================
// HELPERS
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function formatDuration(
    minutes
) {

    const total =
        Number(minutes);


    if (
        !Number.isFinite(total)
    ) {

        return "—";

    }


    const hours =
        Math.floor(
            total / 60
        );


    const mins =
        Math.round(
            total % 60
        );


    if (hours === 0) {

        return `${mins} min`;

    }


    return `${hours}h ${mins}m`;

}


function formatUpdatedAt(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function escapeHtml(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// START DASHBOARD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMap();

        loadSystemStatus();

        loadVehicles();

    }
);


// ==========================================
// LIVE REFRESH
// ==========================================

setInterval(
    function () {

        loadSystemStatus();

        loadVehicles();

    },
    30000
);

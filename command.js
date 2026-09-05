// ==========================================
// ROUTEGUARD AI - REAL DASHBOARD
// REAL ROUTES + REAL GPS VEHICLES
// ==========================================

const API_BASE = "/api";

let map = null;

let routeLayers = [];

let vehicleMarkers = {};

let currentRouteData = null;


// ==========================================
// INITIALIZE MAP
// ==========================================

function initializeMap() {

    const mapElement =
        document.getElementById("realMap");

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


        const url =
            `${API_BASE}/route` +
            `?origin=${encodeURIComponent(origin)}` +
            `&destination=${encodeURIComponent(destination)}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            const error =
                await response.json()
                    .catch(() => ({}));

            throw new Error(
                error.error ||
                "Route service unavailable."
            );
        }


        const data =
            await response.json();


        if (
            !data.success ||
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error(
                "No real road route found."
            );
        }


        currentRouteData = data;


        drawAllRoutes(data);


        updateRouteInformation(data);


        if (loading) {
            loading.remove();
        }


    } catch (error) {

        console.error(
            "REAL ROUTE ERROR:",
            error
        );


        if (loading) {

            loading.textContent =
                "Unable to load real route.";

        }

    }

}


// ==========================================
// DRAW ALL REAL ROUTES
// ==========================================

function drawAllRoutes(data) {

    if (!map) return;


    // Remove old routes

    routeLayers.forEach(layer => {

        map.removeLayer(layer);

    });

    routeLayers = [];


    const bounds = [];


    data.routes.forEach(
        (route, index) => {

            const isPrimary =
                index === 0;


            const layer =
                L.geoJSON(
                    route.geometry,
                    {
                        style: {

                            weight:
                                isPrimary
                                    ? 6
                                    : 4,

                            opacity:
                                isPrimary
                                    ? 0.95
                                    : 0.65

                        }
                    }
                );


            layer.addTo(map);


            routeLayers.push(layer);


            // Popup

            layer.bindPopup(
                `
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
                `
            );


            const layerBounds =
                layer.getBounds();


            if (
                layerBounds.isValid()
            ) {

                bounds.push(
                    layerBounds
                );

            }

        }
    );


    // Origin marker

    const originLat =
        data.origin.latitude;

    const originLon =
        data.origin.longitude;


    const destinationLat =
        data.destination.latitude;

    const destinationLon =
        data.destination.longitude;


    L.marker([
        originLat,
        originLon
    ])
        .addTo(map)
        .bindPopup(
            `
            <strong>Origin</strong>
            <br>
            ${escapeHtml(
                data.origin.query
            )}
            `
        );


    L.marker([
        destinationLat,
        destinationLon
    ])
        .addTo(map)
        .bindPopup(
            `
            <strong>Destination</strong>
            <br>
            ${escapeHtml(
                data.destination.query
            )}
            `
        );


    // Fit map

    if (bounds.length > 0) {

        let combined =
            bounds[0];

        for (
            let i = 1;
            i < bounds.length;
            i++
        ) {

            combined =
                combined.extend(
                    bounds[i]
                );

        }

        map.fitBounds(
            combined,
            {
                padding: [30, 30]
            }
        );

    }

}


// ==========================================
// ROUTE INFORMATION
// ==========================================

function updateRouteInformation(data) {

    const firstRoute =
        data.routes[0];


    const distance =
        `${firstRoute.distance_km} km`;


    const duration =
        formatDuration(
            firstRoute.duration_minutes
        );


    // Main cards

    const distanceElement =
        document.getElementById(
            "routeDistance"
        );


    const durationElement =
        document.getElementById(
            "routeDuration"
        );


    if (distanceElement) {

        distanceElement.textContent =
            distance;

    }


    if (durationElement) {

        durationElement.textContent =
            duration;

    }


    // Small cards

    const smallDistance =
        document.getElementById(
            "routeDistanceSmall"
        );


    const smallDuration =
        document.getElementById(
            "routeDurationSmall"
        );


    if (smallDistance) {

        smallDistance.textContent =
            distance;

    }


    if (smallDuration) {

        smallDuration.textContent =
            duration;

    }


    // Origin

    const originElement =
        document.getElementById(
            "routeOrigin"
        );


    const destinationElement =
        document.getElementById(
            "routeDestination"
        );


    if (originElement) {

        originElement.textContent =
            data.origin.query;

    }


    if (destinationElement) {

        destinationElement.textContent =
            data.destination.query;

    }


    createAlternateRoutes(
        data.routes
    );

}


// ==========================================
// ALTERNATE ROUTES UI
// ==========================================

function createAlternateRoutes(
    routes
) {

    let container =
        document.getElementById(
            "alternateRoutes"
        );


    if (!container) {

        const routeCard =
            document.querySelector(
                ".route-info-card"
            );


        if (!routeCard) return;


        container =
            document.createElement(
                "div"
            );


        container.id =
            "alternateRoutes";


        routeCard.appendChild(
            container
        );

    }


    container.innerHTML = "";


    const title =
        document.createElement(
            "div"
        );


    title.className =
        "alternate-title";


    title.textContent =
        "AVAILABLE REAL ROUTES";


    container.appendChild(
        title
    );


    routes.forEach(
        (route, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "alternate-route";


            if (index === 0) {

                button.classList.add(
                    "selected"
                );

            }


            button.innerHTML = `
                <span>
                    Route ${index + 1}
                </span>

                <strong>
                    ${route.distance_km} km
                </strong>

                <small>
                    ${formatDuration(
                        route.duration_minutes
                    )}
                </small>
            `;


            button.addEventListener(
                "click",
                () => {

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

function selectRoute(
    selectedIndex
) {

    if (
        !currentRouteData ||
        !currentRouteData.routes[
            selectedIndex
        ]
    ) {

        return;

    }


    const selectedRoute =
        currentRouteData.routes[
            selectedIndex
        ];


    // Update buttons

    document
        .querySelectorAll(
            ".alternate-route"
        )
        .forEach(
            (button, index) => {

                button.classList.toggle(
                    "selected",
                    index === selectedIndex
                );

            }
        );


    // Update cards

    const distance =
        document.getElementById(
            "routeDistance"
        );


    const duration =
        document.getElementById(
            "routeDuration"
        );


    const smallDistance =
        document.getElementById(
            "routeDistanceSmall"
        );


    const smallDuration =
        document.getElementById(
            "routeDurationSmall"
        );


    if (distance) {

        distance.textContent =
            `${selectedRoute.distance_km} km`;

    }


    if (duration) {

        duration.textContent =
            formatDuration(
                selectedRoute.duration_minutes
            );

    }


    if (smallDistance) {

        smallDistance.textContent =
            `${selectedRoute.distance_km} km`;

    }


    if (smallDuration) {

        smallDuration.textContent =
            formatDuration(
                selectedRoute.duration_minutes
            );

    }


    // Highlight selected route

    routeLayers.forEach(
        (layer, index) => {

            layer.setStyle({

                weight:
                    index === selectedIndex
                        ? 7
                        : 3,

                opacity:
                    index === selectedIndex
                        ? 1
                        : 0.35

            });

        }
    );


    console.log(
        "Selected real route:",
        selectedRoute
    );

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
                "Vehicle API unavailable."
            );

        }


        const data =
            await response.json();


        const vehicles =
            data.vehicles || [];


        updateVehicleStats(
            vehicles
        );


        updateVehicleTable(
            vehicles
        );


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
// VEHICLE STATS
// ==========================================

function updateVehicleStats(
    vehicles
) {

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


    if (vehicles.length === 0) {

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
                            vehicle.vehicle_id
                        )}
                    </strong>
                </span>

                <span>
                    ${Number(
                        vehicle.latitude
                    ).toFixed(5)},
                    ${Number(
                        vehicle.longitude
                    ).toFixed(5)}
                </span>

                <span class="status-badge ${
                    status === "active"
                        ? "active"
                        : "delayed"
                }">
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
// REAL GPS MARKERS
// ==========================================

function updateVehicleMarkers(
    vehicles
) {

    if (!map) return;


    const activeIds =
        new Set();


    vehicles.forEach(
        vehicle => {

            if (
                vehicle.latitude === undefined ||
                vehicle.longitude === undefined
            ) {

                return;

            }


            const id =
                String(
                    vehicle.vehicle_id
                );


            activeIds.add(id);


            const lat =
                Number(
                    vehicle.latitude
                );


            const lon =
                Number(
                    vehicle.longitude
                );


            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon)
            ) {

                return;

            }


            const popup = `
                <strong>
                    Vehicle ${escapeHtml(id)}
                </strong>
                <br>
                Status:
                ${escapeHtml(
                    vehicle.status || "unknown"
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
                Heading:
                ${
                    vehicle.heading !== null &&
                    vehicle.heading !== undefined
                        ? escapeHtml(
                            String(
                                vehicle.heading
                            )
                        ) + "°"
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

            } else {

                const marker =
                    L.marker([
                        lat,
                        lon
                    ])
                    .addTo(map)
                    .bindPopup(
                        popup
                    );


                vehicleMarkers[id] =
                    marker;

            }

        }
    );


    // Remove vehicles that disappeared

    Object.keys(
        vehicleMarkers
    ).forEach(
        id => {

            if (
                !activeIds.has(id)
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
                "Status unavailable."
            );

        }


        const data =
            await response.json();


        const backend =
            document.getElementById(
                "backendStatus"
            );


        const systemOnline =
            document.getElementById(
                "systemOnline"
            );


        const weather =
            document.getElementById(
                "weatherStatus"
            );


        const vehicle =
            document.getElementById(
                "vehicleStatus"
            );


        const risk =
            document.getElementById(
                "riskStatus"
            );


        const routing =
            document.getElementById(
                "routingStatus"
            );


        if (backend) {

            backend.textContent =
                data.backend === "online"
                    ? "Online"
                    : "Offline";

        }


        if (systemOnline) {

            systemOnline.textContent =
                data.backend === "online"
                    ? "ONLINE"
                    : "OFFLINE";

        }


        if (weather) {

            weather.textContent =
                data.weather_api ||
                "Unavailable";

        }


        if (vehicle) {

            vehicle.textContent =
                data.vehicle_tracking ||
                "Unavailable";

        }


        if (risk) {

            risk.textContent =
                data.risk_engine ||
                "Unavailable";

        }


        if (routing) {

            routing.textContent =
                data.routing_engine ||
                "Unavailable";

        }


    } catch (error) {

        console.error(
            "System status error:",
            error
        );

    }

}


// ==========================================
// ROUTE BUTTON
// ==========================================

const routeButton =
    document.getElementById(
        "routeButton"
    );


if (routeButton) {

    routeButton.addEventListener(
        "click",
        async () => {

            const origin =
                document.getElementById(
                    "originInput"
                )?.value.trim();


            const destination =
                document.getElementById(
                    "destinationInput"
                )?.value.trim();


            if (!origin || !destination) {

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


// ==========================================
// LOGOUT
// ==========================================

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmLogout) {
        return;
    }


    window.location.href =
        "index.html";

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
                function(event) {

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
// FORMAT DURATION
// ==========================================

function formatDuration(
    minutes
) {

    const total =
        Number(minutes);


    if (!Number.isFinite(total)) {

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


// ==========================================
// FORMAT UPDATED TIME
// ==========================================

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


// ==========================================
// HTML SAFETY
// ==========================================

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
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMap();

        loadSystemStatus();

        loadVehicles();

    }
);


// ==========================================
// REAL-TIME REFRESH
// ==========================================

setInterval(
    () => {

        loadSystemStatus();

        loadVehicles();

    },
    30000
);

// ==========================================
// LOGOUT
// ==========================================

const logoutBtn = document.querySelector(".logout");

if (logoutBtn) {

    logoutBtn.addEventListener("click", () => {

        window.location.href = "index.html";

    });

}

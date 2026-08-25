const API_BASE = "/api";

async function loadDashboard() {
    try {
        // Backend status
        const statusResponse = await fetch(`${API_BASE}/status`);
        const status = await statusResponse.json();

        console.log("RouteGuard Status:", status);

        // Vehicles
        const vehicleResponse = await fetch(`${API_BASE}/vehicles`);
        const vehicleData = await vehicleResponse.json();

        const vehicles = vehicleData.vehicles || [];

        updateVehicleCount(vehicles);
        updateSystemStatus(status);

        // If vehicles exist, fetch real weather/risk
        if (vehicles.length > 0) {
            const vehicle = vehicles[0];

            const riskResponse = await fetch(
                `${API_BASE}/risk/${encodeURIComponent(vehicle.vehicle_id)}`
            );

            if (riskResponse.ok) {
                const riskData = await riskResponse.json();
                updateRisk(riskData);
            }
        }

    } catch (error) {
        console.error("Dashboard API error:", error);
        showBackendError();
    }
}


// ==============================
// VEHICLE COUNT
// ==============================

function updateVehicleCount(vehicles) {

    const activeVehicles = vehicles.filter(
        vehicle => vehicle.status === "active"
    );

    const elements = document.querySelectorAll(
        ".stat-card, .kpi-card, .metric-card"
    );

    elements.forEach(card => {

        const text = card.innerText.toLowerCase();

        if (text.includes("active vehicle")) {

            const number = card.querySelector(
                ".stat-value, .kpi-value, strong, h2"
            );

            if (number) {
                number.textContent = activeVehicles.length;
            }
        }
    });
}


// ==============================
// SYSTEM STATUS
// ==============================

function updateSystemStatus(status) {

    console.log("Backend:", status.backend);
    console.log("Weather API:", status.weather_api);
    console.log("Routing:", status.routing_engine);
    console.log("GPS:", status.vehicle_tracking);
    console.log("Risk Engine:", status.risk_engine);
}


// ==============================
// RISK
// ==============================

function updateRisk(data) {

    console.log("REAL RISK DATA:", data);

    const risk = data.risk;

    if (!risk) return;

    const riskLevel = risk.risk_level;
    const riskScore = risk.risk_score;

    const riskElements = document.querySelectorAll(
        ".risk-value, .risk-level, .alert-risk"
    );

    riskElements.forEach(element => {
        element.textContent =
            `${riskLevel} (${riskScore}/100)`;
    });

    console.log(
        "Weather:",
        risk.weather
    );

    console.log(
        "Reasons:",
        risk.reasons
    );
}


// ==============================
// ERROR
// ==============================

function showBackendError() {

    console.warn(
        "RouteGuard backend unavailable."
    );
}


// ==============================
// AUTO REFRESH
// ==============================

loadDashboard();

setInterval(
    loadDashboard,
    30000
);

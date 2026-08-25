// ==========================================
// ROUTEGUARD AI - DASHBOARD JAVASCRIPT
// ==========================================


// ==========================================
// 1. BACKEND URL
// ==========================================

const API_BASE = "";


// ==========================================
// 2. ELEMENTS
// ==========================================

const activeVehiclesElement =
    document.getElementById("activeVehicles");

const delayedVehiclesElement =
    document.getElementById("delayedVehicles");

const activeAlertsElement =
    document.getElementById("activeAlerts");

const backendStatusElement =
    document.getElementById("backendStatus");

const weatherStatusElement =
    document.getElementById("weatherStatus");

const vehicleStatusElement =
    document.getElementById("vehicleStatus");

const riskStatusElement =
    document.getElementById("riskStatus");


// ==========================================
// 3. LOAD SYSTEM STATUS
// ==========================================

async function loadSystemStatus() {

    try {

        const response =
            await fetch(`${API_BASE}/api/status`);

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        const data = await response.json();


        // Backend
        if (backendStatusElement) {

            backendStatusElement.textContent =
                data.backend === "online"
                    ? "Online"
                    : "Offline";

        }


        // Weather
        if (weatherStatusElement) {

            weatherStatusElement.textContent =
                data.weather_api === "connected"
                    ? "Connected"
                    : "Unavailable";

        }


        // Vehicle tracking
        if (vehicleStatusElement) {

            vehicleStatusElement.textContent =
                data.vehicle_tracking || "GPS Ready";

        }


        // Risk engine
        if (riskStatusElement) {

            riskStatusElement.textContent =
                data.risk_engine || "Active";

        }


    } catch (error) {

        console.error(
            "System status error:",
            error
        );


        if (backendStatusElement) {

            backendStatusElement.textContent =
                "Offline";

        }

    }

}


// ==========================================
// 4. LOAD VEHICLES
// ==========================================

async function loadVehicles() {

    try {

        const response =
            await fetch(`${API_BASE}/api/vehicles`);

        if (!response.ok) {
            throw new Error("Vehicle API unavailable");
        }

        const data = await response.json();

        const vehicles =
            data.vehicles || [];


        // ----------------------------------
        // ACTIVE VEHICLES
        // ----------------------------------

        const activeVehicles =
            vehicles.filter(vehicle => {

                return (
                    vehicle.status === "active" ||
                    vehicle.status === "on_route"
                );

            });


        if (activeVehiclesElement) {

            activeVehiclesElement.textContent =
                activeVehicles.length;

        }


        // ----------------------------------
        // DELAYED VEHICLES
        // ----------------------------------

        const delayedVehicles =
            vehicles.filter(vehicle => {

                return (
                    vehicle.status === "delayed"
                );

            });


        if (delayedVehiclesElement) {

            delayedVehiclesElement.textContent =
                delayedVehicles.length;

        }


        // ----------------------------------
        // ACTIVE ALERTS
        // ----------------------------------

        if (activeAlertsElement) {

            activeAlertsElement.textContent =
                delayedVehicles.length;

        }


        console.log(
            "Vehicles loaded:",
            vehicles
        );


    } catch (error) {

        console.error(
            "Vehicle loading error:",
            error
        );

    }

}


// ==========================================
// 5. REFRESH DASHBOARD
// ==========================================

async function refreshDashboard() {

    await loadSystemStatus();

    await loadVehicles();

}


// ==========================================
// 6. LOGOUT
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
// 7. ROUTE BUTTON
// ==========================================

const routeButton =
    document.querySelector(".route-btn");


if (routeButton) {

    routeButton.addEventListener(
        "click",
        function () {

            const inputs =
                document.querySelectorAll(
                    ".route-inputs input"
                );


            const from =
                inputs[0]?.value.trim();

            const destination =
                inputs[1]?.value.trim();


            if (!from || !destination) {

                alert(
                    "Please enter both starting point and destination."
                );

                return;

            }


            alert(
                `Route analysis started:\n\n${from} → ${destination}`
            );

        }
    );

}


// ==========================================
// 8. NAVIGATION
// ==========================================

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );


navItems.forEach(item => {

    item.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            navItems.forEach(nav => {

                nav.classList.remove(
                    "active"
                );

            });


            this.classList.add(
                "active"
            );

        }
    );

});


// ==========================================
// 9. INITIAL LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        refreshDashboard();

    }
);


// ==========================================
// 10. AUTO REFRESH
// ==========================================

setInterval(
    refreshDashboard,
    30000
);
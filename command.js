// ==========================================
// ROUTEGUARD AI
// SMART LOGISTICS COMMAND CENTER
// FULL BACKEND CONNECTED VERSION
// ==========================================


// ==========================================
// BACKEND
// ==========================================

const BACKEND_URL = "http://127.0.0.1:5000";


// ==========================================
// GLOBAL VARIABLES
// ==========================================

let map = null;

let routeLayer = null;

let locationMarkers = [];

let vehicleMarkers = [];


// ==========================================
// INITIALIZE MAP
// ==========================================

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
    [27.5, 78.5],
    6
);


// ==========================================
// GEOCODING
// ==========================================

async function findLocation(place) {

    const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&limit=1" +
        "&countrycodes=in" +
        "&q=" +
        encodeURIComponent(place);

    const response =
        await fetch(url);

    if (!response.ok) {

        throw new Error(
            "Location service unavailable."
        );

    }

    const data =
        await response.json();

    if (data.length === 0) {

        throw new Error(
            `Location not found: ${place}`
        );

    }

    return {

        lat:
            parseFloat(data[0].lat),

        lon:
            parseFloat(data[0].lon),

        name:
            data[0].display_name

    };
}


// ==========================================
// WEATHER THROUGH BACKEND
// ==========================================

async function getWeather(
    lat,
    lon
) {

    const response =
        await fetch(
            `${BACKEND_URL}/api/weather?lat=${lat}&lon=${lon}`
        );

    if (!response.ok) {

        throw new Error(
            "Backend weather service unavailable."
        );

    }

    const data =
        await response.json();

    if (data.error) {

        throw new Error(
            data.error
        );

    }

    return data.current;
}


// ==========================================
// WEATHER RISK
// ==========================================

function calculateWeatherRisk(
    weather
) {

    let risk = 0;

    const factors = [];


    // Rain
    if (
        weather.rain > 0
    ) {

        risk += 20;

        factors.push(
            "Rain detected"
        );

    }


    // Heavy rain
    if (
        weather.rain >= 5
    ) {

        risk += 25;

        factors.push(
            "Heavy rainfall"
        );

    }


    // Strong wind
    if (
        weather.wind_speed_10m >= 30
    ) {

        risk += 20;

        factors.push(
            "Strong wind"
        );

    }


    // Very strong wind
    if (
        weather.wind_speed_10m >= 50
    ) {

        risk += 15;

        factors.push(
            "Very strong wind"
        );

    }


    // High precipitation
    if (
        weather.precipitation >= 5
    ) {

        risk += 20;

        factors.push(
            "High precipitation"
        );

    }


    // Thunderstorm
    if (
        weather.weather_code >= 95
    ) {

        risk += 25;

        factors.push(
            "Thunderstorm signal"
        );

    }


    return {

        score:
            Math.min(
                risk,
                100
            ),

        factors:
            factors

    };

}


// ==========================================
// COMBINED ROUTE RISK
// ==========================================

function calculateRouteRisk(
    weatherRisk,
    distance,
    duration,
    weather
) {

    let risk =
        weatherRisk.score;

    const factors =
        [
            ...weatherRisk.factors
        ];


    // Long route
    if (
        distance > 500
    ) {

        risk += 8;

        factors.push(
            "Long-distance route"
        );

    }


    // Very long route
    if (
        distance > 800
    ) {

        risk += 7;

        factors.push(
            "Very long route"
        );

    }


    // Long journey
    if (
        duration > 600
    ) {

        risk += 5;

        factors.push(
            "Long driving duration"
        );

    }


    // High wind exposure
    if (
        weather.wind_speed_10m > 40
    ) {

        risk += 10;

        factors.push(
            "High wind exposure"
        );

    }


    return {

        score:
            Math.min(
                Math.round(risk),
                100
            ),

        factors:
            factors

    };

}


// ==========================================
// UPDATE RISK UI
// ==========================================

function updateRiskUI(
    risk,
    factors
) {

    const riskScore =
        document.getElementById(
            "riskScore"
        );

    const riskBar =
        document.getElementById(
            "riskBar"
        );

    const riskMessage =
        document.getElementById(
            "riskMessage"
        );


    if (
        !riskScore ||
        !riskBar ||
        !riskMessage
    ) {

        return;

    }


    riskScore.textContent =
        `${risk}%`;


    riskBar.style.width =
        `${Math.max(risk, 5)}%`;


    if (
        risk >= 70
    ) {

        riskMessage.innerHTML =
            "🔴 HIGH RISK — Multiple risk signals detected.";

    }

    else if (
        risk >= 40
    ) {

        riskMessage.innerHTML =
            "🟠 MODERATE RISK — Monitor route conditions.";

    }

    else {

        riskMessage.innerHTML =
            "🟢 LOW RISK — Current conditions appear favorable.";

    }


    console.log(
        "Risk Score:",
        risk
    );

    console.log(
        "Risk Factors:",
        factors
    );

}


// ==========================================
// LOCATION MARKER
// ==========================================

function createLocationMarker(
    location,
    title,
    weather
) {

    const marker =
        L.marker(
            [
                location.lat,
                location.lon
            ]
        )
        .addTo(map)
        .bindPopup(

            `<b>${title}</b><br>` +

            `${location.name}` +

            `<br><br>` +

            `🌡️ Temperature: ` +

            `${weather.temperature_2m}°C` +

            `<br>` +

            `🌧️ Rain: ` +

            `${weather.rain} mm` +

            `<br>` +

            `💨 Wind: ` +

            `${weather.wind_speed_10m} km/h`

        );


    locationMarkers.push(
        marker
    );

}


// ==========================================
// CLEAR LOCATION MARKERS
// ==========================================

function clearLocationMarkers() {

    locationMarkers.forEach(
        marker => {

            map.removeLayer(
                marker
            );

        }
    );


    locationMarkers = [];

}


// ==========================================
// REAL ROUTE ANALYSIS
// ==========================================

async function calculateRoute() {

    const originInput =
        document.getElementById(
            "origin"
        );

    const destinationInput =
        document.getElementById(
            "destination"
        );

    const button =
        document.getElementById(
            "analyzeBtn"
        );


    if (
        !originInput ||
        !destinationInput ||
        !button
    ) {

        console.error(
            "Required HTML elements not found."
        );

        return;

    }


    const originText =
        originInput.value.trim();


    const destinationText =
        destinationInput.value.trim();


    if (
        !originText ||
        !destinationText
    ) {

        alert(
            "Please enter both origin and destination."
        );

        return;

    }


    button.disabled =
        true;

    button.textContent =
        "🔄 Analyzing...";


    try {

        // ==================================
        // 1. FIND ORIGIN
        // ==================================

        const origin =
            await findLocation(
                originText
            );


        // ==================================
        // 2. FIND DESTINATION
        // ==================================

        const destination =
            await findLocation(
                destinationText
            );


        // ==================================
        // 3. GET ORIGIN WEATHER
        // ==================================

        const originWeather =
            await getWeather(
                origin.lat,
                origin.lon
            );


        // ==================================
        // 4. GET DESTINATION WEATHER
        // ==================================

        const destinationWeather =
            await getWeather(
                destination.lat,
                destination.lon
            );


        // ==================================
        // 5. WEATHER RISK
        // ==================================

        const originRisk =
            calculateWeatherRisk(
                originWeather
            );


        const destinationRisk =
            calculateWeatherRisk(
                destinationWeather
            );


        const weatherRisk =
            originRisk.score >=
            destinationRisk.score

                ? originRisk

                : destinationRisk;


        // ==================================
        // 6. CLEAR OLD LOCATION MARKERS
        // ==================================

        clearLocationMarkers();


        // ==================================
        // 7. CREATE ORIGIN MARKER
        // ==================================

        createLocationMarker(
            origin,
            "📍 Origin",
            originWeather
        );


        // ==================================
        // 8. CREATE DESTINATION MARKER
        // ==================================

        createLocationMarker(
            destination,
            "🏁 Destination",
            destinationWeather
        );


        // ==================================
        // 9. REAL ROAD ROUTE
        // ==================================

        const routeURL =

            "https://router.project-osrm.org/" +

            "route/v1/driving/" +

            `${origin.lon},${origin.lat};` +

            `${destination.lon},${destination.lat}` +

            "?overview=full" +

            "&geometries=geojson";


        const routeResponse =
            await fetch(
                routeURL
            );


        if (
            !routeResponse.ok
        ) {

            throw new Error(
                "Routing service unavailable."
            );

        }


        const routeData =
            await routeResponse.json();


        if (
            !routeData.routes ||
            routeData.routes.length === 0
        ) {

            throw new Error(
                "No driving route found."
            );

        }


        const route =
            routeData.routes[0];


        // ==================================
        // 10. REMOVE OLD ROUTE
        // ==================================

        if (
            routeLayer
        ) {

            map.removeLayer(
                routeLayer
            );

        }


        // ==================================
        // 11. DRAW ROUTE
        // ==================================

        routeLayer =
            L.geoJSON(
                route.geometry,
                {

                    style: {

                        color:
                            "#00d084",

                        weight:
                            6,

                        opacity:
                            0.9

                    }

                }
            )
            .addTo(map);


        // ==================================
        // 12. FIT ROUTE
        // ==================================

        map.fitBounds(
            routeLayer.getBounds(),
            {
                padding:
                    [40, 40]
            }
        );


        // ==================================
        // 13. DISTANCE
        // ==================================

        const distance =
            route.distance /
            1000;


        const distanceRounded =
            distance.toFixed(1);


        // ==================================
        // 14. ESTIMATED TIME
        // ==================================

        const duration =
            Math.round(
                route.duration /
                60
            );


        // ==================================
        // 15. COMBINED RISK
        // ==================================

        const finalRisk =
            calculateRouteRisk(

                weatherRisk,

                distance,

                duration,

                originWeather

            );


        // ==================================
        // 16. UPDATE RISK
        // ==================================

        updateRiskUI(
            finalRisk.score,
            finalRisk.factors
        );


        // ==================================
        // 17. UPDATE RECOMMENDATION
        // ==================================

        const recommendation =
            document.getElementById(
                "recommendedRoute"
            );


        const delayValue =
            document.getElementById(
                "delayValue"
            );


        if (
            recommendation
        ) {

            if (
                finalRisk.score >= 70
            ) {

                recommendation.textContent =
                    "Evaluate Alternate Route";

            }

            else if (
                finalRisk.score >= 40
            ) {

                recommendation.textContent =
                    "Monitor Route";

            }

            else {

                recommendation.textContent =
                    "Primary Route";

            }

        }


        if (
            delayValue
        ) {

            if (
                finalRisk.score >= 70
            ) {

                delayValue.textContent =
                    "High risk";

            }

            else if (
                finalRisk.score >= 40
            ) {

                delayValue.textContent =
                    "Weather dependent";

            }

            else {

                delayValue.textContent =
                    "Normal conditions";

            }

        }


        // ==================================
        // 18. CONSOLE REPORT
        // ==================================

        console.log(
            "================================"
        );

        console.log(
            "ROUTEGUARD AI ANALYSIS"
        );

        console.log(
            "Origin:",
            originText
        );

        console.log(
            "Destination:",
            destinationText
        );

        console.log(
            "Distance:",
            distanceRounded,
            "km"
        );

        console.log(
            "Estimated time:",
            duration,
            "minutes"
        );

        console.log(
            "Weather risk:",
            weatherRisk.score,
            "%"
        );

        console.log(
            "Combined risk:",
            finalRisk.score,
            "%"
        );

        console.log(
            "Risk factors:",
            finalRisk.factors
        );

        console.log(
            "================================"
        );


    }

    catch (error) {

        console.error(
            "RouteGuard error:",
            error
        );


        alert(
            "Route analysis failed.\n\n" +
            error.message
        );

    }

    finally {

        button.disabled =
            false;

        button.textContent =
            "🤖 Analyze Route";

    }

}


// ==========================================
// REAL BACKEND VEHICLE TRACKING
// ==========================================

const truckIcon =
    L.divIcon({

        className:
            "truck-marker",

        html:
            "🚚",

        iconSize:
            [35, 35],

        iconAnchor:
            [17, 17]

    });


// ==========================================
// LOAD VEHICLES
// ==========================================

async function loadVehicles() {

    try {

        const response =
            await fetch(
                `${BACKEND_URL}/api/vehicles`
            );


        if (
            !response.ok
        ) {

            throw new Error(
                "Vehicle service unavailable."
            );

        }


        const data =
            await response.json();


        console.log(
            "Backend vehicles:",
            data.vehicles
        );


        // Remove previous vehicle markers

        vehicleMarkers.forEach(
            marker => {

                map.removeLayer(
                    marker
                );

            }
        );


        vehicleMarkers = [];


        // Add ONLY backend vehicles

        data.vehicles.forEach(
            vehicle => {

                // Validate GPS coordinates

                if (
                    typeof vehicle.latitude !==
                        "number" ||

                    typeof vehicle.longitude !==
                        "number"
                ) {

                    return;

                }


                const marker =
                    L.marker(
                        [
                            vehicle.latitude,
                            vehicle.longitude
                        ],
                        {
                            icon:
                                truckIcon
                        }
                    )
                    .addTo(map)
                    .bindPopup(

                        `<b>🚚 Vehicle ${vehicle.vehicle_id}</b>` +

                        `<br>Status: ` +

                        `${vehicle.status || "Unknown"}` +

                        `<br>Speed: ` +

                        `${vehicle.speed ?? "N/A"} km/h` +

                        `<br>Heading: ` +

                        `${vehicle.heading ?? "N/A"}` +

                        `<br>Last update: ` +

                        `${vehicle.updated_at || "N/A"}`

                    );


                vehicleMarkers.push(
                    marker
                );

            }
        );


    }

    catch (error) {

        console.error(
            "Vehicle tracking error:",
            error
        );

    }

}


// ==========================================
// REFRESH VEHICLE DATA
// ==========================================

loadVehicles();


setInterval(
    loadVehicles,
    5000
);


// ==========================================
// WHY THIS ROUTE
// ==========================================

const whyRoute =
    document.getElementById(
        "whyRoute"
    );


if (
    whyRoute
) {

    whyRoute.addEventListener(
        "click",
        function() {

            const explanation =
                document.getElementById(
                    "aiExplanation"
                );


            if (
                explanation
            ) {

                explanation.classList.toggle(
                    "hidden"
                );

            }

        }
    );

}


// ==========================================
// WHAT-IF SIMULATION
// ==========================================

const simulateButton =
    document.getElementById(
        "simulateBtn"
    );


if (
    simulateButton
) {

    simulateButton.addEventListener(
        "click",
        function() {

            const result =
                document.getElementById(
                    "simulationResult"
                );


            if (
                result
            ) {

                result.classList.toggle(
                    "hidden"
                );

            }

        }
    );

}


// ==========================================
// ANALYZE BUTTON
// ==========================================

const analyzeButton =
    document.getElementById(
        "analyzeBtn"
    );


if (
    analyzeButton
) {

    analyzeButton.addEventListener(
        "click",
        calculateRoute
    );

}


// ==========================================
// INITIAL MAP
// ==========================================

console.log(
    "RouteGuard AI Command Center loaded."
);

console.log(
    "Backend:",
    BACKEND_URL
);

console.log(
    "Vehicle tracking:",
    "GPS-ready"
);

console.log(
    "Risk engine:",
    "Rule-based v1"
);s

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ==============================
# FRONTEND
# ==============================
# Serve the existing frontend from the repository root.
# server.py is inside /backend, while index.html, style.css,
# and script.js are in the repository root.

import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

@app.route("/", methods=["GET"])
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>", methods=["GET"])
def frontend_files(filename):
    # Never intercept API requests.
    if filename.startswith("api/"):
        return jsonify({"error": "API endpoint not found"}), 404

    file_path = os.path.join(BASE_DIR, filename)

    if os.path.isfile(file_path):
        return send_from_directory(BASE_DIR, filename)

    return jsonify({"error": "File not found"}), 404

vehicles = {}


# ==============================
# HEALTH CHECK
# ==============================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "online",
        "service": "RouteGuard AI Backend"
    })


# ==============================
# WEATHER
# ==============================

@app.route("/api/weather", methods=["GET"])
def weather():

    lat = request.args.get("lat")
    lon = request.args.get("lon")

    if not lat or not lon:
        return jsonify({
            "error": "Latitude and longitude are required."
        }), 400

    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}"
        f"&longitude={lon}"
        "&current="
        "temperature_2m,"
        "precipitation,"
        "rain,"
        "weather_code,"
        "wind_speed_10m"
        "&timezone=auto"
    )

    try:

        response = requests.get(
            url,
            timeout=10
        )

        response.raise_for_status()

        return jsonify(response.json())

    except requests.RequestException as error:

        return jsonify({
            "error": "Weather service unavailable.",
            "details": str(error)
        }), 502


# ==============================
# REAL ROUTE PLANNING
# OpenStreetMap road network + OSRM
# ==============================

# Verified city-center coordinates used only when the user enters
# one of these city names. The route itself is calculated from the
# live road network by OSRM; no fake distance/time is inserted.
CITY_COORDINATES = {
    "delhi": (28.6139, 77.2090),
    "new delhi": (28.6139, 77.2090),
    "lucknow": (26.8467, 80.9462),
    "kanpur": (26.4499, 80.3319),
    "agra": (27.1767, 78.0081),
    "jaipur": (26.9124, 75.7873),
    "chandigarh": (30.7333, 76.7794),
    "dehradun": (30.3165, 78.0322),
    "varanasi": (25.3176, 82.9739),
    "prayagraj": (25.4358, 81.8463),
    "patna": (25.5941, 85.1376),
    "gurugram": (28.4595, 77.0266),
    "noida": (28.5355, 77.3910)
}


def resolve_location(name):
    if not name:
        return None

    key = name.strip().lower()

    coords = CITY_COORDINATES.get(key)

    if coords is None:
        return None

    return {
        "name": name.strip(),
        "latitude": coords[0],
        "longitude": coords[1]
    }


@app.route("/api/route", methods=["GET"])
def calculate_route():

    origin = request.args.get("origin")
    destination = request.args.get("destination")

    if not origin or not destination:
        return jsonify({
            "error": "origin and destination are required."
        }), 400

    start = resolve_location(origin)
    end = resolve_location(destination)

    if not start:
        return jsonify({
            "error": f"Location not supported yet: {origin}",
            "supported_locations": sorted(CITY_COORDINATES.keys())
        }), 400

    if not end:
        return jsonify({
            "error": f"Location not supported yet: {destination}",
            "supported_locations": sorted(CITY_COORDINATES.keys())
        }), 400

    coordinates = (
        f"{start['longitude']},{start['latitude']};"
        f"{end['longitude']},{end['latitude']}"
    )

    osrm_url = (
        "https://router.project-osrm.org"
        f"/route/v1/driving/{coordinates}"
    )

    params = {
        "alternatives": "true",
        "overview": "full",
        "geometries": "geojson",
        "steps": "false"
    }

    try:
        response = requests.get(
            osrm_url,
            params=params,
            timeout=20,
            headers={
                "User-Agent": "RouteGuardAI/1.0"
            }
        )
        response.raise_for_status()

        route_data = response.json()

    except requests.RequestException as error:
        return jsonify({
            "error": "Real routing service unavailable.",
            "details": str(error)
        }), 502

    if route_data.get("code") != "Ok":
        return jsonify({
            "error": "No road route found.",
            "routing_code": route_data.get("code")
        }), 404

    routes = []

    for index, route in enumerate(route_data.get("routes", []), start=1):

        routes.append({
            "route_id": index,
            "distance_km": round(
                route["distance"] / 1000, 2
            ),
            "duration_minutes": round(
                route["duration"] / 60, 1
            ),
            "geometry": route["geometry"]
        })

    return jsonify({
        "success": True,
        "source": "OpenStreetMap road network + OSRM",
        "traffic_data": False,
        "traffic_note": (
            "OSRM duration is a road-network routing estimate; "
            "it is not a live traffic ETA."
        ),
        "origin": start,
        "destination": end,
        "routes": routes,
        "generated_at": datetime.utcnow().isoformat() + "Z"
    })

# ==============================
# GET VEHICLES
# ==============================

@app.route("/api/vehicles", methods=["GET"])
def get_vehicles():

    return jsonify({
        "vehicles": list(
            vehicles.values()
        )
    })


# ==============================
# UPDATE VEHICLE GPS
# ==============================

@app.route(
    "/api/vehicles/location",
    methods=["POST"]
)
def update_vehicle_location():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "error": "JSON body required."
        }), 400

    required_fields = [
        "vehicle_id",
        "latitude",
        "longitude"
    ]

    missing_fields = [
        field
        for field in required_fields
        if field not in data
    ]

    if missing_fields:

        return jsonify({
            "error": "Missing required fields.",
            "fields": missing_fields
        }), 400

    vehicle_id = str(
        data["vehicle_id"]
    )

    try:

        latitude = float(
            data["latitude"]
        )

        longitude = float(
            data["longitude"]
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "error":
                "Latitude and longitude must be numbers."
        }), 400

    vehicle = {

        "vehicle_id":
            vehicle_id,

        "latitude":
            latitude,

        "longitude":
            longitude,

        "speed":
            data.get("speed"),

        "heading":
            data.get("heading"),

        "status":
            data.get(
                "status",
                "active"
            ),

        "updated_at":
            datetime.utcnow().isoformat() + "Z"
    }

    vehicles[vehicle_id] = vehicle

    return jsonify({
        "success": True,
        "vehicle": vehicle
    })


# ==============================
# ROUTEGUARD RISK ENGINE
# ==============================

def calculate_weather_risk(weather_data):

    current = weather_data.get(
        "current",
        {}
    )

    temperature = current.get(
        "temperature_2m"
    )

    precipitation = current.get(
        "precipitation",
        0
    )

    rain = current.get(
        "rain",
        0
    )

    weather_code = current.get(
        "weather_code"
    )

    wind_speed = current.get(
        "wind_speed_10m",
        0
    )

    score = 0

    reasons = []


    # ------------------------------
    # RAIN / PRECIPITATION
    # ------------------------------

    if rain is not None:

        if rain >= 10:
            score += 35
            reasons.append(
                "Heavy rain detected"
            )

        elif rain >= 5:
            score += 25
            reasons.append(
                "Moderate rain detected"
            )

        elif rain > 0:
            score += 10
            reasons.append(
                "Rain detected"
            )


    if precipitation is not None:

        if precipitation >= 10:
            score += 15
            reasons.append(
                "High precipitation"
            )


    # ------------------------------
    # WIND
    # ------------------------------

    if wind_speed is not None:

        if wind_speed >= 60:
            score += 35
            reasons.append(
                "Very strong wind"
            )

        elif wind_speed >= 40:
            score += 25
            reasons.append(
                "Strong wind"
            )

        elif wind_speed >= 25:
            score += 10
            reasons.append(
                "Moderate wind"
            )


    # ------------------------------
    # WEATHER CODE
    # WMO codes
    # ------------------------------

    if weather_code is not None:

        # Thunderstorm
        if 95 <= weather_code <= 99:

            score += 40

            reasons.append(
                "Thunderstorm conditions"
            )

        # Snow
        elif 71 <= weather_code <= 77:

            score += 30

            reasons.append(
                "Snow conditions"
            )

        # Freezing rain
        elif weather_code in [56, 57]:

            score += 30

            reasons.append(
                "Freezing rain"
            )

        # Heavy rain
        elif weather_code in [65, 67, 82]:

            score += 30

            reasons.append(
                "Heavy precipitation"
            )

        # Fog
        elif weather_code in [45, 48]:

            score += 20

            reasons.append(
                "Fog / reduced visibility"
            )


    # ------------------------------
    # TEMPERATURE
    # ------------------------------

    if temperature is not None:

        if temperature >= 45:

            score += 20

            reasons.append(
                "Extreme heat"
            )

        elif temperature <= 0:

            score += 15

            reasons.append(
                "Very low temperature"
            )


    # ------------------------------
    # LIMIT SCORE
    # ------------------------------

    score = min(
        score,
        100
    )


    # ------------------------------
    # RISK LEVEL
    # ------------------------------

    if score >= 70:

        risk_level = "HIGH"

    elif score >= 35:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"


    if not reasons:

        reasons.append(
            "No significant weather hazard detected"
        )


    return {

        "risk_score":
            score,

        "risk_level":
            risk_level,

        "reasons":
            reasons,

        "weather": {

            "temperature_c":
                temperature,

            "rain_mm":
                rain,

            "precipitation_mm":
                precipitation,

            "wind_kmh":
                wind_speed,

            "weather_code":
                weather_code
        }
    }


# ==============================
# VEHICLE RISK ANALYSIS
# ==============================

@app.route(
    "/api/risk/<vehicle_id>",
    methods=["GET"]
)
def vehicle_risk(vehicle_id):

    vehicle = vehicles.get(
        vehicle_id
    )

    if not vehicle:

        return jsonify({

            "error":
                "Vehicle not found.",

            "vehicle_id":
                vehicle_id,

            "available_vehicles":
                list(vehicles.keys())

        }), 404


    latitude = vehicle["latitude"]
    longitude = vehicle["longitude"]


    # ------------------------------
    # GET LIVE WEATHER
    # ------------------------------

    weather_url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}"
        f"&longitude={longitude}"
        "&current="
        "temperature_2m,"
        "precipitation,"
        "rain,"
        "weather_code,"
        "wind_speed_10m"
        "&timezone=auto"
    )


    try:

        response = requests.get(
            weather_url,
            timeout=10
        )

        response.raise_for_status()

        weather_data = response.json()


    except requests.RequestException as error:

        return jsonify({

            "error":
                "Unable to fetch live weather.",

            "details":
                str(error)

        }), 502


    # ------------------------------
    # CALCULATE RISK
    # ------------------------------

    risk = calculate_weather_risk(
        weather_data
    )


    # ------------------------------
    # FINAL RESPONSE
    # ------------------------------

    return jsonify({

        "success":
            True,

        "vehicle":
            vehicle,

        "location": {

            "latitude":
                latitude,

            "longitude":
                longitude
        },

        "risk":
            risk,

        "engine":
            "RouteGuard Rule-Based Risk Engine v1",

        "data_source":
            "Open-Meteo live weather",

        "generated_at":
            datetime.utcnow().isoformat() + "Z"
    })



# ==============================
# ROUTE WEATHER RISK
# Samples live weather along the
# actual OSRM route geometry.
# ==============================

def fetch_live_weather(latitude, longitude):

    weather_url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}"
        f"&longitude={longitude}"
        "&current="
        "temperature_2m,"
        "precipitation,"
        "rain,"
        "weather_code,"
        "wind_speed_10m"
        "&timezone=auto"
    )

    try:

        response = requests.get(
            weather_url,
            timeout=10,
            headers={
                "User-Agent":
                    "RouteGuardAI/1.0"
            }
        )

        response.raise_for_status()

        return response.json()

    except requests.RequestException as error:

        raise RuntimeError(
            f"Live weather service unavailable: {error}"
        )


@app.route(
    "/api/route-risk",
    methods=["POST"]
)
def route_risk():

    data = request.get_json(
        silent=True
    )

    if not data:

        return jsonify({
            "error":
                "JSON body required."
        }), 400


    route = data.get("route")

    if not route:

        return jsonify({
            "error":
                "Route data is required."
        }), 400


    geometry = route.get("geometry", {})


    coordinates = geometry.get("coordinates", [])


    if not coordinates:

        return jsonify({
            "error":
                "Route geometry is required."
        }), 400


    # Sample start, middle and end
    # of the real route.
    sample_indexes = sorted(
        set([
            0,
            len(coordinates) // 2,
            len(coordinates) - 1
        ])
    )


    weather_points = []
    route_risks = []


    for index in sample_indexes:

        point = coordinates[index]


        longitude = float(point[0])


        latitude = float(point[1])


        try:

            weather_data = fetch_live_weather(latitude, longitude)


            risk = calculate_weather_risk(weather_data)


            weather_points.append({

                "latitude":
                    latitude,

                "longitude":
                    longitude,

                "risk":
                    risk

            })


            route_risks.append(
                risk
            )


        except Exception as error:

            return jsonify({

                "error":
                    "Unable to calculate live route weather risk.",

                "details":
                    str(error)

            }), 502


    # Conservative approach:
    # use the highest risk found
    # along the sampled route.
    worst_risk = max(route_risks, key=lambda item: item["risk_score"])


    return jsonify({

        "success":
            True,

        "risk":
            worst_risk,

        "route":
            {
                "distance_km":
                    route.get(
                        "distance_km"
                    ),

                "duration_minutes":
                    route.get(
                        "duration_minutes"
                    )
            },

        "weather_points":
            weather_points,

        "method":
            "Live weather sampled at route start, midpoint and destination",

        "data_source":
            "Open-Meteo live weather",

        "generated_at":
            datetime.utcnow().isoformat()
            + "Z"

    })


# ==============================
# SYSTEM STATUS
# ==============================

@app.route(
    "/api/status",
    methods=["GET"]
)
def status():

    return jsonify({

        "backend":
            "online",

        "weather_api":
            "connected",

        "routing_engine":
            "OSRM/OpenStreetMap",

        "vehicle_tracking":
            "GPS-ready",

        "registered_vehicles":
            len(vehicles),

        "risk_engine":
            "rule-based v1",

        "ml_prediction":
            "not connected"
    })


# ==============================
# START SERVER
# ==============================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )

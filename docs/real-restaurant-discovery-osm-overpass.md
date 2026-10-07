# TablePulse AI — Real Restaurant Discovery with OpenStreetMap & Overpass API

> **CRITICAL ARCHITECTURAL DISTINCTION:**
> **OpenStreetMap provides place information. It does not provide TablePulse live table availability, reservations, queue status, orders, or wait-time data.**
> Live operational seating metrics, floor layouts, digital menus, and reservation waitlists are powered exclusively by TablePulse's internal MySQL engine and real-time Socket.IO event mesh for registered partner establishments.

---

## 1. Primary Flow & Architecture

The primary discovery mechanism in TablePulse AI is the user's **Current Device Location** via standard browser Geolocation:

```
                  DEVICE GPS (HTML5 Geolocation)
                                ↓
                   latitude + longitude (GPS)
                                ↓
                       TablePulse Backend
            (Validation: lat [-90,90], lon [-180,180])
                                ↓
                   Overpass API (OpenStreetMap)
                   ([timeout:25]; amenity=restaurant)
                                ↓
                    OpenStreetMap Restaurants
                                ↓
                      Backend Normalization
                                ↓
                     Distance Calculation
                      (Haversine Formula)
                                ↓
                      Nearest-First Ranking
                                ↓
                      TablePulse Frontend
```

### Primary Flow Characteristics
1. **Device GPS First:** Browser Geolocation API (`navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`) is requested as the primary discovery source.
2. **Zero City Hardcoding:** If the user is in Chennai, it finds Chennai restaurants. If in Bengaluru, Hyderabad, Mumbai, or Delhi, it searches around that exact coordinate.
3. **Backend Proxy:** The React frontend never queries Overpass directly. The backend validates parameters, controls rate limits, caches results, and queries Overpass servers.
4. **Authoritative Distance:** Distances are computed using the Haversine formula based on exact user coordinates and OSM coordinates, sorted nearest first.

---

## 2. Device Location & Permission Handling

### Geolocation Implementation (`useGeolocation.js`)
- Uses `navigator.geolocation.getCurrentPosition()`
- Options: `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 60000` (on normal fetch), `maximumAge: 0` (on explicit refresh).
- Handles all standard states:
  - **Permission Prompt:** Displays *"Find Restaurants Near You"*, *"Allow location access to discover real restaurants around your current location."*, with `[Use My Location]`.
  - **Acquiring GPS:** Displays *"Getting your location..."*.
  - **Permission Denied:** Displays clear explanation *"Location permission is required to automatically find restaurants near you."* with `[Try Location Again]` and optional manual location fallback.
  - **Location Unavailable:** Displays *"Location unavailable"* with `[Try Again]`.
  - **Timeout:** Prompts user to retry or select a dining hub.
  - **Active State:** Displays `📍 Using Device Location` badge and *"Showing restaurants near your current location"*.

### Location Refresh (`[Refresh Location]`)
- Clicking `[Refresh Location]` forces a fresh hardware GPS reading (`maximumAge: 0`).
- Updates coordinates in state.
- Queries nearby restaurants for new coordinates without full page reload.

---

## 3. Overpass API Integration & Resilience

The **Overpass API** is a read-only query engine optimized for spatial searches in OpenStreetMap:

- **Target Category:** `amenity=restaurant` (real dining places; excludes grocery stores, apparel, and hotels without restaurants).
- **Query Structure:**
  ```overpassql
  [out:json][timeout:25];
  (
    node["amenity"="restaurant"](around:radius,lat,lon);
    way["amenity"="restaurant"](around:radius,lat,lon);
  );
  out body 100;
  out skel center 100;
  ```
- **Redundant Failover Mirrors:**
  1. Primary: `https://overpass-api.de/api/interpreter`
  2. Backup 1: `https://lz4.overpass-api.de/api/interpreter`
  3. Backup 2: `https://overpass.kumi.systems/api/interpreter`
  4. Backup 3: `https://overpass.private.coffee/api/interpreter`
  5. Configurable via `.env`: `OVERPASS_API_URL`
- **Request Headers:**
  - `User-Agent: TablePulse-AI/1.0 (OpenStreetMap Integration; contact: admin@tablepulse.app)`
  - `Accept: */*`

---

## 4. Radius Controls & Proximity Filtering

- **Default Radius:** **20 km**
- **Supported Controls:** **5 km**, **10 km**, **20 km**
- **Backend Haversine Filtering:**
  - Overpass query retrieves restaurants around coordinates.
  - Backend calculates `distanceKm` for each item.
  - Strictly enforces `distanceKm <= radius`.
  - Sorts ascending by distance (nearest restaurant first).

---

## 5. Restaurant Card Display & Normalization

| Normalized Property | Source in OSM Tags | Fallback / Display Value |
| :--- | :--- | :--- |
| `id` | `element.type` + `element.id` | Format: `osm:node:123456` |
| `source` | Static constant | `'openstreetmap'` |
| `osm_id` | `element.type` / `element.id` | Format: `node/123456` |
| `name` | `tags.name` / `tags['name:en']` | Required; unnamed nodes dropped |
| `cuisineType` | `tags.cuisine` / `tags.food` | Formatted title case; fallback: `"Cuisine not specified"` |
| `address` | `addr:housenumber`, `addr:street`, etc. | Composed address or `"Address details in OpenStreetMap"` |
| `latitude` / `longitude` | `lat`, `lon` or `center.lat`, `center.lon` | Exact numeric coordinates |
| `distanceKm` | Haversine calculation | Example: `"0.8 km away"` |
| `openStatus` | `tags.opening_hours` evaluation | `'OPEN'`, `'CLOSED'`, or `'HOURS_UNKNOWN'` |
| `phone` | `tags.phone` / `tags['contact:phone']` | Null / hidden if not tagged |
| `website` | `tags.website` / `tags['contact:website']` | Null / hidden if not tagged |
| `attribution` | Legal requirement | `'© OpenStreetMap contributors'` |
| `tablepulse_registered` | Partner matching flag | `true` if partner; `false` if unregistered |
| `operational_data_available` | Live seating availability flag | `true` for partners; `false` for unregistered |

### TablePulse Operational Data Distinction
- **Registered Partners:**
  - Displays: `🟢 TablePulse Live Data`
  - Live table availability, occupied/cleaning tables, crowd level (LOW / MODERATE / HIGH), and wait times.
  - Interactive table booking, virtual queue, and digital menu.
- **Unregistered Real OSM Restaurants:**
  - Displays: `"TablePulse live data unavailable"`
  - Shows real place info, cuisine, address, distance, and opening hours from OSM.
  - Disables table booking and queue with clear explanation.
  - Never fabricates fake table availability.

---

## 6. Error Handling vs. Empty Results

The UI strictly differentiates between:
- **Case A: Successful Request + Zero Restaurants Found**
  - Displays: *"No restaurants found within {radius} km."*
  - Action buttons: `[Increase to 10 km]`, `[Increase to 20 km]`, `[Refresh Location]`, and manual hub fallbacks.
- **Case B: Overpass / API Service Failure**
  - Displays: *"Restaurant discovery is temporarily unavailable. Please try again."*
  - Does NOT show "No restaurants found" on technical failure.

---

## 7. Caching Architecture

- **Backend In-Memory Cache:** Avoids repeated Overpass queries on quick page visits.
- **Key Formulation:** `restaurants:round(lat,2):round(lon,2):radius` (approx. 1.1 km precision).
- **TTL:** 10 minutes (`600,000 ms`).
- **Concurrent Request Merging:** Identical coordinates in flight share a single Promise.
- **Local Client Filtering:** Search bar keystrokes and cuisine tags filter locally in memory without triggering Overpass network calls.

---

## 8. OpenStreetMap Attribution Compliance

In compliance with the **OpenStreetMap Foundation Attribution Guidelines**:
- Every API response contains `attribution: "© OpenStreetMap contributors"`.
- The discovery page displays:
  `© OpenStreetMap contributors` with links to openstreetmap.org/copyright.
- Individual restaurant cards provide direct links to the OpenStreetMap element.

---

## 9. Security & Validation

- Latitude bounded between `-90` and `+90`.
- Longitude bounded between `-180` and `+180`.
- Radius restricted to positive numbers (defaulting to 20 km, capped at 100 km).
- No user-controlled API URLs: Overpass queries are constructed entirely server-side using parameterized coordinates.

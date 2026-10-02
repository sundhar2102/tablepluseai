# Stage 6 Part 1 — Restaurant Discovery, Location & Live Table Availability

**Project:** TablePulse AI  
**Stage:** Stage 6 — Part 1  
**Status:** Implemented & Verified  
**Date:** October 2, 2026  

---

## 1. Feature Overview

Stage 6 Part 1 delivers the core customer discovery and real-time operational visibility features for TablePulse AI. Customers can:
1. Grant or deny location access with graceful, non-blocking fallbacks (popular dining hubs & manual area search).
2. Discover approved, active restaurants sorted authoritatively by distance from their current coordinates.
3. Search restaurants by name, address/area, or cuisine.
4. Filter by radius (5 km, 10 km, 20 km), cuisine categories, and "Open Now" status.
5. Open restaurant details to inspect live table occupancy and weekly operating hours.
6. View real-time table floor layout with visual indicators for Available (🟢), Occupied (🔴), Reserved (🟠), and Cleaning (🟣).
7. Inspect current crowd levels (LOW, MODERATE, HIGH, FULL) and transparent wait times.
8. Receive real-time push updates via Socket.IO whenever table statuses are updated.

> [!NOTE]
> **Operational Disclaimer:** All crowd levels and wait-time estimations are transparent, rule-based operational metrics derived directly from live table states. **This is a rule-based operational estimate, not an AI prediction.**

---

## 2. Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Customer Frontend                    │
│   (React 18 + Vite 5 + Tailwind CSS + SocketContext)   │
└───────────────────────────┬────────────────────────────┘
                            │
              HTTP / REST   │   WebSocket / Socket.IO
        (Axios Interceptor) │   (JWT Handshake Auth)
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Express Backend                     │
│  - /api/restaurants (Discovery, Search, Proximity)     │
│  - /api/restaurants/:id (Details, Table Layout)        │
│  - /api/restaurants/:id/tables/:tableId/status (Staff) │
│  - Socket.IO Server (Rooms: restaurant:<id>)           │
└───────────────────────────┬────────────────────────────┘
                            │
               mysql2/promise Pool (10 conn)
                            │
┌───────────────────────────▼────────────────────────────┐
│                  MySQL 8.2 (InnoDB)                    │
│  - restaurants (Lat, Lng, Approval, Active)            │
│  - restaurant_hours (Mon-Sun Open/Close, IsClosed)     │
│  - tables (Number, Capacity, Status, Timestamps)       │
└────────────────────────────────────────────────────────┘
```

---

## 3. Location Approach & Distance Calculation

### 3.1 Geolocation Flow
- The frontend hook `useGeolocation` calls `navigator.geolocation.getCurrentPosition`.
- **Permission Allowed:** Captures exact `latitude` and `longitude` and sends them as query parameters `lat` and `lng` to `GET /api/restaurants`.
- **Permission Denied / Timeout:** The application does **not** block. A fallback notification appears allowing the user to:
  1. Click popular dining hubs (e.g., T. Nagar, Nungambakkam, Anna Nagar, Alwarpet, Adyar).
  2. Search manually by name or area.
  3. Retry granting location permission.

### 3.2 Authoritative Backend Haversine Distance
The backend calculates great-circle distance using the Haversine formula in `server/src/utils/haversine.js`:
$$\Delta\text{lat} = \text{toRad}(\text{lat}_2 - \text{lat}_1), \quad \Delta\text{lng} = \text{toRad}(\text{lng}_2 - \text{lng}_1)$$
$$a = \sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{toRad}(\text{lat}_1))\cos(\text{toRad}(\text{lat}_2))\sin^2\left(\frac{\Delta\text{lng}}{2}\right)$$
$$c = 2 \cdot \text{atan2}(\sqrt{a}, \sqrt{1 - a}), \quad d = R \cdot c \quad (R = 6371\text{ km})$$

- Distance calculation is **never trusted from the client**.
- Distance values are rounded to 1 decimal place (`distanceKm`).
- Restaurants are sorted ascending by `distanceKm`.

---

## 4. Operating Hours & Open/Closed Status

The backend service `checkIsOpen` evaluates the `restaurant_hours` table:
- Evaluates `day_of_week` (0 = Sunday to 6 = Saturday) against current server/local time.
- Verifies `is_closed === 0` and current time falls within `open_time` and `close_time`.
- Correctly handles overnight operating hours (e.g. 18:00 to 02:00 next day).
- Returns `{ isOpen: boolean, todayHours: string }`.

---

## 5. Live Table Availability & Visual Model

The system utilizes the approved Stage 4 `tables` table:
- **Available:** Table is sanitized and immediately open for seating.
- **Occupied:** Diners are currently seated at the table.
- **Reserved:** Table is held for an upcoming confirmed booking.
- **Cleaning:** Table is currently being cleared and sanitized.

### Customer View
- Customers have strictly **read-only** visibility into table layout and counts.
- `qr_token` and sensitive owner data are excluded from customer responses.

---

## 6. Crowd Level Calculation (Rule-Based)

Defined centrally in `server/src/config/constants.js`:

| Crowd Level | Condition / Occupancy Threshold | Operational Indicator |
|:-----------:|:--------------------------------|:---------------------|
| **LOW** | Occupancy < 40% | "Not Busy" (🟢) — Immediate seating |
| **MODERATE**| 40% ≤ Occupancy < 75% | "Moderate" (🟡) — Good availability |
| **HIGH** | Occupancy ≥ 75% | "Busy" (🔴) — Limited availability |
| **FULL** | 0 Available Tables | "Full" (⛔) — No immediate tables |

Occupancy Ratio is calculated as:
$$\text{Occupancy} = \frac{\text{Occupied Tables} + \text{Reserved Tables}}{\text{Total Tables}}$$

---

## 7. Initial Wait-Time Engine (Rule-Based)

Transparent, operational calculation implemented in `calculateWaitTime`:
1. **Available Tables > 0:**
   - Wait Time = `0` minutes.
   - Reason: `"Tables are immediately available for seating"`
2. **Available Tables === 0 and Cleaning Tables > 0:**
   - Wait Time = `avg_cleaning_duration_mins` (default 10 mins).
   - Reason: `"Table is currently undergoing sanitization/cleaning"`
3. **Available Tables === 0 and No Cleaning Tables:**
   - Estimated turnaround based on average dining duration:
     $$\text{Wait} = \max\left(10, \min\left(60, \text{round}\left(\frac{\text{avg\_dining\_duration\_mins}}{\max(1, \text{occupied})}\right)\right)\right)$$
   - Reason: `"Estimated turnover based on average dining duration"`
4. **Metadata:**
   - `calculationType: 'RULE_BASED'`
   - `confidence: 'CURRENT_OPERATIONAL_ESTIMATE'`
   - `isPrediction: false`
   - `disclaimer: 'This is a rule-based operational estimate, not an AI prediction.'`

---

## 8. Socket.IO Real-Time Architecture

1. **Room Join:** When opening a restaurant detail page, the client connects to `restaurant:${restaurantId}` via `socket.emit('joinRestaurant', id)`.
2. **State Mutation:** When table status changes, `updateTableStatus` executes in MySQL.
3. **Recalculation:** The backend recalculates table availability counts, crowd level, and estimated wait minutes.
4. **Broadcast:** Server emits `restaurant:availability_updated` to the room:
   ```json
   {
     "restaurantId": 1,
     "tableId": 2,
     "tableNumber": "T-02",
     "newStatus": "occupied",
     "tableAvailability": {
       "totalTables": 12,
       "availableTables": 4,
       "occupiedTables": 6,
       "reservedTables": 1,
       "cleaningTables": 1
     },
     "crowdLevel": "MODERATE",
     "estimatedWaitMinutes": 0,
     "updatedAt": "2026-10-02T16:55:00.000Z"
   }
   ```
5. **UI Update:** The React client updates the table card, status pills, and summary badges in real-time with visual highlights and zero page reloads.

---

## 9. API Reference

### 1. `GET /api/restaurants`
Query Parameters:
- `lat` (number, -90 to 90)
- `lng` (number, -180 to 180)
- `radius` (number, positive, default 5 km)
- `search` (string, max 100)
- `area` (string, max 100)
- `cuisine` (string, max 80)
- `openNow` (boolean, 'true'/'false')

### 2. `GET /api/restaurants/:id`
Path Parameters:
- `id` (integer ID or string slug)
Query Parameters:
- `lat` (optional, for distance)
- `lng` (optional, for distance)

### 3. `PATCH /api/restaurants/:id/tables/:tableId/status`
Protected: Requires JWT (`owner` or `admin` role).  
Body: `{ "status": "available" | "occupied" | "reserved" | "cleaning" }`

---

## 10. Known Limitations & Future Scope

- **Hours Timezone:** Operating hours are currently compared against local server time. Multi-timezone support will be enhanced when cross-region expansion occurs.
- **Queue Integration:** Wait times in Part 1 are based strictly on table occupancy turnover. Stage 6 Part 3 will incorporate active walk-in queue counts into the formula.
- **Reservations & QR Ordering:** Deliberately deferred to subsequent Stage 6 parts per project roadmap.

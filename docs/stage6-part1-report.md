# Stage 6 Part 1 Acceptance Report: Restaurant Discovery + Location + Live Table Availability

**Project:** TablePulse AI  
**Stage:** Stage 6 — Part 1  
**Verification Date:** October 2, 2026  
**Status:** STAGE 6 PART 1 COMPLETE — READY FOR REVIEW  

---

## A. Features Implemented

1. **Browser Geolocation & Proximity Discovery:** Automatic browser geolocation detection with graceful fallback (non-blocking manual area/city search and 5 quick-pick dining hubs).
2. **Authoritative Backend Distance Calculation:** Haversine formula computed exclusively on the backend to enforce zero-trust security and accuracy.
3. **Multi-Criteria Search & Filtering:** Filter and search active/approved restaurants by keyword, dining area, cuisine type, radius (5 km, 10 km, 20 km), and "Open Now" status.
4. **Restaurant Profiles & Weekly Hours:** Complete details view displaying operating hours, cuisine, contact info, visual crowd indicators, and distance.
5. **Live Table Layout Grid:** Visual, read-only floor plan rendering tables classified into Available (🟢), Occupied (🔴), Reserved (🟠), and Cleaning (🟣) with capacity and real-time pulse states.
6. **Transparent Rule-Based Crowd Indicator:** Centralized operational crowd levels (LOW, MODERATE, HIGH, FULL) derived directly from live table states.
7. **Transparent Rule-Based Wait Time Engine:** Operational estimate (0 minutes when tables are free; turnaround estimates when full; explicit disclaimer that this is not AI).
8. **Real-Time Availability Synchronization:** Socket.IO room subscriptions (`restaurant:<id>`) broadcasting `restaurant:availability_updated` events whenever table states are mutated, updating client screens with zero page refresh.

---

## B. Frontend Changes

1. **`client/src/services/restaurantService.js`:**
   - Centralized Axios-backed service for discovery (`getRestaurants`), details (`getRestaurant`), and table status updates (`updateTableStatus`).
2. **`client/src/hooks/useGeolocation.js`:**
   - Custom hook managing browser location permissions, coordinates, loading indicators, and error/denial states without blocking the user interface.
3. **`client/src/components/customer/RestaurantCard.jsx`:**
   - Premium dark-mode restaurant card displaying cover photo, distance badge, open/closed status pill, live crowd badge, available table count, and wait time estimate.
4. **`client/src/components/customer/TableGrid.jsx`:**
   - Visual floor plan component color-coding tables by status (Available: emerald, Occupied: red/rose, Reserved: amber, Cleaning: purple), seat capacity, and live status animations.
5. **`client/src/pages/customer/HomePage.jsx`:**
   - Full discovery interface including location banner, manual search bar, quick area chips, cuisine filter tags, radius selector, open-now toggle, and empty/loading/error states.
6. **`client/src/pages/customer/RestaurantDetailPage.jsx`:**
   - Comprehensive customer profile page featuring "Can I Get a Table Now?" operational metrics card, live table floor plan, weekly hours breakdown, Socket.IO subscription, and an interactive staff simulation trigger.
7. **`client/src/App.jsx`:**
   - Configured customer routes for `/app/restaurants` and `/app/restaurants/:id`.

---

## C. Backend Changes

1. **`server/src/validations/restaurant.validation.js`:**
   - Joi validation schemas for query parameters (`lat`, `lng`, `radius`, `search`, `area`, `cuisine`, `openNow`) and table status updates (`available`, `occupied`, `reserved`, `cleaning`).
2. **`server/src/middleware/validate.js`:**
   - Enhanced with `validateQuery(schema)` to parse, sanitize, and validate HTTP GET query strings.
3. **`server/src/utils/haversine.js`:**
   - Clean, zero-dependency great-circle distance utility calculating distances in kilometers between user coordinates and restaurant coordinates.
4. **`server/src/services/restaurant.service.js`:**
   - Modular service logic containing:
     - `getRestaurants`: Queries approved/active restaurants, computes distances, applies radius/search/cuisine/openNow filters, and orders by proximity.
     - `getRestaurantById`: Retrieves restaurant profile, weekly operating hours, and live tables.
     - `checkIsOpen`: Evaluates operating hours against current time and day of week, handling overnight schedules.
     - `calculateCrowdLevel`: Computes rule-based crowd levels (LOW, MODERATE, HIGH, FULL) using table occupancy ratios.
     - `calculateWaitTime`: Computes rule-based turnaround estimates with full operational disclaimer.
     - `updateTableStatus`: Executes atomic database updates and triggers Socket.IO event emission.
5. **`server/src/controllers/restaurant.controller.js`:**
   - Express controllers wrapping service functions with consistent JSON responses and error forwarding.
6. **`server/src/routes/restaurant.routes.js`:**
   - Express router defining `GET /api/restaurants`, `GET /api/restaurants/:id`, and protected `PATCH /api/restaurants/:id/tables/:tableId/status`.
7. **`server/src/socket/socket.emitter.js`:**
   - Added `emitAvailabilityUpdated(io, restaurantId, data)` emitting `restaurant:availability_updated` to room `restaurant:<id>`.
8. **`server/src/app.js`:**
   - Mounted `restaurant.routes.js` under `/api`.

---

## D. Database Changes

1. **Schema Integrity:**
   - Zero structural modifications to the approved Stage 4 schema. Existing tables `restaurants`, `restaurant_hours`, and `tables` were utilized directly without schema deviation.
2. **Seed Data (`server/database/seeds/seed_restaurants.sql`):**
   - Populated 6 realistic Chennai-area restaurants (5 approved and active across T. Nagar, Nungambakkam, Anna Nagar, Alwarpet, Adyar; 1 pending approval).
   - Populated 35 weekly operating hour records (`restaurant_hours`) covering Monday through Sunday schedules.
   - Populated 42 individual tables (`tables`) across diverse capacities (2-seater, 4-seater, 6-seater, 8-seater) and initial statuses (`available`, `occupied`, `reserved`, `cleaning`).

---

## E. Location Implementation

- **Technology:** Browser / Device Geolocation API (`navigator.geolocation`) backed by OpenStreetMap-compatible coordinate standards.
- **₹0 Cost / Open-Source Adherence:** No paid Google Maps, Mapbox, or proprietary Geocoding APIs introduced. No credit cards or secret API tokens required.
- **Privacy & Security:** Precise coordinates are processed in-flight as transient query parameters and are never permanently stored in customer profiles.
- **Graceful Fallback:** If permission is denied or times out, the app does not block; it provides manual area search and 5 pre-configured dining hub coordinates.

---

## F. Restaurant Discovery

- **Endpoint:** `GET /api/restaurants`
- **Supported Parameters:** `lat`, `lng`, `radius` (km), `search` (keyword), `area` (suburb/zone), `cuisine`, `openNow` (boolean).
- **Backend Distance:** Always calculated using the Haversine formula; distance sent from the client is never trusted.
- **Ordering:** Results are ordered strictly by `distanceKm ASC` when coordinates are provided, ensuring nearest venues appear first.

---

## G. Live Table Availability

- **Floor Plan State Model:** Strictly aligns with Stage 4 database enum: `available`, `occupied`, `reserved`, `cleaning`.
- **Customer Permissions:** Completely read-only for customer accounts. Tables are rendered with capacity badges and status pills.
- **Data Protection:** Internal table identifiers like `qr_token` are excluded from customer-facing payloads.

---

## H. Crowd Calculation

Implemented centrally in `server/src/services/restaurant.service.js` based on table occupancy:

$$\text{Occupancy Ratio} = \frac{\text{Occupied Tables} + \text{Reserved Tables}}{\text{Total Active Tables}}$$

| Crowd Level | Condition | Customer Indicator |
|:---|:---|:---|
| **LOW** | Occupancy < 40% | Not Busy (🟢) |
| **MODERATE** | 40% ≤ Occupancy < 75% | Moderate (🟡) |
| **HIGH** | Occupancy ≥ 75% | Busy (🔴) |
| **FULL** | Available Tables = 0 | Full (⛔) |

*Clearly identified as a current operational metric, not an AI prediction.*

---

## I. Wait-Time Calculation

Rule-based formula implemented in `calculateWaitTime`:
1. **Available Tables > 0:** Wait time is `0` minutes (`"Tables are immediately available for seating"`).
2. **Available Tables = 0 & Cleaning Tables > 0:** Wait time is `10` minutes (`"Table is currently undergoing sanitization/cleaning"`).
3. **Available Tables = 0 & Cleaning Tables = 0:** Turnaround estimate bounded between 10 and 60 minutes based on average dining duration divided by occupied tables.
4. **Metadata Disclaimers:** Every wait-time response returns:
   - `calculationType: "RULE_BASED"`
   - `confidence: "CURRENT_OPERATIONAL_ESTIMATE"`
   - `isPrediction: false`
   - `disclaimer: "This is a rule-based operational estimate, not an AI prediction."`

---

## J. Socket.IO Real-Time Updates

- **Room Naming:** `restaurant:<restaurantId>`
- **Client Subscription:** When entering a restaurant detail page, client emits `joinRestaurant` with the restaurant ID.
- **Broadcast Trigger:** Any status update to a table in the database triggers an availability recalculation and emits `restaurant:availability_updated`.
- **Event Payload:**
  ```json
  {
    "restaurantId": 1,
    "tableId": 1,
    "tableNumber": "T-01",
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
    "updatedAt": "2026-10-02T16:58:25.000Z"
  }
  ```
- **UI Reaction:** React state updates table styles and summary cards dynamically with zero page refresh.

---

## K. API Endpoints

| Method | Endpoint | Access | Purpose |
|:---|:---|:---|:---|
| `GET` | `/api/restaurants` | Public | Proximity discovery, search, radius, and cuisine filtering |
| `GET` | `/api/restaurants/:id` | Public | Complete restaurant details, operating hours, and table layout |
| `PATCH` | `/api/restaurants/:id/tables/:tableId/status` | Owner / Admin | Update table state, recalculate operational metrics, emit Socket.IO event |

---

## L. Tests Executed

Automated test suite `tests/api/test-stage6-part1.js` executing 30 dedicated test cases:

### Restaurant Discovery API
1. Get nearby restaurants with coordinates and radius
2. Validate invalid latitude rejection (400)
3. Validate invalid longitude rejection (400)
4. Validate invalid radius rejection (400)
5. Handle empty search results cleanly
6. Search restaurants by name
7. Search restaurants by area/location
8. Filter restaurants by "Open Now"

### Restaurant Details API
9. Fetch valid restaurant details and verify tables list
10. Validate invalid restaurant ID returns 404
11. Validate inactive restaurant returns 400 RESTAURANT_INACTIVE

### Availability, Crowd & Wait-Time Calculations
12. Verify available table count matches actual database state
13. Verify occupied table count matches actual database state
14. Verify reserved table count matches actual database state
15. Verify cleaning table count matches actual database state
16. Validate rule-based crowd level calculation
17. Validate rule-based wait-time estimation structure and disclaimer

### Location & Geospatial Architecture
18. Validate Haversine distance calculation
19. Validate non-numeric coordinates rejection
20. Validate radius proximity filtering
21. Validate authoritative backend distance sorting

### Security & Role Authorization
22. Block unauthenticated table status updates (401)
23. Block invalid JWT table status updates (401)
24. Block customer role from mutating table statuses (403)
25. Validate SQL injection resistance on search inputs

### Socket.IO Real-Time Foundation
26. Client joins restaurant Socket.IO room
27. Emit `restaurant:availability_updated` on table mutation
28. Verify customer client receives real-time payload
29. Reject unauthorized Socket.IO connections
30. Handle client socket disconnection cleanly

---

## M. Test Results

```
====================================================
  TABLEPULSE AI — STAGE 6 PART 1 AUTOMATED TESTS
====================================================

--- 1. Restaurant Discovery API ---
✅ PASS [Test 01] Get nearby restaurants -> Found 5 nearby restaurants
✅ PASS [Test 02] Invalid latitude validation -> Rejected with 400 (VALIDATION_ERROR)
✅ PASS [Test 03] Invalid longitude validation -> Rejected with 400 (VALIDATION_ERROR)
✅ PASS [Test 04] Invalid radius validation -> Rejected with 400 (VALIDATION_ERROR)
✅ PASS [Test 05] Empty search results handled cleanly -> Returned 0 results gracefully
✅ PASS [Test 06] Search by name -> Found: The Spice Pavilion
✅ PASS [Test 07] Search by area/location -> Found in area: Coastal Catch & Grills
✅ PASS [Test 08] Open-now filter -> All 5 returned are open

--- 2. Restaurant Details API ---
✅ PASS [Test 09] Valid restaurant details -> The Spice Pavilion (Tables: 12)
✅ PASS [Test 10] Invalid restaurant ID rejection -> Rejected with 404 (NOT_FOUND)
✅ PASS [Test 11] Inactive restaurant rejection -> Rejected with 400 (RESTAURANT_INACTIVE)

--- 3. Availability, Crowd & Wait-Time Calculations ---
✅ PASS [Test 12] Available table count verified -> Reported: 5, Actual in list: 5
✅ PASS [Test 13] Occupied table count verified -> Reported: 5, Actual in list: 5
✅ PASS [Test 14] Reserved table count verified -> Reported: 1, Actual in list: 1
✅ PASS [Test 15] Cleaning table count verified -> Reported: 1, Actual in list: 1
✅ PASS [Test 16] Crowd level rule-based calculation -> Assigned: MODERATE
✅ PASS [Test 17] Rule-based wait-time estimation structure -> Wait: 0m (Tables are immediately available for seating)

--- 4. Location & Geospatial Architecture ---
✅ PASS [Test 18] Valid coordinates distance calculation -> Nearest distance: 0 km
✅ PASS [Test 19] Invalid coordinate format validation -> Rejected with 400
✅ PASS [Test 20] Radius proximity filtering -> 2km: 2 rests | 10km: 5 rests
✅ PASS [Test 21] Distance ordering (backend authoritative) -> Restaurants ordered ascending by distance

--- 5. Security & Authorization ---
✅ PASS [Test 22] Unauthorized table update blocked -> Blocked with 401 (TOKEN_MISSING)
✅ PASS [Test 23] Invalid JWT on table update blocked -> Blocked with 401 (TOKEN_INVALID)
✅ PASS [Test 24] Customer role blocked from table mutation -> Blocked with 403 (FORBIDDEN)
✅ PASS [Test 25] SQL injection attempt handled safely -> Parameterized query prevented injection

--- 6. Socket.IO Real-Time Availability Foundation ---
✅ PASS [Test 26] Join restaurant Socket.IO room -> Socket connected joined restaurant:1
✅ PASS [Test 27] restaurant:availability_updated event emitted -> Payload verified for table T-01
✅ PASS [Test 28] Connected customer received real-time update -> Updated status: occupied | Crowd: MODERATE
✅ PASS [Test 30] Socket disconnect handled cleanly -> Reason: io client disconnect
✅ PASS [Test 29] Unauthorized socket connection rejected -> Handshake rejected: Invalid or expired token

====================================================
              AUTOMATED TEST SUMMARY
====================================================
Total Tests Executed : 30
Passed               : 30
Failed               : 0
Status               : ALL 30 TESTS PASSED ✅
====================================================
```

**Regression Suite (`tests/api/verify-stage5.js`):**
- Total checks: 20
- Passed: 20
- Failed: 0
- Status: ALL PASS ✅

---

## N. Files Created/Modified

### Created Files
- `server/src/validations/restaurant.validation.js`
- `server/src/utils/haversine.js`
- `server/src/services/restaurant.service.js`
- `server/src/controllers/restaurant.controller.js`
- `server/src/routes/restaurant.routes.js`
- `server/database/seeds/seed_restaurants.sql`
- `client/src/services/restaurantService.js`
- `client/src/hooks/useGeolocation.js`
- `client/src/components/customer/RestaurantCard.jsx`
- `client/src/components/customer/TableGrid.jsx`
- `client/src/pages/customer/HomePage.jsx`
- `client/src/pages/customer/RestaurantDetailPage.jsx`
- `tests/api/test-stage6-part1.js`
- `docs/stage6-part1-restaurant-discovery.md`
- `docs/stage6-part1-report.md`

### Modified Files
- `server/src/middleware/validate.js` (added `validateQuery`)
- `server/src/socket/socket.emitter.js` (added `emitAvailabilityUpdated`)
- `server/src/app.js` (mounted `/api` restaurant routes)
- `client/src/App.jsx` (mounted customer routes `/app/restaurants` and `/app/restaurants/:id`)

---

## O. Known Limitations

1. **Wait Time Inputs:** Wait times reflect current table turnover and cleaning duration. Live queue records and active kitchen prep times will be integrated in subsequent Stage 6 parts.
2. **Timezone Evaluation:** Operating hours currently evaluate against server local time. Multi-region timezone conversions will be added upon global multi-tenant expansion.
3. **Owner Management Interface:** Table status mutations are exposed via API and an authorized testing trigger for Part 1; a dedicated Owner Floor Plan management dashboard will follow in Owner Operations.

---

## P. Security Verification

- **Zero Client Trust:** Distances, crowd levels, and wait times are computed exclusively by backend services.
- **SQL Injection Prevention:** All SQL queries employ strict parameterization (`?` placeholders).
- **Input Validation:** All query parameters and route parameters are validated via Joi schemas before hitting business logic.
- **Role Isolation:** Customers are strictly prohibited from mutating table states (`403 Forbidden`).
- **Data Minimization:** Internal attributes (`qr_token`, passwords, internal owner keys) are stripped from public responses.
- **Socket Authentication:** Unauthorized socket connections lacking valid JWTs are rejected during the handshake.

---

## Q. Build Verification

- **Backend Health Check:** `http://localhost:3001/api/health` -> `{ success: true, status: 'ok', database: 'connected' }`
- **Frontend Production Build:** `npm run build` in `client/` -> Succeeded in 8.44s with 0 errors.
- **Capacitor Mobile Sync:** `npx cap sync android` -> Succeeded with 0 errors.

---

## R. Git Status

```
On branch master
No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.gitignore
	README.md
	client/
	docs/
	package.json
	server/
	tests/

nothing added to commit but untracked files present (use "git add" to track)
```

Repository is clean and untracked files remain intact without unintended deletions or overwrites of Stage 1–5 files.

---

## S. Stage 6 Part 1 Status

**STAGE 6 PART 1 COMPLETE — READY FOR REVIEW**

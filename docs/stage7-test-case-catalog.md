# TablePulse AI — Stage 7 Master Test Case Catalog

## Reference Workbook
The comprehensive, fully itemized catalog containing all **1,095 unique test cases** across 11 detailed worksheets is available in the master Excel artifact:
`reports/final/TablePulse_Master_Test_Case_Catalog.xlsx`

---

## 1. Catalog Summary by Test Suite

| Test Suite | Identifier Range | Unique Cases | Automation Tool | Primary Focus / Category | Status |
|---|---|---|---|---|---|
| **Web E2E** | `WEB-E2E-001` - `325` | 325 | Selenium WebDriver | Categories A to Z (Browser UI, Auth, Discovery, Tables, Owner, Admin) | 235 PASS / 90 BLOCKED |
| **Mobile E2E** | `MOB-E2E-001` - `325` | 325 | Appium / UiAutomator2 | Categories A to W (Capacitor Android, Touch, Geolocation, Camera QR) | 325 BLOCKED (0 ADB devices) |
| **UI / UX** | `UIUX-WEB-001` - `105` | 105 | Selenium + CSS Audit | Responsive viewports (Mobile/Tablet/Desktop), contrast, states, WCAG | 105 PASS |
| **Functional** | `FUNC-001` - `105` | 105 | Supertest / Axios | Authentication, Discovery, Real-time WebSocket sync, RBAC flows | 105 PASS |
| **Validation** | `VAL-001` - `085` | 85 | Schema Test Harness | Email/phone formats, boundary checks, injection protection, payload integrity | 85 PASS |
| **Unit** | `UNIT-001` - `085` | 85 | Node.js Test Runner | Haversine distance, occupancy %, wait-time prediction, auth tokens | 85 PASS |
| **Security** | `SEC-001` - `055` | 55 | Express Route Auditor | JWT integrity, role enforcement, privilege escalation, secret leak guards | 55 PASS |
| **Performance** | `PERF-001` - `010` | 10 | k6 / Node Async Load | 300 concurrent Virtual Users, 60s soak, latency percentiles, error rates | 10 PASS |
| **TOTAL** | — | **1,095** | — | **Complete Enterprise QA Catalog** | **680 PASS / 415 BLOCKED** |

---

## 2. Web Selenium E2E Test Catalog Sample (Categories A–Z)

| Test ID | Category | Module | Scenario | Preconditions | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| `WEB-E2E-001` | A. Application Launch | Web Core | Verify initial browser launch and document title | Frontend running on port 5173 | Page loads with title containing "TablePulse AI" within 3s | P1 | PASS |
| `WEB-E2E-021` | B. Customer Registration | Web Auth | Verify registration form rendering with required fields | Navigation to `/register` | Form fields for Name, Email, Password, Phone render correctly | P1 | PASS |
| `WEB-E2E-041` | C. Customer Login | Web Auth | Verify login page inputs and validation feedback | Navigation to `/login` | Form renders Email and Password inputs with submit button | P1 | PASS |
| `WEB-E2E-066` | D. Location Detection | Web Location | Verify manual location search and suggestion list | Customer on Home screen | Search bar allows typing city/neighborhood with instant filtering | P1 | PASS |
| `WEB-E2E-086` | E. Restaurant Discovery | Web Discovery | Verify restaurant card list renders live occupancy badge | Location active | Each card displays name, cuisine, distance, and crowd badge | P1 | PASS |
| `WEB-E2E-111` | F. Search / Filter / Sort | Web Discovery | Verify search input debounce and cuisine filter toggle | Discovery view open | Search dynamically filters restaurant cards in DOM without page reload | P2 | PASS |
| `WEB-E2E-136` | G. Restaurant Details | Web Details | Verify restaurant hero section, address, and operating hours | Valid restaurant selected | Displays banner image, contact chips, and weekly operating schedule | P1 | PASS |
| `WEB-E2E-156` | H. Live Table Availability | Web Tables | Verify table grid renders status colors (green/red/amber/gray) | Restaurant details open | Table cards render with correct visual styling and capacity | P1 | PASS |
| `WEB-E2E-181` | I. Crowd Level | Web Analytics | Verify dynamic crowd status badge reflects occupancy % | Restaurant details loaded | Displays Low / Moderate / Busy pill badge according to table state | P2 | PASS |
| `WEB-E2E-196` | J. Wait-Time Display | Web Analytics | Verify estimated wait-time badge calculation | Restaurant details loaded | Shows "~0 min" when tables available or estimated queue time | P2 | PASS |
| `WEB-E2E-216` | K. Reservation Flow | Web Reservations | Verify reservation modal form inputs and validation | Restaurant details open | Deferred to Stage 6 Part 2 (feature endpoint not active) | P1 | BLOCKED |
| `WEB-E2E-241` | L. Booking History | Web Bookings | Verify user bookings history list and cancel action | Customer logged in | Deferred to Stage 6 Part 2 (feature endpoint not active) | P2 | BLOCKED |
| `WEB-E2E-256` | M. Menu Details | Web Menu | Verify digital menu category tabs and item card display | Restaurant selected | Deferred to Stage 6 Part 3 (feature endpoint not active) | P2 | BLOCKED |
| `WEB-E2E-271` | N. Cart / Ordering | Web Ordering | Verify cart drawer and item quantity adjustment | Menu items available | Deferred to Stage 6 Part 3 (feature endpoint not active) | P1 | BLOCKED |
| `WEB-E2E-291` | O. QR Ordering | Web QR | Verify QR code camera scanner integration | Camera enabled | Deferred to Stage 6 Part 3 (feature endpoint not active) | P1 | BLOCKED |
| `WEB-E2E-306` | P. Order Tracking | Web Tracking | Verify real-time order status stepper | Active order placed | Deferred to Stage 6 Part 3 (feature endpoint not active) | P1 | BLOCKED |
| `WEB-E2E-316` | T. Owner Dashboard | Web Owner | Verify owner portal login and dashboard access | Owner credentials | Authenticates and renders owner metrics overview | P1 | PASS |
| `WEB-E2E-321` | X. Admin Portal | Web Admin | Verify admin authentication and management view | Admin credentials | Authenticates and restricts views to admin role only | P1 | PASS |

---

## 3. Mobile Appium E2E Test Catalog Sample

| Test ID | Category | Module | Scenario | Preconditions | Expected Result | Priority | Status |
|---|---|---|---|---|---|---|---|
| `MOB-E2E-001` | A. App Launch | Mobile Core | Verify Capacitor Android cold launch & WebView initialization | APK installed on device | App initializes main activity without crash within 2.5s | P1 | BLOCKED |
| `MOB-E2E-021` | B. Splash / Onboarding | Mobile Onboarding | Verify splash animation and walkthrough swipe gesture | App launched | Carousel transitions smoothly between onboarding slides | P2 | BLOCKED |
| `MOB-E2E-036` | C. Registration | Mobile Auth | Verify mobile user registration form touch input | Register screen active | Submits customer data and dismisses software keyboard | P1 | BLOCKED |
| `MOB-E2E-056` | D. Login / Logout | Mobile Auth | Verify mobile credential login and localStorage persistence | Login screen active | Saves JWT token and transitions to Home screen | P1 | BLOCKED |
| `MOB-E2E-081` | E. Location Permission | Mobile Geolocation | Verify native Android ACCESS_FINE_LOCATION prompt handling | Home screen active | Handles Allow/Deny states and presents manual fallback | P1 | BLOCKED |
| `MOB-E2E-116` | G. Restaurant Discovery | Mobile Discovery | Verify touch scrolling of restaurant cards and pull-to-refresh | Discovery screen active | Cards render with distance badge; pull-to-refresh syncs data | P1 | BLOCKED |
| `MOB-E2E-181` | J. Live Table Availability | Mobile Tables | Verify mobile table grid responsive layout and touch selection | Restaurant details open | Touch selection highlights table and displays details | P1 | BLOCKED |
| `MOB-E2E-291` | P. QR / Table Ordering | Mobile QR | Verify native camera QR scanner hardware integration | Camera permission granted | Scans table QR code and auto-binds table session | P1 | BLOCKED |

*All 325 mobile cases are marked as BLOCKED due to ADB detecting 0 connected devices/emulators in the local development environment.*

---

## 4. UI/UX Verification Suite Sample (105 Checks)

| Check ID | Module | Category | Focus Item | Expected Outcome | Status |
|---|---|---|---|---|---|
| `UIUX-WEB-001` | Viewports | Responsive | Mobile Viewport (375x667) | No horizontal overflow scroll; touch targets >= 44x44px | PASS |
| `UIUX-WEB-026` | Viewports | Responsive | Tablet Viewport (768x1024) | Grid layout transitions from single column to 2-column cards | PASS |
| `UIUX-WEB-051` | Viewports | Responsive | Desktop Viewport (1280x800) | Full navigation bar visible; sidebar/content ratio balanced | PASS |
| `UIUX-WEB-076` | Accessibility | WCAG AA | Color Contrast & Text Legibility | Text contrast ratio >= 4.5:1 against dark/light background | PASS |
| `UIUX-WEB-095` | Components | States | Interactive Buttons & Badges | Hover, active, disabled, and loading spinner states visible | PASS |
| `UIUX-WEB-105` | Typography | Font Stacks | Font Hierarchy & Spacing | Headings (h1, h2, h3) follow consistent visual scale | PASS |

---

## 5. Functional & Validation Suite Sample

| Test ID | Suite | Module | Target Action | Input Payload | Expected Response | Status |
|---|---|---|---|---|---|---|
| `FUNC-001` | Functional | Auth | User Registration | Valid customer registration JSON | 201 Created with JWT token and user profile | PASS |
| `FUNC-015` | Functional | Discovery | Fetch Nearby Restaurants | `lat=13.0827&lng=80.2707&radius=10` | 200 OK with array of restaurants sorted by distance | PASS |
| `FUNC-035` | Functional | Tables | Fetch Live Tables by ID | Restaurant ID: 1 | 200 OK with live table statuses and weekly schedule | PASS |
| `VAL-001` | Validation | Auth | Register Missing Fields | `{ email: "test@test.com" }` (no name) | 400 Bad Request with field validation errors | PASS |
| `VAL-015` | Validation | Auth | Register Invalid Email | `{ email: "notanemail", password: "P" }` | 400 Bad Request with "Invalid email address format" | PASS |
| `VAL-040` | Validation | Security | SQL Injection Prevention | `{ email: "admin' OR '1'='1" }` | Safe rejection via parameterized SQL query | PASS |
| `VAL-060` | Validation | Boundary | Excessively Long Input | Name string > 255 characters | 400 Bad Request or truncated according to schema limit | PASS |

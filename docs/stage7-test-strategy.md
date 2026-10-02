# TablePulse AI — Stage 7 Comprehensive Test Strategy

## 1. Executive Summary
This document defines the quality assurance and test automation strategy for **TablePulse AI** at **Stage 7**. The project is an enterprise-grade, real-time dining and restaurant management system featuring live table occupancy tracking, distance-based restaurant discovery, dynamic crowd estimation, wait-time analytics, and role-based portals for customers, restaurant owners, and super administrators.

The testing strategy is designed for rigorous college project validation and follows an evidence-based execution protocol:
- **No fabricated results**: Every reported result is derived strictly from real test execution in the active environment.
- **Hardware/Device isolation**: Where external hardware, emulators, or future development parts are unavailable, tests are explicitly cataloged and marked as `BLOCKED` with technical rationale, never falsely recorded as `PASSED`.

---

## 2. Test Architecture & Framework Hierarchy

```
TABLEPULSE-AI/
├── tests/
│   ├── selenium/        # Web E2E Suite (Page Object Model, headless Chrome, 325 cases)
│   ├── api/             # API Integration & Verification (Stage 5 & Stage 6 Part 1 baselines)
│   ├── unit/            # Pure mathematical & algorithmic unit suite (85 tests)
│   ├── validation/      # Input sanitization, schema boundaries, edge cases (85 tests)
│   ├── functional/      # End-to-end API workflows & RBAC authorization (105 tests)
│   ├── uiux/            # Responsive design, accessibility WCAG AA, focus states (105 tests)
│   └── security/        # RBAC privilege escalation, JWT manipulation, secret leak checks (55 tests)
├── client/
│   └── appium-tests/    # Mobile Native E2E Suite (Capacitor/UiAutomator2, 325 cases)
└── performance/
    ├── k6/              # Declarative k6 load testing scripts
    └── run-baseline-load.js # Concurrent async load runner (300 VUs, 60s soak)
```

---

## 3. Test Suites & Scope Matrix

| Test Level | Tooling | Scope & Focus Areas | Target Count | Execution Status |
|---|---|---|---|---|
| **Web E2E** | Selenium WebDriver + Chrome Headless | Customer journeys, discovery, details, live tables, owner & admin screens | 325 | 235 Passed, 90 Blocked (Stage 6 Part 2+ scope) |
| **Mobile E2E** | Appium + UiAutomator2 + WebdriverIO | Capacitor Android shell, touch gestures, native permissions, QR scanning | 325 | 325 Blocked (0 ADB devices connected) |
| **UI / UX** | Selenium + Layout Viewport Inspectors | Mobile (375px), Tablet (768px), Desktop (1280px), color contrast, states | 105 | 105 Passed |
| **Functional** | Node.js HTTP + Supertest / Axios | Authentication, Restaurant Discovery, Table Availability, Socket.IO sync | 105 | 105 Passed |
| **Validation** | Custom Schema Validator | Required fields, email regex, phone boundaries, injection payloads, invalid IDs | 85 | 85 Passed |
| **Unit** | Node.js Assertions | Haversine distance, crowd % math, wait-time calculation, JWT verification | 85 | 85 Passed |
| **Security** | Express Route Harness | Missing/expired JWT, customer accessing owner/admin routes, token exposure | 55 | 55 Passed |
| **Performance** | k6 / Node.js Load Harness | 300 concurrent Virtual Users for 60 seconds against Express + MySQL | 10 Scenarios | Executed: 38,972 reqs, 647.42 RPS, 379ms avg |

---

## 4. Test Result Status Definitions

- **`PASS`**: The test scenario was executed in the current environment and met all expected functional, visual, and behavioral criteria.
- **`FAIL`**: The test scenario was executed and did not meet expected criteria (logs and stack traces captured).
- **`BLOCKED`**: The test could not be executed due to missing external dependencies (e.g., no Android device connected via ADB, or feature scheduled for future development phases).
- **`NOT EXECUTED`**: Test is defined in catalog but intentionally omitted from the current run.
- **`NOT APPLICABLE`**: Test scenario does not pertain to the current platform or feature architecture.

---

## 5. Continuous Integration (CI/CD) Strategy
Four GitHub Actions workflows are established in `.github/workflows/`:
1. `unit-tests.yml`: Automated execution of unit test suite on every push.
2. `api-tests.yml`: Automated database migration, seed, and execution of validation, functional, and security suites.
3. `web-tests.yml`: Automated headless Chrome execution of Web Selenium and UI/UX suites with report artifact uploading.
4. `performance-tests.yml`: Controlled `workflow_dispatch` pipeline for on-demand performance soak testing.

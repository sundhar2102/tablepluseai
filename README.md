# Smart Table AI

> **"Know the Crowd. Get Your Table. Dine Smarter."**

Real-time restaurant table availability, reservation, pre-ordering, and intelligent dining platform for Web and Android.

---

## Architecture Overview

```
                      ┌──────────────────────┐
                      │    Smart Table AI    │
                      │  (Web & Android App) │
                      └──────────┬───────────┘
                                 │
                   HTTP REST / WebSocket (Socket.IO)
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │ Express.js API & WS  │
                      │   (Node.js Backend)  │
                      └──────────┬───────────┘
                                 │
                                 ▼
                      ┌──────────────────────┐
                      │  MySQL / MariaDB     │
                      │   (Relational DB)    │
                      └──────────────────────┘
```

Both the **Web Application** and the **Android Application** (via Capacitor native container) communicate with the same backend API and Socket.IO server for instant two-way synchronization of:
* Orders (Received ➔ Preparing ➔ Ready ➔ Served ➔ Completed)
* Table Seating Status (Available ➔ Occupied ➔ Cleaning ➔ Available)
* Reservations & Live Walk-In Queue
* AI Concierge Recommendations & Dietary Intent Parsing

---

## Quick Start

### Prerequisites
- Node.js 18+ (tested on Node.js 22 LTS)
- MySQL 8.0 / MariaDB 10.4+
- npm

### 1. Database Setup

```bash
# Run database migrations and seed data:
node server/database/run-migrations.js
node server/database/seed_rich_menus.js
```

### 2. Backend (Server)

```bash
cd server
npm install
npm run dev   # Starts on http://localhost:3001
```

### 3. Frontend (Web & Mobile Client)

```bash
cd client
npm install
npm run dev   # Starts on http://localhost:5173
```

### 4. Android Build (Capacitor)

```bash
cd client
npm run build
npx cap sync android
```

The compiled web assets are embedded directly into `android/app/src/main/assets/public/`. The installed APK launches independently without requiring a laptop connection, ADB, or Vite dev server.

---

## Default Test Accounts

| Role     | Email                | Password   | Access Level |
|----------|----------------------|------------|--------------|
| Admin    | admin@smarttable.ai  | Demo@1234  | Platform Admin Portal |
| Owner    | owner@demo.com       | Demo@1234  | Restaurant Owner Operations |
| Customer | customer@demo.com    | Demo@1234  | Customer Dining & Orders |

---

## Automated Test Suites

The project includes 300+ automated test cases:
* **API Tests:** `npm run test:api` (20 cases)
* **Functional Tests:** `npm run test:functional` (105 cases)
* **Validation Tests:** `npm run test:validation` (85 cases)
* **Regression Tests:** `npm run test:regression` (Branding, Data Integrity, Dietary Intent, Multi-Restaurant)
* **Selenium Web E2E:** `npm run test:selenium` (18 cases, headless Chrome)
* **Master Excel Analysis:** `npm run report:excel` (15 sheets in `reports/Smart_Table_AI_Test_Analysis.xlsx`)

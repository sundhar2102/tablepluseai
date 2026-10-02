# TablePulse AI

> **"Know the Crowd. Get Your Table. Dine Smarter."**

Real-time restaurant table availability, reservation, ordering and intelligent wait-time estimation platform.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0
- npm

### 1. Database Setup

```sql
-- Run these files in order:
mysql -u root -p < server/database/schema.sql
mysql -u root -p tablepulse_db < server/database/seeds/seed_admin.sql
```

### 2. Backend (Server)

```bash
cd server
# Copy and edit your environment variables:
cp .env.example .env
# Update DB_PASSWORD and JWT_SECRET in .env

npm install
npm run dev   # Starts on http://localhost:3001
```

### 3. Frontend (Client)

```bash
cd client
npm install
npm run dev   # Starts on http://localhost:5173
```

---

## Project Structure

```
TABLEPULSE AI/
├── client/                 # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── constants/      # Route paths, status enums
│   │   ├── context/        # AuthContext, SocketContext
│   │   ├── layouts/        # Customer, Owner, Admin layouts
│   │   ├── pages/          # Page components by role
│   │   └── services/       # API service layer
│   └── package.json
│
├── server/                 # Express + Socket.IO backend
│   ├── database/
│   │   ├── schema.sql      # MySQL schema (12 tables)
│   │   └── seeds/          # Development seed data
│   ├── src/
│   │   ├── config/         # DB connection, constants
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # Business logic
│   │   ├── socket/         # Socket.IO handler + emitters
│   │   ├── utils/          # AppError, catchAsync, helpers
│   │   ├── validations/    # Joi schemas
│   │   └── app.js          # Express application
│   └── server.js           # Server entry point
│
├── docs/                   # Stage documents
├── tests/                  # Test suites (Stage 7)
└── package.json            # Root workspace
```

---

## Development Accounts (Seed Data)

| Role     | Email                    | Password   |
|----------|--------------------------|------------|
| Admin    | admin@tablepulse.app     | Demo@1234  |
| Owner    | owner@demo.com           | Demo@1234  |
| Customer | customer@demo.com        | Demo@1234  |

> ⚠️ **Change all passwords before any production deployment.**

---

## Tech Stack

| Layer       | Technology          |
|-------------|---------------------|
| Frontend    | React 18, Vite 5    |
| Styling     | Tailwind CSS 3      |
| Routing     | React Router v6     |
| Real-time   | Socket.IO 4         |
| HTTP Client | Axios               |
| Backend     | Express 4           |
| Database    | MySQL 8.0 (InnoDB)  |
| Auth        | JWT (bcrypt 12)     |
| Validation  | Joi                 |

---

## Stage Progress

| Stage | Name                        | Status    |
|-------|-----------------------------|-----------|
| 1     | Planning                    | ✅ Done   |
| 2     | Requirements Definition     | ✅ Done   |
| 3     | UI/UX Design                | ✅ Done   |
| 4     | Architecture & DB Design    | ✅ Done   |
| 5     | Application Building        | ✅ Done   |
| 6     | Feature Implementation      | 🔜 Next   |
| 7     | Testing & Bug Fixing        | 🔜 Pending |
| 8     | Deployment                  | 🔜 Pending |

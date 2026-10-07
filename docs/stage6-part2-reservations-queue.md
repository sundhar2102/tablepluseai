# TABLEPULSE AI — STAGE 6 PART 2 DOCUMENTATION
## Table Reservations + Virtual Walk-In Queue

**Date:** October 2026  
**Status:** COMPLETE & FULLY VERIFIED ✅  
**Scope:** Customer table reservations, reservation lifecycle management, virtual walk-in waitlist queue, dynamic live queue positions, rule-based wait-time estimation, owner reservation management, owner queue management, and real-time Socket.IO broadcasts.

---

### 1. Implemented Features

1. **Customer Table Reservations:**
   - Reserve tables at approved & active restaurants in advance.
   - Select date, time (validated within daily operating hours), party size, and optional special requests.
   - Automatic table allocation matching party size and slot collision checks.
   - Anti-double-booking and duplicate reservation protection.
   - View booking details and booking history with status filters.
   - Customer self-cancellation for eligible reservations (`pending` or `confirmed`).

2. **Virtual Walk-In Queue:**
   - Join live virtual waitlist with specified party size.
   - Duplicate queue prevention (only one active queue entry per customer per restaurant).
   - Dynamic real-time queue position calculation (`#1`, `#2`, `#3`, etc.).
   - Queue wait-time estimation derived from operational parameters and position.
   - Leave / cancel queue position at any time.

3. **Owner Reservation Management:**
   - Review incoming reservations for owner's restaurant.
   - Filter by date and status (`pending`, `confirmed`, `completed`, `cancelled`, `rejected`).
   - Actions to confirm pending reservations, reject with reason, mark arrived/seated, and complete bookings.
   - Automatic table state synchronization (`reserved` / `available`).

4. **Owner Queue Management:**
   - Live view of walk-in customers waiting in line.
   - Privacy-safe customer phone masking (`***-***-1234`).
   - Call customer action (triggers `called` state and 15-minute countdown hold).
   - Seat customer action (marks customer `seated` and removes from active queue).
   - Dynamic auto-advancement of all subsequent parties in line.

5. **Real-Time Synchronization (Socket.IO):**
   - Instant UI synchronization across customer devices and owner dashboards without page reloads.
   - Events for reservation creation, status transition, queue entry, queue call/seat, and queue position advancement.

---

### 2. Backend APIs

#### Customer Reservation APIs
| Method | Endpoint | Description | Auth & RBAC |
|---|---|---|---|
| `POST` | `/api/reservations` | Create a table reservation | `authenticate`, `authorize('customer')` |
| `GET` | `/api/reservations` | List customer's reservations | `authenticate`, `authorize('customer')` |
| `GET` | `/api/reservations/:id` | View reservation details | `authenticate` (customer ownership / authorized owner) |
| `PATCH` | `/api/reservations/:id/cancel` | Cancel reservation | `authenticate` (customer ownership / authorized owner) |

#### Owner Reservation APIs
| Method | Endpoint | Description | Auth & RBAC |
|---|---|---|---|
| `GET` | `/api/owner/reservations` | List restaurant reservations | `authenticate`, `authorize('owner', 'admin')` |
| `PATCH` | `/api/owner/reservations/:id/status` | Update booking status (`confirmed`, `rejected`, `completed`, `cancelled`) | `authenticate`, `authorize('owner', 'admin')` |

#### Customer Virtual Queue APIs
| Method | Endpoint | Description | Auth & RBAC |
|---|---|---|---|
| `POST` | `/api/queue` | Join virtual walk-in queue | `authenticate`, `authorize('customer')` |
| `GET` | `/api/queue` | List customer's queue entries | `authenticate`, `authorize('customer')` |
| `GET` | `/api/queue/:id` | View queue entry details | `authenticate` (customer ownership / authorized owner) |
| `PATCH` | `/api/queue/:id/cancel` | Leave / cancel queue entry | `authenticate` (customer ownership / authorized owner) |

#### Owner Queue APIs
| Method | Endpoint | Description | Auth & RBAC |
|---|---|---|---|
| `GET` | `/api/owner/queue` | List active & past waitlist | `authenticate`, `authorize('owner', 'admin')` |
| `PATCH` | `/api/owner/queue/:id/status` | Update queue status (`called`, `seated`, `cancelled`) | `authenticate`, `authorize('owner', 'admin')` |

---

### 3. Database Usage

- **`reservations` Table:**
  - `id`: Primary key
  - `customer_id`: Foreign key to `users.id`
  - `restaurant_id`: Foreign key to `restaurants.id`
  - `table_id`: Foreign key to `tables.id`
  - `reservation_date`: Date string (`YYYY-MM-DD`)
  - `reservation_time`: Time string (`HH:MM:SS`)
  - `party_size`: Tinyint
  - `status`: Enum (`'pending'`, `'confirmed'`, `'rejected'`, `'cancelled'`, `'no_show'`, `'completed'`)
  - `special_note`: Customer requests
  - `rejection_reason`: Owner rejection reason
  - `expires_at`: Expiration timestamp (15 mins past booking time)

- **`walk_in_queue` Table:**
  - `id`: Primary key
  - `customer_id`: Foreign key to `users.id`
  - `restaurant_id`: Foreign key to `restaurants.id`
  - `party_size`: Tinyint
  - `queue_position`: Initial recorded queue position
  - `status`: Enum (`'waiting'`, `'called'`, `'seated'`, `'cancelled'`, `'expired'`)
  - `joined_at`: Timestamp joined
  - `called_at`: Timestamp owner called party
  - `expires_at`: 15-minute hold expiration
  - `completed_at`: Seated or cancelled timestamp

- **`tables` Table:**
  - Synchronized status: `'available'`, `'reserved'`, `'occupied'`, `'cleaning'`.

---

### 4. Reservation Lifecycle

```
[Customer Books] ──► status: 'pending'
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [Owner Confirms]             [Owner Rejects]
   status: 'confirmed'          status: 'rejected'
             │
      ┌──────┴──────┐
      ▼             ▼
[Customer Arrives] [Cancelled]
status: 'completed' status: 'cancelled'
```

---

### 5. Queue Lifecycle

```
[Customer Joins] ──► status: 'waiting' (Assigned Position #N)
                           │ (Auto-decrements as parties ahead are seated)
                           ▼
                  [Owner Calls Party] ──► status: 'called' (15 min hold alert)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   [Party Seated at Table]       [Cancelled / Left Line]
      status: 'seated'              status: 'cancelled'
```

---

### 6. Wait-Time Integration

- **Model Specification:** Transparently identified as `RULE_BASED` (Not AI/ML prediction).
- **Formula:**
  $$\text{Wait Minutes} = \max\left(5, (\text{Position} - 1) \times \text{round}\left(\frac{\text{avg\_dining\_duration}}{\max(1, \text{total\_tables})}\right)\right)$$
- **Payload Attributes:**
  - `calculationType`: `'RULE_BASED'`
  - `confidence`: `'CURRENT_OPERATIONAL_ESTIMATE'`
  - `isPrediction`: `false`
  - `disclaimer`: `'This is a rule-based operational estimate, not an AI prediction.'`

---

### 7. Socket.IO Events

| Event Name | Room | Payload | Purpose |
|---|---|---|---|
| `reservation:created` | `owner:{id}`, `user:{id}`, `restaurant:{id}` | Reservation object | Alert owner and customer of new booking |
| `reservation:status_changed` | `owner:{id}`, `user:{id}`, `restaurant:{id}` | Updated reservation | Synchronize status across views |
| `queue:joined` | `owner:{id}`, `restaurant:{id}` | Queue entry object | Alert owner of new waitlist entry |
| `queue:status_changed` | `owner:{id}`, `user:{id}`, `restaurant:{id}` | Updated queue entry | Alert customer when called / seated |
| `queue:position_updated` | `restaurant:{id}`, `owner:{id}` | `{ restaurantId }` | Triggers dynamic live position recalculation |

---

### 8. Security & Authorization

- **JWT Authentication:** Mandatory on all mutation and private retrieval endpoints via `authenticate` middleware.
- **RBAC (Role-Based Access Control):**
  - Customer endpoints protected with `authorize('customer')`.
  - Owner endpoints protected with `authorize('owner', 'admin')`.
  - Cross-role access blocked with `403 FORBIDDEN`.
- **Customer Privacy & Data Ownership:**
  - Customers can only access their own reservations and queue entries.
  - Owners can only manage reservations and queues for restaurants they own.
  - Customer phone numbers masked (`***-***-1234`) on owner queue screens.
- **Input Validation:** Strict Joi schemas for date, time, party size, and status values.
- **SQL Injection Prevention:** 100% parameterized queries via mysql2 pool.

---

### 9. Test Results

#### Stage 5 Regression Baseline:
- **Total Checks:** 20
- **Passed:** 20
- **Failed:** 0
- **Result:** `ALL PASS ✅`

#### Stage 6 Part 1 Regression Baseline:
- **Total Checks:** 30
- **Passed:** 30
- **Failed:** 0
- **Result:** `ALL PASS ✅`

#### Stage 6 Part 2 Verification:
- **Total Checks:** 30
- **Passed:** 30
- **Failed:** 0
- **Result:** `ALL PASS ✅`

**Total Automated Test Coverage:** 80/80 Tests Passing (100% Green).

#### Frontend Client Production Build:
- `npm run build:client` -> Built in 6.63s with 0 errors.

---

### 10. Known Limitations & Exclusions

- Menu browsing, Cart, QR scanning, and Food ordering are excluded (Stage 6 Part 3).
- Billing and Payment processing are excluded.
- Customer Profile customization is excluded.

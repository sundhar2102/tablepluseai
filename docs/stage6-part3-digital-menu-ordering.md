# TablePulse AI — Stage 6 Part 3: Digital Menu, QR Ordering, Cart & Order Management

## Overview
Stage 6 Part 3 delivers the complete digital dining experience:
- Digital menu browsing with categorized dishes, vegetarian indicators, photos, and live availability toggling.
- Table QR code scanning and instant token-to-table resolution.
- Dynamic customer shopping cart with quantity adjustments, custom kitchen special notes, subtotal, 5% GST tax calculation, and transaction-backed order placement.
- Real-time order tracking (`/app/orders`, `/app/orders/:id`) with 4-stage kitchen visual timeline and customer self-cancellation for unfulfilled orders.
- Restaurant Owner Kitchen Display System (KDS) & Order Board (`/owner/orders`) with status progression (`received` -> `preparing` -> `served` -> `completed` / `cancelled`) and real-time Socket.IO broadcasts.

---

## 1. Database Schema Utilization
- `menu_categories`: `id`, `restaurant_id`, `name`, `display_order`
- `menu_items`: `id`, `restaurant_id`, `category_id`, `name`, `description`, `price`, `is_vegetarian`, `photo_url`, `is_available`, `display_order`
- `tables`: `id`, `restaurant_id`, `table_number`, `capacity`, `status`, `qr_token`, `occupied_since`
- `orders`: `id`, `customer_id`, `restaurant_id`, `table_id`, `status` (`received`, `preparing`, `served`, `completed`, `cancelled`), `special_note`, `created_at`, `updated_at`
- `order_items`: `id`, `order_id`, `menu_item_id`, `item_name`, `unit_price`, `quantity`, `created_at`

---

## 2. API Endpoints Implemented

### Menu Endpoints
- `GET /api/restaurants/:restaurantId/menu` — Retrieve categorized dishes and items for a restaurant.
- `GET /api/menu/items/:id` — Retrieve single menu item details.
- `POST /api/owner/menu/categories` — Owner create menu category.
- `PATCH /api/owner/menu/categories/:id` — Owner update category.
- `DELETE /api/owner/menu/categories/:id` — Owner delete category.
- `POST /api/owner/menu/items` — Owner create dish.
- `PATCH /api/owner/menu/items/:id` — Owner update dish details.
- `PATCH /api/owner/menu/items/:id/toggle` — Owner toggle item availability on/off.
- `DELETE /api/owner/menu/items/:id` — Owner delete dish.

### Table & QR Endpoints
- `GET /api/tables/qr/:qrToken` — Resolves table number, capacity, and restaurant details from scanned QR token.
- `GET /api/restaurants/:restaurantId/tables` — Lists all tables for a given restaurant.

### Customer Order Endpoints
- `POST /api/orders` — Places a new order with atomic MySQL transaction, automatically updating table status to occupied.
- `GET /api/orders/my` — Customer order history with item breakdown and pricing.
- `GET /api/orders/:id` — Full order details with authorization checks.
- `PATCH /api/orders/:id/cancel` — Customer cancellation (only allowed when status is `received`).

### Owner Kitchen Endpoints
- `GET /api/owner/orders` — Kitchen order list filtered by status, table, or date with pagination.
- `PATCH /api/owner/orders/:id/status` — Advance order status (`received` -> `preparing` -> `served` -> `completed` / `cancelled`).

---

## 3. Real-Time Socket.IO Events
- `order:created` — Broadcast to owner kitchen room, customer room, and table room when a new order is received.
- `order:status_changed` — Broadcast when order status updates (`preparing`, `served`, `completed`, `cancelled`).

---

## 4. Frontend Pages & Components
- [`client/src/pages/customer/OrdersPage.jsx`](file:///c:/Users/hemas/OneDrive/Desktop/TABLEPULSE%20AI/client/src/pages/customer/OrdersPage.jsx) — Active/past order tabs, live kitchen status pills, item details, cancel button, and empty state.
- [`client/src/pages/customer/OrderDetailPage.jsx`](file:///c:/Users/hemas/OneDrive/Desktop/TABLEPULSE%20AI/client/src/pages/customer/OrderDetailPage.jsx) — Visual 4-step order progress timeline, itemized bill breakdown, and restaurant contact info.
- [`client/src/pages/customer/QRScanPage.jsx`](file:///c:/Users/hemas/OneDrive/Desktop/TABLEPULSE%20AI/client/src/pages/customer/QRScanPage.jsx) — Table QR token resolution and one-tap digital menu launch.
- [`client/src/components/customer/DigitalMenuModal.jsx`](file:///c:/Users/hemas/OneDrive/Desktop/TABLEPULSE%20AI/client/src/components/customer/DigitalMenuModal.jsx) — Search, category tabs, veg-only toggle, quantity modifiers, and integrated checkout.
- [`client/src/pages/owner/OwnerOrdersPage.jsx`](file:///c:/Users/hemas/OneDrive/Desktop/TABLEPULSE%20AI/client/src/pages/owner/OwnerOrdersPage.jsx) — Live Kitchen Display System (KDS) with status tabs and one-click dispatch actions.
- [`client/src/context/CartContext.jsx`](file:///c:/Users/hemas/OneDrive/Desktop/TABLEPULSE%20AI/client/src/context/CartContext.jsx) — Cart state management with persistent storage and tax calculations.

---

## 5. Verification & Test Results
- Stage 6 Part 3 automated test suite: `tests/api/test-stage6-part3.js` (**20/20 PASS**)
- Stage 6 Part 2 automated test suite: `tests/api/test-stage6-part2.js` (**30/30 PASS**)
- Stage 6 Part 1 automated test suite: `tests/api/test-stage6-part1.js` (**30/30 PASS**)
- Stage 5 acceptance test suite: `tests/api/verify-stage5.js` (**20/20 PASS**)
- Total: **100/100 tests passing with zero regressions**.
- Frontend compilation (`npm run build:client`): **Clean build (0 errors)**.

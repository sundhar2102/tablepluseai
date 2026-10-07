// Route path constants — single source of truth for all navigation
export const ROUTES = {
  // Public
  HOME:         '/',
  LOGIN:        '/login',
  REGISTER:     '/register',
  FORGOT_PASSWORD: '/forgot-password',
  OWNER_LOGIN:  '/owner/login',
  OWNER_REGISTER: '/owner/register',
  ADMIN_LOGIN:  '/admin/login',
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND:    '*',

  // Customer routes (/app/*)
  APP_HOME:         '/app',
  APP_RESTAURANTS:  '/app/restaurants',
  APP_RESTAURANT:   '/app/restaurants/:id',
  APP_BOOKINGS:     '/app/bookings',
  APP_BOOKING:      '/app/bookings/:id',
  APP_ORDERS:       '/app/orders',
  APP_ORDER:        '/app/orders/:id',
  APP_QUEUE:        '/app/queue/:restaurantId',
  APP_QR:           '/app/qr',
  APP_BILL:         '/app/bill/:orderId',
  APP_PROFILE:      '/app/profile',

  // Owner routes (/owner/*)
  OWNER_DASHBOARD:     '/owner',
  OWNER_TABLES:        '/owner/tables',
  OWNER_RESERVATIONS:  '/owner/reservations',
  OWNER_ORDERS:        '/owner/orders',
  OWNER_MENU:          '/owner/menu',
  OWNER_QUEUE:         '/owner/queue',
  OWNER_REPORTS:       '/owner/reports',
  OWNER_SETTINGS:      '/owner/settings',

  // Admin routes (/admin/*)
  ADMIN_DASHBOARD:     '/admin',
  ADMIN_RESTAURANTS:   '/admin/restaurants',
  ADMIN_APPROVALS:     '/admin/approvals',
  ADMIN_USERS:         '/admin/users',
  ADMIN_OWNERS:        '/admin/owners',
  ADMIN_REPORTS:       '/admin/reports',
  ADMIN_SETTINGS:      '/admin/settings',
};

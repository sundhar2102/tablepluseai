import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }   from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider }   from './context/CartContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout    from './layouts/OwnerLayout';
import AdminLayout    from './layouts/AdminLayout';

// Public auth pages
import CustomerLoginPage   from './pages/customer/LoginPage';
import CustomerRegisterPage from './pages/customer/RegisterPage';
import ForgotPasswordPage  from './pages/customer/ForgotPasswordPage';
import OwnerLoginPage      from './pages/owner/OwnerLoginPage';
import OwnerRegisterPage   from './pages/owner/OwnerRegisterPage';
import AdminLoginPage      from './pages/admin/AdminLoginPage';
import NotFoundPage        from './pages/NotFoundPage';
import UnauthorizedPage    from './pages/UnauthorizedPage';

// Customer pages
import CustomerHomePage    from './pages/customer/HomePage';
import RestaurantDetailPage from './pages/customer/RestaurantDetailPage';
import BookingsPage        from './pages/customer/BookingsPage';
import BookingDetailPage   from './pages/customer/BookingDetailPage';
import OrdersPage          from './pages/customer/OrdersPage';
import OrderDetailPage     from './pages/customer/OrderDetailPage';
import BillPaymentPage     from './pages/customer/BillPaymentPage';
import QRScanPage          from './pages/customer/QRScanPage';
import QueuePage           from './pages/customer/QueuePage';
import CustomerProfilePage from './pages/customer/ProfilePage';

// Owner pages
import OwnerDashboardPage    from './pages/owner/OwnerDashboardPage';
import OwnerTablesPage       from './pages/owner/OwnerTablesPage';
import OwnerReservationsPage from './pages/owner/OwnerReservationsPage';
import OwnerOrdersPage       from './pages/owner/OwnerOrdersPage';
import OwnerMenuPage         from './pages/owner/OwnerMenuPage';
import OwnerQueuePage        from './pages/owner/OwnerQueuePage';
import OwnerCustomersPage    from './pages/owner/OwnerCustomersPage';
import OwnerReportsPage      from './pages/owner/OwnerReportsPage';
import OwnerSettingsPage     from './pages/owner/OwnerSettingsPage';

// Admin pages
import AdminDashboardPage   from './pages/admin/AdminDashboardPage';
import AdminRestaurantsPage from './pages/admin/AdminRestaurantsPage';
import AdminApprovalsPage   from './pages/admin/AdminApprovalsPage';
import AdminUsersPage       from './pages/admin/AdminUsersPage';
import AdminOwnersPage      from './pages/admin/AdminOwnersPage';
import AdminReportsPage     from './pages/admin/AdminReportsPage';
import AdminSettingsPage    from './pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <CartProvider>
            <Routes>

            {/* ── Root redirect ───────────────────────────────────── */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── Public auth routes ──────────────────────────────── */}
            <Route path="/login"           element={<CustomerLoginPage />} />
            <Route path="/register"        element={<CustomerRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/owner/login"     element={<OwnerLoginPage />} />
            <Route path="/owner/register"  element={<OwnerRegisterPage />} />
            <Route path="/admin/login"     element={<AdminLoginPage />} />
            <Route path="/unauthorized"    element={<UnauthorizedPage />} />

            {/* ── Customer routes (/app/*) ────────────────────────── */}
            <Route path="/app" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <CustomerHomePage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/restaurants" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <CustomerHomePage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/restaurants/:id" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <RestaurantDetailPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/bookings" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <BookingsPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/bookings/:id" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <BookingDetailPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/orders" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <OrdersPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/orders/:id" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <OrderDetailPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/bill/:orderId" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <BillPaymentPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/profile" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <CustomerProfilePage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/qr" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <QRScanPage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/queue" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <QueuePage />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/queue/:restaurantId" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <QueuePage />
                </CustomerLayout>
              </ProtectedRoute>
            } />

            {/* ── Owner routes (/owner/*) ──────────────────────────── */}
            <Route path="/owner" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerDashboardPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/tables" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerTablesPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/reservations" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerReservationsPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/orders" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerOrdersPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/menu" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerMenuPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/queue" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerQueuePage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/customers" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerCustomersPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/reports" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerReportsPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/settings" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <OwnerSettingsPage />
                </OwnerLayout>
              </ProtectedRoute>
            } />

            {/* ── Admin routes (/admin/*) ──────────────────────────── */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminDashboardPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/restaurants" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminRestaurantsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminApprovalsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminUsersPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/owners" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminOwnersPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminReportsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <AdminSettingsPage />
                </AdminLayout>
              </ProtectedRoute>
            } />

            {/* ── 404 ─────────────────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>

          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1A1E2E',
                color:      '#F1F5F9',
                border:     '1px solid #2D3250',
                borderRadius: '0.5rem',
                fontSize:   '0.875rem',
              },
              success: {
                iconTheme: { primary: '#00C2A8', secondary: '#1A1E2E' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#1A1E2E' },
              },
            }}
          />
          </CartProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

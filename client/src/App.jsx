import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }   from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import OwnerLayout    from './layouts/OwnerLayout';
import AdminLayout    from './layouts/AdminLayout';

// Public pages
import CustomerLoginPage   from './pages/customer/LoginPage';
import CustomerRegisterPage from './pages/customer/RegisterPage';
import OwnerLoginPage      from './pages/owner/OwnerLoginPage';
import AdminLoginPage      from './pages/admin/AdminLoginPage';
import NotFoundPage        from './pages/NotFoundPage';
import UnauthorizedPage    from './pages/UnauthorizedPage';

// Customer pages
import CustomerHomePage from './pages/customer/HomePage';
import RestaurantDetailPage from './pages/customer/RestaurantDetailPage';
// Stage 6 placeholders — import stubs as needed
const PlaceholderPage = ({ title }) => (
  <div className="page-container py-6 animate-fade-in">
    <h1 className="section-title mb-2">{title}</h1>
    <p className="text-text-secondary text-sm">This page will be implemented in Stage 6.</p>
  </div>
);

// Owner pages
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>

            {/* ── Root redirect ───────────────────────────────────── */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── Public auth routes ──────────────────────────────── */}
            <Route path="/login"          element={<CustomerLoginPage />} />
            <Route path="/register"       element={<CustomerRegisterPage />} />
            <Route path="/owner/login"    element={<OwnerLoginPage />} />
            <Route path="/owner/register" element={
              <div className="min-h-screen bg-surface-bg flex items-center justify-center p-4">
                <div className="card max-w-sm w-full text-center py-10">
                  <p className="text-text-secondary">Owner registration coming in Stage 6.</p>
                </div>
              </div>
            } />
            <Route path="/admin/login"    element={<AdminLoginPage />} />
            <Route path="/unauthorized"   element={<UnauthorizedPage />} />

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
                  <PlaceholderPage title="My Bookings" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/bookings/:id" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="Booking Detail" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/orders" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="My Orders" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/orders/:id" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="Order Tracking" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/profile" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="My Profile" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/qr" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="Scan QR Code" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/queue/:restaurantId" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="Queue Status" />
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="/app/bill/:orderId" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerLayout>
                  <PlaceholderPage title="Bill & Payment" />
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
                  <PlaceholderPage title="Table Management" />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/reservations" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <PlaceholderPage title="Reservations" />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/orders" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <PlaceholderPage title="Orders" />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/menu" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <PlaceholderPage title="Menu Management" />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/queue" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <PlaceholderPage title="Queue Management" />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/reports" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <PlaceholderPage title="Reports" />
                </OwnerLayout>
              </ProtectedRoute>
            } />
            <Route path="/owner/settings" element={
              <ProtectedRoute requiredRole="owner">
                <OwnerLayout>
                  <PlaceholderPage title="Settings" />
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
                  <PlaceholderPage title="All Restaurants" />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <PlaceholderPage title="Pending Approvals" />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <PlaceholderPage title="Customer Management" />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/owners" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <PlaceholderPage title="Owner Management" />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <PlaceholderPage title="Admin Reports" />
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
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

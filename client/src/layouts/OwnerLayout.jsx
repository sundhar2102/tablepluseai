import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Grid2X2, CalendarDays,
  ShoppingBag, UtensilsCrossed, Users, BarChart3,
  Settings, LogOut, ChevronRight, Menu, X, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SmartTableLogo from '../components/common/SmartTableLogo';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/owner',               icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/owner/tables',        icon: Grid2X2,         label: 'Tables'        },
  { to: '/owner/reservations',  icon: CalendarDays,    label: 'Reservations'  },
  { to: '/owner/orders',        icon: ShoppingBag,     label: 'Orders'        },
  { to: '/owner/menu',          icon: UtensilsCrossed, label: 'Menu'          },
  { to: '/owner/queue',         icon: Users,           label: 'Queue'         },
  { to: '/owner/customers',     icon: UserCheck,       label: 'Customers'     },
  { to: '/owner/reports',       icon: BarChart3,       label: 'Reports'       },
  { to: '/owner/settings',      icon: Settings,        label: 'Settings'      },
];

/**
 * OwnerLayout — Desktop-first sidebar layout for restaurant owners.
 * Stage 3 Decision 3: Owner Dashboard is Desktop-first.
 */
export default function OwnerLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/owner/login');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-sidebar bg-surface-card
                        border-r border-surface-border fixed top-0 left-0 bottom-0 z-30">
        {/* Logo */}
        <div className="h-header flex items-center px-4 border-b border-surface-border">
          <SmartTableLogo variant="full" size="sm" subtitle="Owner Portal" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-all duration-200
                 ${isActive
                   ? 'bg-brand/10 text-brand border border-brand/20'
                   : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} className="flex-shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-brand flex-shrink-0" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-surface-border p-3">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'O'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-disabled truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
                       text-sm text-text-secondary hover:text-status-occupied hover:bg-status-occupied/10
                       transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 md:ml-sidebar flex flex-col min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-20 h-header bg-surface-card border-b border-surface-border
                           flex items-center justify-between px-4 md:px-6">
          {/* Mobile: logo + hamburger */}
          <div className="flex items-center justify-between w-full md:hidden">
            <Link to="/owner" className="flex items-center gap-2">
              <SmartTableLogo variant="full" size="sm" subtitle="Owner" />
            </Link>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="p-1.5 rounded-lg bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {/* Desktop: page title slot — filled by child pages */}
          <div className="hidden md:flex items-center" id="page-title-slot" />
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-text-disabled">{user?.name}</span>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-surface-card border-b border-surface-border p-3 space-y-1 animate-slide-up">
            {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                   ${isActive
                     ? 'bg-brand/10 text-brand border border-brand/20'
                     : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
            <div className="pt-2 border-t border-surface-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-status-occupied hover:bg-status-occupied/10 transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

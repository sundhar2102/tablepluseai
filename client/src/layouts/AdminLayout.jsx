import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, ClipboardCheck,
  Users, UserCog, BarChart3, Settings, LogOut, Shield, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/admin',               icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/admin/restaurants',   icon: Store,           label: 'Restaurants'   },
  { to: '/admin/approvals',     icon: ClipboardCheck,  label: 'Approvals'     },
  { to: '/admin/users',         icon: Users,           label: 'Customers'     },
  { to: '/admin/owners',        icon: UserCog,         label: 'Owners'        },
  { to: '/admin/reports',       icon: BarChart3,       label: 'Reports'       },
  { to: '/admin/settings',      icon: Settings,        label: 'Settings'      },
];

/**
 * AdminLayout — Sidebar layout for Super Admin.
 */
export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-sidebar bg-surface-card
                        border-r border-surface-border fixed top-0 left-0 bottom-0 z-30">
        {/* Logo */}
        <Link to="/admin" className="h-header flex items-center gap-3 px-5 border-b border-surface-border">
          <Shield size={20} className="text-accent flex-shrink-0" />
          <div>
            <p className="font-bold text-text-primary text-sm leading-none">TablePulse</p>
            <p className="text-accent text-[10px] mt-0.5 font-semibold">SUPER ADMIN</p>
          </div>
        </Link>

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
                   ? 'bg-accent/10 text-accent border border-accent/20'
                   : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'}`
              }
            >
              <Icon size={18} strokeWidth={1.8} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-surface-border p-3">
          <div className="flex items-center gap-3 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-accent text-sm font-bold">A</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-disabled truncate">Super Admin</p>
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

      {/* Main */}
      <div className="flex-1 md:ml-sidebar flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 h-header bg-surface-card border-b border-surface-border
                           flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/admin" className="flex items-center gap-2">
              <Shield size={20} className="text-accent flex-shrink-0" />
              <span className="font-bold text-text-primary text-sm">TablePulse Admin</span>
            </Link>
          </div>
          <div className="hidden md:block flex-1 font-semibold text-text-secondary text-sm">Admin Panel</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-disabled hidden sm:block">{user?.email}</span>
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden p-1.5 rounded-lg bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
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
                     ? 'bg-accent/10 text-accent border border-accent/20'
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

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

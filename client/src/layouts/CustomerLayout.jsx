import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, CalendarDays, ShoppingBag, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationModal from '../components/common/NotificationModal';
import AiAssistantDrawer from '../components/common/AiAssistantDrawer';
import SmartTableLogo from '../components/common/SmartTableLogo';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { to: '/app',              icon: Home,          label: 'Home',        end: true },
  { to: '/app/restaurants',  icon: Search,        label: 'Restaurants'  },
  { to: '/app/bookings',     icon: CalendarDays,  label: 'Bookings'     },
  { to: '/app/orders',       icon: ShoppingBag,   label: 'Orders'       },
  { to: '/app/profile',      icon: User,          label: 'Profile'      },
];

/**
 * CustomerLayout — Wraps all customer app pages.
 * Provides the top header and bottom 5-tab navigation (Stage 3 approved).
 */
export default function CustomerLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col">
      {/* Top header */}
      <header className="sticky top-0 z-40 h-header bg-surface-card border-b border-surface-border
                         flex items-center px-4 gap-3">
        <Link to="/app" className="flex items-center gap-2 flex-1 group">
          <SmartTableLogo variant="full" size="sm" />
        </Link>
        <NotificationBell onOpen={() => setNotifOpen(true)} />
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center
                     text-text-secondary hover:text-status-occupied hover:bg-status-occupied/10 transition-colors"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* Notification Modal */}
      <NotificationModal isOpen={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Page content */}
      <main className="flex-1 pb-nav-bottom overflow-y-auto">
        {children}
      </main>

      {/* Smart Table AI Concierge & Dining Assistant */}
      <AiAssistantDrawer />

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-nav-bottom
                      bg-surface-card border-t border-surface-border
                      flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg
               transition-all duration-200 min-w-0
               ${isActive
                 ? 'text-brand'
                 : 'text-text-disabled hover:text-text-secondary'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="flex-shrink-0"
                />
                <span className="text-[10px] font-medium truncate">{label}</span>
                {isActive && (
                  <span className="absolute bottom-2 w-4 h-0.5 bg-brand rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function NotificationBell({ onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="w-9 h-9 rounded-lg bg-surface-elevated flex items-center justify-center
                 text-text-secondary hover:text-brand transition-colors relative"
      aria-label="Notifications"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand" />
    </button>
  );
}

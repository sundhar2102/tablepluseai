import { useState } from 'react';
import { Bell, CheckCheck, Trash2, CalendarDays, ShoppingBag, Users, Info, Clock } from 'lucide-react';
import Modal from './Modal';
import EmptyState from './EmptyState';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Table Ready for Seating',
    message: 'Your table #4 at The Spice Pavilion is prepared. Please arrive within 10 minutes.',
    type: 'queue',
    time: '5 mins ago',
    read: false,
  },
  {
    id: 2,
    title: 'Reservation Confirmed',
    message: 'Your dining reservation for 4 guests tomorrow at 7:30 PM is confirmed.',
    type: 'booking',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 3,
    title: 'Order Status: Cooking in Kitchen',
    message: 'The chef has started preparing your order #1002. Hot dishes coming soon!',
    type: 'order',
    time: 'Yesterday',
    read: true,
  },
  {
    id: 4,
    title: 'Welcome to Smart Table AI',
    message: 'Discover real restaurants, reserve tables, track wait times and dine smarter.',
    type: 'system',
    time: '2 days ago',
    read: true,
  },
];

export default function NotificationModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState('ALL'); // 'ALL' or 'UNREAD'

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'booking':
        return <CalendarDays size={16} className="text-brand" />;
      case 'order':
        return <ShoppingBag size={16} className="text-blue-400" />;
      case 'queue':
        return <Users size={16} className="text-amber-400" />;
      default:
        return <Info size={16} className="text-text-muted" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between pb-2 border-b border-surface-border text-xs">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filter === 'ALL'
                  ? 'bg-brand text-surface-bg'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filter === 'UNREAD'
                  ? 'bg-brand text-surface-bg'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-brand hover:underline inline-flex items-center gap-1 text-[11px]"
                title="Mark all as read"
              >
                <CheckCheck size={13} />
                <span>Mark Read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-text-muted hover:text-red-400 inline-flex items-center gap-1 text-[11px]"
                title="Clear all notifications"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
            description="When you have reservation or queue updates, they will appear here."
            className="border-none bg-transparent py-8"
          />
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleRead(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  item.read
                    ? 'bg-surface-elevated/30 border-surface-border/50 text-text-secondary hover:bg-surface-elevated/50'
                    : 'bg-brand/5 border-brand/20 text-text-primary hover:bg-brand/10'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold truncate">
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary leading-snug">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-text-muted pt-0.5">
                    <Clock size={10} />
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

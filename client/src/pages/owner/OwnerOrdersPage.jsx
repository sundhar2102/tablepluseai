import { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Clock,
  CheckCircle2,
  XCircle,
  Radio,
  RefreshCw,
  AlertCircle,
  ChefHat,
  Filter,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: 'active',    label: 'Live Kitchen (Active)' },
  { key: 'received',  label: 'Received' },
  { key: 'preparing', label: 'In Kitchen' },
  { key: 'served',    label: 'Served' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all',       label: 'All Orders' },
];

export default function OwnerOrdersPage() {
  const { socket, connected: socketConnected } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [updatingId, setUpdatingId] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOwnerOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load owner orders', err);
      setError(err.response?.data?.error?.message || 'Failed to load restaurant orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time socket events for owner kitchen display
  useEffect(() => {
    if (!socket) return;

    if (socketConnected) {
      socket.emit('join:owner');
      fetchOrders();
    }

    const handleOrderCreated = (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
      setLatestAlert({
        id: newOrder.id,
        tableNumber: newOrder.tableNumber,
        total: newOrder.total,
      });
      toast(`🛎️ New Order #${newOrder.id} for Table ${newOrder.tableNumber}!`, {
        duration: 5000,
        style: {
          background: '#0ea5e9',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
    };

    const handleStatusChanged = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_changed', handleStatusChanged);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_changed', handleStatusChanged);
    };
  }, [socket, socketConnected, fetchOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId} marked as ${newStatus.toUpperCase()}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...res.data } : o))
      );
      if (latestAlert?.id === orderId) {
        setLatestAlert(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') {
      return ['received', 'preparing', 'served'].includes(o.status);
    }
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title text-2xl font-bold flex items-center gap-2">
              <ChefHat size={26} className="text-brand" />
              <span>Kitchen Display & Orders</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-brand border border-brand/20">
              <Radio size={10} className={socketConnected ? 'text-brand animate-pulse' : 'text-text-disabled'} />
              {socketConnected ? 'Live KDS' : 'Connecting'}
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-0.5">
            Real-time kitchen order dispatching, food preparation, and table serving board
          </p>
        </div>

        <button
          onClick={fetchOrders}
          disabled={loading}
          className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-surface-border">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'active'
              ? orders.filter((o) => ['received', 'preparing', 'served'].includes(o.status)).length
              : tab.key === 'all'
              ? orders.length
              : orders.filter((o) => o.status === tab.key).length;

          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-brand text-surface-bg'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-black/20 text-surface-bg' : 'bg-surface-card text-text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="card p-4 bg-red-950/20 border border-red-500/30 text-center space-y-1">
          <AlertCircle size={20} className="text-red-400 mx-auto" />
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="h-6 bg-surface-elevated rounded w-1/3" />
              <div className="h-20 bg-surface-elevated rounded" />
              <div className="h-8 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="card text-center py-16 px-4 space-y-3 border border-surface-border">
          <Utensils size={32} className="text-text-disabled mx-auto" />
          <h3 className="font-bold text-base text-text-primary">
            {orders.length === 0 ? 'No customer orders yet' : `No ${activeTab} orders`}
          </h3>
          <p className="text-xs text-text-muted">
            {orders.length === 0
              ? 'When a customer places a dine-in order through TablePulse AI, it will appear here in real time.'
              : 'New customer orders will appear here automatically via real-time WebSocket.'}
          </p>
        </div>
      )}

      {/* New Order Real-Time Alert Banner */}
      {latestAlert && (
        <div
          id="new-order-alert-banner"
          data-testid="new-order-alert-banner"
          className="card p-4 bg-brand/10 border border-brand/40 flex items-center justify-between animate-bounce-subtle"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🛎️</span>
            <div>
              <h4 className="text-xs font-bold text-brand uppercase tracking-wider">
                New Order Received!
              </h4>
              <p className="text-xs text-text-primary">
                Order #{latestAlert.id} for Table {latestAlert.tableNumber} • Grand Total: ₹{latestAlert.total?.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLatestAlert(null)}
            className="btn-outline btn-sm text-xs py-1 px-2.5 text-text-secondary hover:text-text-primary"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Orders Grid */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                id={`owner-order-${order.id}`}
                data-testid={`owner-order-${order.id}`}
                className={`card p-4 border flex flex-col justify-between space-y-3 transition-all ${
                  order.status === 'received'
                    ? 'border-amber-500/50 bg-amber-950/10 ring-1 ring-amber-500/20'
                    : order.status === 'preparing'
                    ? 'border-blue-500/50 bg-blue-950/10'
                    : order.status === 'served'
                    ? 'border-indigo-500/40 bg-indigo-950/10'
                    : 'border-surface-border'
                }`}
              >
                {/* Header: Table & Status */}
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-surface-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg text-brand font-mono">
                        Table {order.tableNumber}
                      </span>
                      <span id={`owner-order-id-${order.id}`} className="text-[11px] text-text-muted">#{order.id}</span>
                    </div>

                    <span
                      id={`owner-order-status-${order.id}`}
                      data-testid={`owner-order-status-${order.id}`}
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        order.status === 'received'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                          : order.status === 'preparing'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : order.status === 'served'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : order.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  {/* Customer info & time */}
                  <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 pb-2">
                    <span className="font-medium text-text-secondary">
                      {order.customerName || 'Walk-in Guest'}
                    </span>
                    <span>
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="p-2.5 rounded-lg bg-surface-elevated/40 space-y-1 my-2">
                    {order.items?.map((it) => (
                      <div key={it.id} className="flex justify-between text-xs font-semibold">
                        <span className="text-text-primary">
                          {it.quantity} × {it.name}
                        </span>
                        <span className="text-text-muted font-mono">
                          ₹{it.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.specialNote && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 italic mb-2">
                      ⚠️ Note: "{order.specialNote}"
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-text-muted">Total Payable:</span>
                    <span className="font-mono font-extrabold text-brand">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="pt-2 border-t border-surface-border/60">
                  {order.status === 'received' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        id={`btn-prepare-${order.id}`}
                        data-testid={`btn-prepare-${order.id}`}
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        disabled={isUpdating}
                        className="btn-primary py-2 text-xs font-bold"
                      >
                        {isUpdating ? '...' : 'Start Cooking'}
                      </button>
                      <button
                        id={`btn-cancel-${order.id}`}
                        data-testid={`btn-cancel-${order.id}`}
                        onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                        disabled={isUpdating}
                        className="btn-outline py-2 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      id={`btn-serve-${order.id}`}
                      data-testid={`btn-serve-${order.id}`}
                      onClick={() => handleUpdateStatus(order.id, 'served')}
                      disabled={isUpdating}
                      className="btn-primary w-full py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 border-none"
                    >
                      {isUpdating ? '...' : 'Mark Served at Table'}
                    </button>
                  )}

                  {order.status === 'served' && (
                    <button
                      id={`btn-complete-${order.id}`}
                      data-testid={`btn-complete-${order.id}`}
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      disabled={isUpdating}
                      className="btn-primary w-full py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 border-none"
                    >
                      {isUpdating ? '...' : 'Complete Order'}
                    </button>
                  )}

                  {['completed', 'cancelled'].includes(order.status) && (
                    <div className="text-center text-[10px] text-text-muted italic py-1">
                      Order finalized ({order.status})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

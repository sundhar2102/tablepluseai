import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  Utensils,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  received: {
    label: 'Order Received',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Clock,
  },
  preparing: {
    label: 'Cooking in Kitchen',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Utensils,
  },
  served: {
    label: 'Served at Table',
    color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    icon: CheckCircle2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: XCircle,
  },
};

export default function OrdersPage() {
  const navigate = useNavigate();
  const { socket, connected: socketConnected } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('active'); // 'active', 'past', 'all'
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getMyOrders();
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError(err.response?.data?.error?.message || 'Could not load your orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (newOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
      toast.success(`Order #${newOrder.id} placed! Kitchen received.`);
    };

    const handleStatusChanged = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
      toast(`Order #${updatedOrder.id} status updated to ${updatedOrder.status}`, {
        icon: '🍳',
      });
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_changed', handleStatusChanged);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_changed', handleStatusChanged);
    };
  }, [socket]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancellingId(orderId);
      const res = await orderService.cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const activeOrders = orders.filter((o) =>
    ['received', 'preparing', 'served'].includes(o.status)
  );
  const pastOrders = orders.filter((o) =>
    ['completed', 'cancelled'].includes(o.status)
  );

  const displayedOrders =
    filterTab === 'active'
      ? activeOrders
      : filterTab === 'past'
      ? pastOrders
      : orders;

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title text-2xl font-bold">My Orders</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-brand border border-brand/20">
              <Radio size={10} className={socketConnected ? 'text-brand animate-pulse' : 'text-text-disabled'} />
              {socketConnected ? 'Live Tracker' : 'Connecting'}
            </span>
          </div>
          <p className="text-text-secondary text-sm mt-0.5">
            Real-time kitchen status, table orders, and dining history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/app/restaurants"
            className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5 shadow-sm"
          >
            <Utensils size={14} />
            <span>Order Food</span>
          </Link>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
            title="Refresh Orders"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-1">
        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors relative ${
            filterTab === 'active'
              ? 'text-brand border-b-2 border-brand font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => setFilterTab('past')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors relative ${
            filterTab === 'past'
              ? 'text-brand border-b-2 border-brand font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Past Orders ({pastOrders.length})
        </button>
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors relative ${
            filterTab === 'all'
              ? 'text-brand border-b-2 border-brand font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          All ({orders.length})
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="card border border-red-500/30 bg-red-950/20 p-4 text-center space-y-2">
          <AlertCircle size={24} className="text-red-400 mx-auto" />
          <p className="text-sm text-red-200">{error}</p>
          <button onClick={fetchOrders} className="btn-outline btn-sm text-xs mt-2">
            Try Again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5 animate-pulse space-y-3">
              <div className="h-5 bg-surface-elevated rounded w-1/3" />
              <div className="h-4 bg-surface-elevated rounded w-1/2" />
              <div className="h-10 bg-surface-elevated rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedOrders.length === 0 && (
        <div className="card text-center py-12 px-4 space-y-4 border border-surface-border">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-text-disabled">
            <ShoppingBag size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-text-primary">
              {orders.length === 0
                ? 'No orders yet'
                : filterTab === 'active'
                ? 'No active orders in progress'
                : 'No past orders found'}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Scan a table QR code or browse restaurants to view digital menus and place live orders.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/app/restaurants" className="btn-primary inline-flex items-center gap-2 text-sm">
              <span>Browse Restaurants</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && displayedOrders.length > 0 && (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
            const StatusIcon = statusCfg.icon;
            const isCancelable = order.status === 'received';

            return (
              <div
                key={order.id}
                className="card p-5 border border-surface-border hover:border-surface-border/80 transition-all space-y-4"
              >
                {/* Top bar: Restaurant + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-surface-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/app/restaurants/${order.restaurantId}`}
                        className="font-bold text-base text-text-primary hover:text-brand transition-colors"
                      >
                        {order.restaurantName}
                      </Link>
                      <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-text-secondary font-mono">
                        Table {order.tableNumber}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted">
                      Order #{order.id} •{' '}
                      {new Date(order.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.color}`}
                    >
                      <StatusIcon size={13} />
                      <span>{statusCfg.label}</span>
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5">
                  <div className="text-xs text-text-muted font-medium">Order Items:</div>
                  <div className="space-y-1">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-xs text-text-secondary"
                      >
                        <span className="font-medium">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono">₹{item.lineTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.specialNote && (
                    <div className="text-xs italic text-text-muted bg-surface-elevated/40 p-2 rounded mt-2">
                      Note: "{order.specialNote}"
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Total & Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <div>
                    <span className="text-xs text-text-muted block">Total (incl. 5% GST)</span>
                    <span className="text-lg font-extrabold text-brand font-mono">
                      ₹{order.total.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCancelable && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="btn-outline text-xs py-1.5 px-3 border-red-500/40 text-red-400 hover:bg-red-500/10"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    <Link
                      to={`/app/orders/${order.id}`}
                      className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1"
                    >
                      <span>Track Order</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

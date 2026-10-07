import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Utensils,
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Radio,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const STEPS = [
  { key: 'received',  label: 'Received',  desc: 'Kitchen received order',  icon: Clock },
  { key: 'preparing', label: 'Preparing', desc: 'Chef is preparing dishes', icon: Utensils },
  { key: 'served',    label: 'Served',    desc: 'Brought to your table',    icon: CheckCircle2 },
  { key: 'completed', label: 'Completed', desc: 'Dining complete',          icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected: socketConnected } = useSocket();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(id);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to load order', err);
      setError(err.response?.data?.error?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Join order room & listen to real-time status changes
  useEffect(() => {
    if (!socket || !id) return;

    if (socketConnected) {
      socket.emit('order:track', { orderId: Number(id) });
      fetchOrder();
    }

    const handleStatusChanged = (updatedOrder) => {
      if (Number(updatedOrder.id) === Number(id)) {
        setOrder((prev) => ({ ...prev, ...updatedOrder }));
        toast.success(`Kitchen status updated: ${updatedOrder.status.toUpperCase()}`);
      }
    };

    socket.on('order:status_changed', handleStatusChanged);

    return () => {
      socket.off('order:status_changed', handleStatusChanged);
      socket.emit('leave:order', { orderId: Number(id) });
    };
  }, [socket, id, socketConnected, fetchOrder]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      const res = await orderService.cancelOrder(id);
      setOrder(res.data);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container py-10 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-6 bg-surface-elevated rounded w-1/4" />
        <div className="h-40 bg-surface-elevated rounded" />
        <div className="h-60 bg-surface-elevated rounded" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-container py-12 max-w-md mx-auto text-center space-y-4">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <h2 className="font-bold text-lg text-text-primary">Order Not Found</h2>
        <p className="text-xs text-text-secondary">{error || 'This order does not exist or has expired.'}</p>
        <Link to="/app/orders" className="btn-primary btn-sm inline-flex items-center gap-1.5 mt-2">
          <ArrowLeft size={16} />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="page-container py-6 space-y-6 max-w-2xl mx-auto animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand transition-colors"
        >
          <ArrowLeft size={16} />
          <span>My Orders</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-surface-border text-xs">
          <Radio size={12} className={socketConnected ? 'text-brand animate-pulse' : 'text-text-disabled'} />
          <span className={socketConnected ? 'text-brand font-medium' : 'text-text-disabled'}>
            {socketConnected ? 'Live Kitchen Stream' : 'Connecting'}
          </span>
        </div>
      </div>

      {/* Header Card */}
      <div className="card p-5 border border-surface-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-surface-border">
          <div>
            <h1 id="order-id" data-testid="order-id" className="text-xl font-bold text-text-primary">
              Order #{order.id}
            </h1>
            <p id="order-time" data-testid="order-time" className="text-xs text-text-muted">
              Placed on {new Date(order.createdAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              id="order-status"
              data-testid="order-status"
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
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
              Status: {order.status.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand/10 text-brand border border-brand/30">
              Table {order.tableNumber}
            </span>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div>
            <Link
              to={`/app/restaurants/${order.restaurantId}`}
              id="order-restaurant-name"
              data-testid="order-restaurant-name"
              className="font-bold text-sm text-text-primary hover:text-brand"
            >
              {order.restaurantName}
            </Link>
            <p className="text-text-muted flex items-center gap-1 mt-0.5">
              <MapPin size={12} className="text-brand shrink-0" />
              <span>{order.restaurantAddress}</span>
            </p>
          </div>

          {order.restaurantPhone && (
            <a
              href={`tel:${order.restaurantPhone}`}
              className="btn-outline btn-sm text-xs inline-flex items-center gap-1"
            >
              <Phone size={12} />
              <span>Call</span>
            </a>
          )}
        </div>
      </div>

      {/* Visual Live Tracker */}
      <div className="card p-6 border border-surface-border space-y-6">
        <h2 className="font-bold text-sm text-text-primary uppercase tracking-wide text-center">
          {isCancelled ? 'Order Cancelled' : 'Live Order Progress'}
        </h2>

        {isCancelled ? (
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-center space-y-2">
            <XCircle size={32} className="text-red-400 mx-auto" />
            <h3 className="font-bold text-base text-red-200">This order was cancelled</h3>
            <p className="text-xs text-text-secondary">
              The kitchen stopped preparation. You can place a new order anytime.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Step lines */}
            <div className="grid grid-cols-4 gap-2 text-center relative z-10">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-brand text-surface-bg ring-4 ring-brand/20 font-bold scale-110 shadow-lg'
                          : isPassed
                          ? 'bg-status-available text-white'
                          : 'bg-surface-elevated text-text-disabled'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          isCurrent
                            ? 'text-brand'
                            : isPassed
                            ? 'text-text-primary'
                            : 'text-text-disabled'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px] text-text-muted hidden sm:block">
                        {step.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancel Button if status is received */}
        {order.status === 'received' && (
          <div className="text-center pt-2">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn-outline text-xs py-2 px-4 border-red-500/40 text-red-400 hover:bg-red-500/10 inline-flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
            </button>
            <p className="text-[10px] text-text-muted mt-1">
              Cancellation is only permitted before the kitchen starts cooking.
            </p>
          </div>
        )}
      </div>

      {/* Bill & Items Breakdown */}
      <div className="card p-5 border border-surface-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h2 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <FileText size={16} className="text-brand" />
            <span>Order Summary ({order.itemCount} items)</span>
          </h2>
        </div>

        <div id="order-items-list" data-testid="order-items-list" className="divide-y divide-surface-border/60">
          {order.items?.map((item) => (
            <div key={item.id} data-testid={`order-item-${item.id}`} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-medium text-text-primary">
                  {item.quantity} × {item.name}
                </span>
                <span className="text-[10px] text-text-muted block">
                  ₹{item.unitPrice.toFixed(2)} each
                </span>
              </div>
              <span className="font-mono font-semibold text-text-primary">
                ₹{item.lineTotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {order.specialNote && (
          <div className="p-3 rounded-lg bg-surface-elevated/40 text-xs text-text-secondary italic">
            <strong>Kitchen Note:</strong> "{order.specialNote}"
          </div>
        )}

        {/* Pricing calculations */}
        <div className="pt-3 border-t border-surface-border space-y-1.5 text-xs">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Restaurant GST (5%)</span>
            <span className="font-mono">₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-text-primary pt-2 border-t border-surface-border">
            <span>Grand Total</span>
            <span id="order-total" data-testid="order-total" className="text-brand font-mono text-base">₹{order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

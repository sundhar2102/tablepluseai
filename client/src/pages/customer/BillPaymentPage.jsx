import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Share2,
  Sparkles,
  ShieldCheck,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { orderService } from '../../services/orderService';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import toast from 'react-hot-toast';

export default function BillPaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment UI state
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'cash'
  const [processing, setProcessing] = useState(false);
  const [paid, setPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderById(orderId);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to load bill order', err);
      setError(err.response?.data?.error?.message || 'Order or bill could not be found');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      setProcessing(false);
      setPaid(true);
      const ref = `TP-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
      setPaymentRef(ref);
      toast.success('Demonstration payment completed successfully!');
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingState message="Generating digital bill..." fullPage />;
  }

  if (error || !order) {
    return (
      <div className="page-container py-10 max-w-lg mx-auto">
        <ErrorState
          title="Bill Unavailable"
          message={error || 'We were unable to retrieve the bill for this order.'}
          backUrl="/app/orders"
          onRetry={fetchOrder}
        />
      </div>
    );
  }

  return (
    <div className="page-container py-6 space-y-6 max-w-xl mx-auto animate-fade-in">
      <PageHeader
        title={`Bill & Payment — #${order.orderNumber}`}
        subtitle={`Order created on ${new Date(order.createdAt).toLocaleString()}`}
        backUrl={`/app/orders/${order.id}`}
        badge={
          paid ? (
            <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 text-[11px] font-semibold">
              <CheckCircle2 size={12} />
              <span>PAID (DEMO)</span>
            </span>
          ) : (
            <span className="badge bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
              PAYMENT DUE
            </span>
          )
        }
      />

      {/* Bill Container */}
      <div className="card p-5 border border-surface-border space-y-5 print:border-none print:shadow-none">
        {/* Restaurant & Table Info */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div>
            <h2 className="font-bold text-base text-text-primary">
              {order.restaurant?.name || 'TablePulse Partner'}
            </h2>
            <p className="text-xs text-text-secondary">
              Table {order.table?.tableNumber || 'Self-Order'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-text-muted block">
              Bill Ref: #{order.id}
            </span>
            <span className="text-[11px] text-text-muted">
              Status: {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Itemized list */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Itemized Consumption
          </h3>
          <div className="divide-y divide-surface-border/50 text-xs">
            {order.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-medium text-text-primary block">
                    {item.quantity} × {item.name}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    ₹{item.unitPrice.toFixed(2)} each
                  </span>
                </div>
                <span className="font-mono font-semibold text-text-primary">
                  ₹{item.lineTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="pt-3 border-t border-surface-border space-y-2 text-xs">
          <div className="flex justify-between text-text-secondary">
            <span>Items Subtotal</span>
            <span className="font-mono font-medium">₹{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Restaurant GST (5%)</span>
            <span className="font-mono font-medium">₹{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-extrabold text-text-primary pt-2 border-t border-surface-border">
            <span>Grand Total Due</span>
            <span className="text-brand font-mono text-lg font-black">
              ₹{order.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Simulation Notice */}
        <div className="p-3 rounded-xl bg-surface-elevated/60 border border-surface-border flex items-start gap-2.5 text-[11px] text-text-secondary">
          <ShieldCheck size={16} className="text-brand shrink-0 mt-0.5" />
          <p>
            <strong>Stage 3 Payment Notice:</strong> Real financial payments are not connected. This screen provides an authentic checkout simulation flow for college examination demonstration.
          </p>
        </div>

        {/* Payment Actions / Receipt */}
        {paid ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-text-primary">
                Payment Settled Successfully
              </h4>
              <p className="text-xs text-text-secondary font-mono">
                Transaction ID: {paymentRef}
              </p>
              <p className="text-[11px] text-text-muted">
                Method: {paymentMethod.toUpperCase()} | Thank you for dining with TablePulse!
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-outline text-xs py-2 px-3 inline-flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Print Receipt</span>
              </button>
              <Link
                to="/app/orders"
                className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1.5"
              >
                <span>Back to Orders</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSimulatePayment} className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
              Choose Payment Method
            </h3>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-brand bg-brand/10 text-brand shadow-sm shadow-brand/10'
                    : 'border-surface-border bg-surface-elevated/40 text-text-secondary hover:text-text-primary'
                }`}
              >
                <QrCode size={20} />
                <span className="text-xs font-bold">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  paymentMethod === 'card'
                    ? 'border-brand bg-brand/10 text-brand shadow-sm shadow-brand/10'
                    : 'border-surface-border bg-surface-elevated/40 text-text-secondary hover:text-text-primary'
                }`}
              >
                <CreditCard size={20} />
                <span className="text-xs font-bold">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-brand bg-brand/10 text-brand shadow-sm shadow-brand/10'
                    : 'border-surface-border bg-surface-elevated/40 text-text-secondary hover:text-text-primary'
                }`}
              >
                <Banknote size={20} />
                <span className="text-xs font-bold">Cash at Table</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={processing}
              className="btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing Demo Payment...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Pay ₹{order.total.toFixed(2)} (Demonstration)</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

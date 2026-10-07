import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  Clock,
} from 'lucide-react';
import { menuService } from '../../services/menuService';
import { tableService } from '../../services/tableService';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function DigitalMenuModal({
  restaurant,
  table: initialTable = null,
  isOpen,
  onClose,
}) {
  const navigate = useNavigate();
  const {
    cart,
    addToCart,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    tax,
    total,
  } = useCart();

  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // Table selection & notes
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(initialTable?.id || '');
  const [specialNote, setSpecialNote] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Load menu items and restaurant tables
  useEffect(() => {
    if (!isOpen || !restaurant?.id) return;

    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [menuRes, tablesRes] = await Promise.all([
          menuService.getMenu(restaurant.id),
          tableService.getRestaurantTables(restaurant.id),
        ]);

        if (mounted) {
          setCategories(menuRes.data.categories || []);
          setAllItems(menuRes.data.allItems || []);
          setTables(tablesRes.data || []);
          if (initialTable?.id) {
            setSelectedTableId(initialTable.id);
          } else if (tablesRes.data?.length > 0 && !selectedTableId) {
            setSelectedTableId(tablesRes.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load digital menu', err);
        if (mounted) {
          setError(err.response?.data?.error?.message || 'Failed to load menu');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [isOpen, restaurant?.id, initialTable]);

  if (!isOpen) return null;

  // Filter items
  const filteredItems = allItems.filter((item) => {
    if (activeCategory !== 'all' && item.category_id !== Number(activeCategory)) {
      return false;
    }
    if (vegOnly && !item.is_vegetarian) {
      return false;
    }
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Check item quantity in current cart
  const getItemQty = (itemId) => {
    const found = cart.items.find((i) => i.id === itemId);
    return found ? found.quantity : 0;
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        restaurantId: Number(restaurant.id),
        tableId: selectedTableId ? Number(selectedTableId) : (tables.length > 0 ? Number(tables[0].id) : undefined),
        items: cart.items.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
        })),
        specialNote: specialNote.trim() || undefined,
      };

      const res = await orderService.createOrder(payload);
      toast.success('Order placed successfully! Kitchen notified.');
      clearCart();
      onClose();
      navigate(`/app/orders/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden border border-surface-border shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated/50">
          <div>
            <h2 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <Utensils size={18} className="text-brand" />
              <span>{restaurant.name} — Digital Menu</span>
            </h2>
            <p className="text-xs text-text-muted">
              Browse chef specialties, customize your order, and send directly to kitchen
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-card hover:bg-surface-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* View toggle / Checkout Drawer if open */}
        {showCheckout ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <ShoppingBag size={18} className="text-brand" />
                <span>Confirm & Place Order ({itemCount} items)</span>
              </h3>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-xs text-brand hover:underline font-semibold"
              >
                ← Back to Menu
              </button>
            </div>

            {/* Table Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                Select Your Dining Table <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="input w-full text-xs font-semibold"
              >
                <option value="">-- Choose Table --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.table_number} ({t.capacity} Seats) — {t.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-text-secondary block">Items in Cart:</span>
              <div className="divide-y divide-surface-border/60 bg-surface-elevated/30 rounded-lg p-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-text-primary block">{item.name}</span>
                      <span className="text-[10px] text-text-muted">₹{item.price.toFixed(2)} each</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-surface-border rounded-lg bg-surface-card">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1 text-text-secondary hover:text-text-primary"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 font-mono font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1 text-text-secondary hover:text-text-primary"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="font-mono font-bold text-xs w-16 text-right">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kitchen Special Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary block">
                Special Kitchen Instructions (Optional)
              </label>
              <input
                type="text"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="e.g. Less spicy, dressing on the side, allergic to peanuts"
                className="input w-full text-xs"
                maxLength={500}
              />
            </div>

            {/* Bill Summary */}
            <div className="card p-3 bg-surface-elevated/40 border border-surface-border space-y-1.5 text-xs">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>GST (5%)</span>
                <span className="font-mono">₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-text-primary pt-2 border-t border-surface-border">
                <span>Payable at Table</span>
                <span className="text-brand font-mono text-base">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder || cart.items.length === 0 || !selectedTableId}
                className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Check size={18} />
                <span>{placingOrder ? 'Sending to Kitchen...' : `Place Order (₹${total.toFixed(2)})`}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Search & Filter Bar */}
            <div className="p-3 border-b border-surface-border space-y-2 bg-surface-card">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-2.5 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes by name or ingredient..."
                    className="input w-full pl-9 py-1.5 text-xs"
                  />
                </div>

                <button
                  onClick={() => setVegOnly(!vegOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                    vegOnly
                      ? 'bg-status-available/15 border-status-available text-status-available'
                      : 'border-surface-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-status-available inline-block" />
                  <span>Veg Only</span>
                </button>
              </div>

              {/* Categories scrollable pill row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-brand text-surface-bg font-bold'
                      : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All Items ({allItems.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCategory(String(c.id))}
                    className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                      activeCategory === String(c.id)
                        ? 'bg-brand text-surface-bg font-bold'
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-surface-elevated rounded animate-pulse" />
                  ))}
                </div>
              )}

              {error && (
                <div className="text-center py-8 text-xs text-red-400">
                  <AlertCircle size={24} className="mx-auto mb-2 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {!loading && !error && filteredItems.length === 0 && (
                <div className="text-center py-10 text-text-muted text-xs">
                  No menu items matched your filter or search.
                </div>
              )}

              {!loading && !error && filteredItems.map((item) => {
                const qty = getItemQty(item.id);
                const isAvail = Boolean(item.is_available);
                const isVeg = Boolean(item.is_vegetarian);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      !isAvail
                        ? 'opacity-60 bg-surface-elevated/20 border-surface-border/60'
                        : 'bg-surface-card hover:border-brand/40 border-surface-border shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-text-primary leading-snug">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                isVeg
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                              title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            >
                              <span
                                className={`w-2 h-2 border flex items-center justify-center shrink-0 ${
                                  isVeg ? 'border-emerald-500' : 'border-rose-500'
                                }`}
                              >
                                <span
                                  className={`w-1 h-1 rounded-full ${
                                    isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                              </span>
                              <span>{isVeg ? 'Veg' : 'Non-Veg'}</span>
                            </span>

                            {item.category_name && (
                              <span className="text-[10px] text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded border border-surface-border/50 font-mono">
                                {item.category_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="font-mono font-bold text-sm text-brand shrink-0">
                          ₹{parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-text-muted mt-2 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-surface-border/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                            isAvail ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAvail ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {isAvail ? 'Available' : 'Sold Out'}
                        </span>

                        {item.preparation_time_mins && (
                          <span className="flex items-center gap-1 text-text-muted text-xs">
                            <Clock size={11} />
                            <span>{item.preparation_time_mins} min</span>
                          </span>
                        )}
                      </div>

                      <div>
                        {!isAvail ? (
                          <span className="text-[11px] font-semibold text-text-muted uppercase px-2 py-0.5 rounded bg-surface-elevated border border-surface-border/60">
                            Sold Out
                          </span>
                        ) : qty > 0 ? (
                          <div className="flex items-center border border-brand/50 rounded-lg bg-surface-elevated">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 text-brand hover:text-brand-light"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="px-2 font-mono font-bold text-xs text-brand">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 text-brand hover:text-brand-light"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item, restaurant, initialTable)}
                            className="px-3 py-1 rounded-lg bg-brand/10 hover:bg-brand text-brand hover:text-surface-bg text-xs font-bold border border-brand/30 transition-all inline-flex items-center gap-1"
                          >
                            <Plus size={12} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Cart Bar */}
            {itemCount > 0 && (
              <div className="p-3 bg-brand/10 border-t border-brand/30 flex items-center justify-between animate-slide-up">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} in Cart
                  </span>
                  <span className="text-sm font-extrabold text-brand font-mono">
                    ₹{total.toFixed(2)} <span className="text-[10px] text-text-muted">(with GST)</span>
                  </span>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <ShoppingBag size={14} />
                  <span>Review & Order</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

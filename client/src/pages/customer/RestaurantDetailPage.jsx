import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  Utensils,
  Radio,
  AlertCircle,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info,
  CalendarDays,
  Users,
  X,
  ExternalLink,
  Sparkles,
  Globe,
  Star,
  ShoppingBag,
  Plus,
  Minus,
  ChevronRight,
  Navigation,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { reservationService } from '../../services/reservationService';
import { queueService } from '../../services/queueService';
import { orderService } from '../../services/orderService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { CROWD_LEVELS } from '../../constants/tableStatus';
import TableGrid from '../../components/customer/TableGrid';
import DigitalMenuModal from '../../components/customer/DigitalMenuModal';
import toast from 'react-hot-toast';

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const { socket, connected: socketConnected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { coordinates } = useGeolocation();
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

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatedTableId, setUpdatedTableId] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Modals & Drawers
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [preOrderDrawerOpen, setPreOrderDrawerOpen] = useState(false);

  // Unregistered Feature Explanation Modal
  const [featureModal, setFeatureModal] = useState({
    isOpen: false,
    title: '',
    feature: '',
    description: '',
  });

  // Partner Request State
  const [hasRequested, setHasRequested] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Submission states
  const [submittingReservation, setSubmittingReservation] = useState(false);
  const [submittingQueue, setSubmittingQueue] = useState(false);
  const [submittingPreOrder, setSubmittingPreOrder] = useState(false);

  // Reservation form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [resDate, setResDate] = useState(todayStr);
  const [resTime, setResTime] = useState('19:00');
  const [resPartySize, setResPartySize] = useState(2);
  const [resNote, setResNote] = useState('');

  // Queue form state
  const [queuePartySize, setQueuePartySize] = useState(2);

  // Pre-Order form state
  const [preOrderNote, setPreOrderNote] = useState('');
  const [selectedTableForOrder, setSelectedTableForOrder] = useState('');

  // Menu active category tab
  const [activeMenuCategory, setActiveMenuCategory] = useState('all');

  // Fetch restaurant details
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (coordinates?.latitude && coordinates?.longitude) {
      params.lat = coordinates.latitude;
      params.lng = coordinates.longitude;
    }
    const { data, error: apiErr } = await restaurantService.getRestaurantById(id, params);
    setLoading(false);

    if (apiErr) {
      setError(apiErr.message || 'Restaurant not found');
    } else {
      setRestaurant(data);
    }
  }, [id, coordinates]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Handle direct action triggers (e.g. ?action=reserve, ?action=queue, ?action=order)
  useEffect(() => {
    if (!restaurant) return;
    const query = new URLSearchParams(location.search);
    const action = query.get('action');
    if (action === 'reserve') {
      setReserveModalOpen(true);
    } else if (action === 'queue') {
      setQueueModalOpen(true);
    } else if (action === 'order') {
      const el = document.getElementById('restaurant-menu-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.search, restaurant]);

  // Real-time Socket.IO availability subscription (ONLY for verified TablePulse restaurants)
  useEffect(() => {
    if (!socket || !restaurant?.id) return;
    if (restaurant.tablepulse_registered === false) return;

    socket.emit('join:restaurant', restaurant.id);
    socket.emit('joinRestaurant', restaurant.id);

    const handleAvailabilityUpdate = (payload) => {
      if (Number(payload.restaurantId) === Number(restaurant.id)) {
        toast('Live table update received! ⚡', {
          icon: '🪑',
          style: { background: '#1A1E2E', color: '#00C2A8' },
        });

        if (payload.tableId) {
          setUpdatedTableId(payload.tableId);
          setTimeout(() => setUpdatedTableId(null), 3000);
        }

        setRestaurant((prev) => {
          if (!prev) return prev;
          const updatedTables = (prev.tables || []).map((t) => {
            if (t.id === payload.tableId) {
              return { ...t, status: payload.newStatus, statusChangedAt: payload.updatedAt };
            }
            return t;
          });

          return {
            ...prev,
            tables: updatedTables,
            tableAvailability: payload.tableAvailability || prev.tableAvailability,
            crowdLevel: payload.crowdLevel || prev.crowdLevel,
            estimatedWaitMinutes: payload.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
            waitEstimation: payload.waitEstimation || prev.waitEstimation,
          };
        });
      }
    };

    const handleMenuUpdate = (payload) => {
      if (Number(payload?.restaurantId) === Number(restaurant.id)) {
        fetchDetails();
      }
    };

    const handleItemAvailability = (payload) => {
      if (Number(payload?.restaurantId) === Number(restaurant.id)) {
        setRestaurant((prev) => {
          if (!prev) return prev;
          const updatedCategories = (prev.menuCategories || []).map((cat) => ({
            ...cat,
            items: (cat.items || []).map((item) =>
              item.id === payload.itemId
                ? { ...item, is_available: payload.isAvailable ? 1 : 0 }
                : item
            ),
          }));
          return {
            ...prev,
            menuCategories: updatedCategories,
          };
        });
      }
    };

    socket.on('restaurant:availability_updated', handleAvailabilityUpdate);
    socket.on('menu:updated', handleMenuUpdate);
    socket.on('item:availability_changed', handleItemAvailability);

    return () => {
      socket.emit('leave:restaurant', restaurant.id);
      socket.emit('leaveRestaurant', restaurant.id);
      socket.off('restaurant:availability_updated', handleAvailabilityUpdate);
      socket.off('menu:updated', handleMenuUpdate);
      socket.off('item:availability_changed', handleItemAvailability);
    };
  }, [socket, restaurant?.id, restaurant?.tablepulse_registered, fetchDetails]);

  // Compute exact distance from device location if real coordinates available (never fake)
  const computedDistance = useMemo(() => {
    if (restaurant?.distanceKm !== null && restaurant?.distanceKm !== undefined) {
      return `${restaurant.distanceKm} km`;
    }
    if (coordinates?.latitude && coordinates?.longitude && restaurant?.latitude && restaurant?.longitude) {
      const R = 6371;
      const dLat = (restaurant.latitude - coordinates.latitude) * (Math.PI / 180);
      const dLon = (restaurant.longitude - coordinates.longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coordinates.latitude * (Math.PI / 180)) *
          Math.cos(restaurant.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c * 10) / 10;
      return `${dist} km`;
    }
    return null;
  }, [restaurant, coordinates]);

  // Check item quantity in cart
  const getItemQty = (itemId) => {
    if (!cart.items || cart.restaurant?.id !== restaurant?.id) return 0;
    const found = cart.items.find((i) => i.id === itemId);
    return found ? found.quantity : 0;
  };

  const isTablePulseRegistered =
    restaurant?.tablepulse_registered === true && restaurant?.operational_data_available === true;

  // ── Button Action Handlers ──────────────────────────────────────────
  const handleViewMenu = () => {
    const el = document.getElementById('restaurant-menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (isTablePulseRegistered) {
      setMenuModalOpen(true);
    } else {
      toast('Digital menu is not published on TablePulse yet.', { icon: '📖' });
    }
  };

  const handlePreOrderClick = () => {
    if (isTablePulseRegistered) {
      if (cart.items.length > 0 && cart.restaurant?.id === restaurant?.id) {
        setPreOrderDrawerOpen(true);
      } else {
        const el = document.getElementById('restaurant-menu-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          toast('Select your favorite dishes from the menu below to pre-order!', { icon: '🍽️' });
        } else {
          setMenuModalOpen(true);
        }
      }
    } else {
      setFeatureModal({
        isOpen: true,
        title: 'Online Pre-Ordering Unavailable',
        feature: 'Kitchen Pre-Ordering',
        description:
          'In-app food pre-ordering and kitchen ticketing require TablePulse partner integration. Because this restaurant was discovered via OpenStreetMap and has not yet onboarded with TablePulse, online ordering is not currently enabled.',
      });
    }
  };

  const handleReserveClick = () => {
    if (isTablePulseRegistered) {
      setReserveModalOpen(true);
    } else {
      setFeatureModal({
        isOpen: true,
        title: 'Table Reservation Unavailable',
        feature: 'Guaranteed Reservations',
        description:
          'Live table reservations require verified seating floor plans in the TablePulse system. Once this dining establishment joins TablePulse, you will be able to book guaranteed tables in advance.',
      });
    }
  };

  const handleQueueClick = () => {
    if (isTablePulseRegistered) {
      setQueueModalOpen(true);
    } else {
      setFeatureModal({
        isOpen: true,
        title: 'Live Waitlist Unavailable',
        feature: 'Contactless Walk-In Queue',
        description:
          'Real-time queue tracking and contactless waitlists require active host stand connectivity. Once this restaurant joins TablePulse, you will be able to join the queue remotely.',
      });
    }
  };

  const handleRequestRestaurant = () => {
    setHasRequested(true);
    toast.success('Thank you! We have registered your request to bring this restaurant onto TablePulse.', {
      duration: 4000,
      icon: '🎉',
    });
  };

  const handleCopyAddress = () => {
    if (restaurant?.address) {
      navigator.clipboard?.writeText(restaurant.address);
      setCopiedAddress(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopiedAddress(false), 3000);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: restaurant?.name || 'TablePulse Restaurant',
        text: `Check out ${restaurant?.name} on TablePulse AI!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const getDirectionsUrl = () => {
    if (restaurant?.latitude && restaurant?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
    }
    if (restaurant?.address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant?.name || 'Restaurant')}`;
  };

  // Pre-Order Submit
  const handlePreOrderSubmit = async (e) => {
    e?.preventDefault();
    if (cart.items.length === 0) {
      toast.error('Your pre-order cart is empty. Please add items from the menu.');
      return;
    }

    try {
      setSubmittingPreOrder(true);
      const payload = {
        restaurantId: Number(restaurant.id),
        tableId: selectedTableForOrder ? Number(selectedTableForOrder) : undefined,
        items: cart.items.map((i) => ({
          menuItemId: i.id,
          quantity: i.quantity,
        })),
        specialNote: preOrderNote.trim() || 'Customer Pre-Order',
      };

      const res = await orderService.createOrder(payload);
      toast.success('Pre-order created successfully! Kitchen notified.');
      clearCart();
      setPreOrderDrawerOpen(false);
      navigate(`/app/orders/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place pre-order');
    } finally {
      setSubmittingPreOrder(false);
    }
  };

  // Reservation Submit
  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!resDate || !resTime || !resPartySize) {
      toast.error('Please fill in all required reservation fields');
      return;
    }
    setSubmittingReservation(true);
    const { data, error: err } = await reservationService.createReservation({
      restaurantId: Number(restaurant.id),
      reservationDate: resDate,
      reservationTime: resTime,
      partySize: Number(resPartySize),
      specialNote: resNote.trim() || undefined,
    });
    setSubmittingReservation(false);

    if (err) {
      toast.error(err.message || 'Failed to create reservation');
    } else {
      toast.success('Table reserved successfully!');
      setReserveModalOpen(false);
      navigate(`/app/bookings/${data.id}`);
    }
  };

  // Queue Submit
  const handleQueueSubmit = async (e) => {
    e.preventDefault();
    if (!queuePartySize || queuePartySize < 1) {
      toast.error('Please enter a valid party size');
      return;
    }
    setSubmittingQueue(true);
    const { data, error: err } = await queueService.joinQueue({
      restaurantId: Number(restaurant.id),
      partySize: Number(queuePartySize),
    });
    setSubmittingQueue(false);

    if (err) {
      toast.error(err.message || 'Failed to join walk-in queue');
    } else {
      toast.success('Joined walk-in waitlist!');
      setQueueModalOpen(false);
      navigate(`/app/queue/${restaurant.id}`);
    }
  };

  // Staff simulation tool (TablePulse operational verification)
  const handleSimulateStatus = async (tableId, newStatus) => {
    setSimulating(true);
    const { error: err } = await restaurantService.updateTableStatus(restaurant.id, tableId, newStatus);
    setSimulating(false);
    if (err) {
      toast.error(err.message || 'Simulation requires staff permission');
    }
  };

  // ── Loading State ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container py-16 flex flex-col items-center justify-center space-y-4">
        <div className="spinner w-10 h-10 border-[3px]" />
        <p className="text-xs text-text-secondary font-medium animate-pulse">
          Loading restaurant details & discovery data...
        </p>
      </div>
    );
  }

  // ── Error / Not Found State ────────────────────────────────────────
  if (error || !restaurant) {
    return (
      <div className="page-container py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-status-occupied/10 border border-status-occupied/30 text-status-occupied flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Restaurant Unavailable</h2>
        <p className="text-sm text-text-secondary leading-relaxed">
          {error || 'This dining spot could not be found or has an invalid identifier.'}
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/app')}
            className="btn-primary btn-sm inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={16} />
            <span>Back to Discovery</span>
          </button>
        </div>
      </div>
    );
  }

  const crowdConfig = CROWD_LEVELS[restaurant.crowdLevel] || CROWD_LEVELS.LOW;
  const avail = restaurant.tableAvailability || {};

  // Determine open/closed status badge
  let statusBadgeColor = 'bg-red-500/90 text-white';
  let statusBadgeText = 'Closed';
  let statusDotColor = 'bg-white/60';

  if (restaurant.openStatus === 'OPEN' || (restaurant.isOpen === true && restaurant.openStatus !== 'HOURS_UNKNOWN')) {
    statusBadgeColor = 'bg-emerald-600/90 text-white';
    statusBadgeText = 'Open Now';
    statusDotColor = 'bg-white animate-pulse';
  } else if (restaurant.openStatus === 'HOURS_UNKNOWN' || restaurant.isOpen === null || restaurant.isOpen === undefined) {
    statusBadgeColor = 'bg-slate-700/90 text-slate-200 border border-slate-600/50';
    statusBadgeText = 'Hours Not Published';
    statusDotColor = 'bg-slate-400';
  }

  // Categories & menu items
  const menuCategories = restaurant.menu?.categories || [];
  const allMenuItems = restaurant.menu?.allItems || [];

  const filteredMenuItems =
    activeMenuCategory === 'all'
      ? allMenuItems
      : allMenuItems.filter((it) => it.category_id === Number(activeMenuCategory));

  return (
    <div className="page-container py-6 space-y-6 animate-fade-in pb-28">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand transition-colors py-1 px-2 rounded-lg hover:bg-surface-elevated"
        >
          <ArrowLeft size={16} />
          <span>Back to Restaurants</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-brand/30 text-xs">
            <Radio size={12} className={socketConnected ? 'text-brand animate-pulse' : 'text-text-disabled'} />
            <span className={socketConnected ? 'text-brand font-bold' : 'text-text-disabled'}>
              {socketConnected ? 'Real-time Live Sync Active' : 'Connecting Real-time...'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-surface-card border border-surface-border text-text-secondary hover:text-brand transition-colors"
            title="Share Restaurant"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ── 1. Restaurant Hero Card ───────────────────────────────────── */}
      <div className="card overflow-hidden p-0 border border-surface-border shadow-xl">
        {/* Cover Photo with Visual Overlay */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-surface-elevated">
          <img
            src={
              restaurant.coverPhotoUrl ||
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-surface-card/60 to-transparent" />

          {/* Badges on Top Cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between flex-wrap gap-2 pointer-events-none">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-md ${statusBadgeColor}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
              {statusBadgeText}
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-brand text-surface-bg backdrop-blur-md shadow-md">
                <Sparkles size={12} />
                TablePulse Verified Restaurant
              </span>

              {/* Distance from device location (never fake) */}
              {computedDistance && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-surface-card/90 text-text-primary backdrop-blur-md border border-surface-border shadow-sm">
                  <MapPin size={13} className="text-brand" />
                  {computedDistance} away
                </span>
              )}
            </div>
          </div>

          {/* Title & Info on Bottom of Cover */}
          <div className="absolute bottom-4 left-4 right-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* Cuisine Tag */}
              <span className="text-xs uppercase tracking-wider font-bold text-brand bg-surface-card/90 px-3 py-1 rounded-md backdrop-blur-sm border border-brand/30 shadow-sm">
                {restaurant.cuisineType || restaurant.cuisine || 'Cuisine not specified'}
              </span>

              {/* Rating & Reviews Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-card/90 backdrop-blur-sm text-xs border border-surface-border shadow-sm">
                <Star size={13} className={restaurant.rating ? 'fill-amber-400 text-amber-400 shrink-0' : 'text-text-muted shrink-0'} />
                <span className="font-extrabold text-amber-300">
                  {restaurant.rating ? Number(restaurant.rating).toFixed(1) : 'Unrated'}
                </span>
                <span className="text-text-muted">
                  {restaurant.reviews ? `(${restaurant.reviews} reviews)` : '(No ratings yet)'}
                </span>
              </div>
            </div>

            {/* Restaurant Name */}
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
              {restaurant.name}
            </h1>
          </div>
        </div>

        {/* Hero Details Body: Address, Area, Hours, Phone */}
        <div className="p-4 md:p-6 space-y-4 bg-surface-card">
          <p className="text-sm text-text-secondary leading-relaxed">
            {restaurant.description || 'Real-world dining spot discovered through OpenStreetMap.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-surface-border text-xs">
            {/* Address */}
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-brand shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-text-primary block truncate">Address</span>
                <span className="text-text-muted text-[11px] block mt-0.5 line-clamp-2">
                  {restaurant.address || 'Address details in OpenStreetMap'}
                </span>
                {restaurant.area && (
                  <span className="text-brand text-[10px] font-semibold block mt-0.5">
                    Area: {restaurant.area}
                  </span>
                )}
              </div>
            </div>

            {/* Operating Hours */}
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-brand shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-text-primary block">Operating Hours</span>
                <span className="text-text-secondary text-[11px] block mt-0.5">
                  {restaurant.todayHours || restaurant.openingHours || 'Hours not published'}
                </span>
              </div>
            </div>

            {/* Contact Phone */}
            <div className="flex items-start gap-2.5">
              <Phone size={16} className="text-brand shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-text-primary block">Phone</span>
                {restaurant.phone ? (
                  <a href={`tel:${restaurant.phone}`} className="text-brand hover:underline font-medium text-[11px] block mt-0.5 truncate">
                    {restaurant.phone}
                  </a>
                ) : (
                  <span className="text-text-muted text-[11px] block mt-0.5">Not available</span>
                )}
              </div>
            </div>

            {/* Navigation / Reference */}
            <div className="flex items-start gap-2.5">
              <Navigation size={16} className="text-brand shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-text-primary block">Directions & Map</span>
                <a
                  href={getDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline text-[11px] font-semibold inline-flex items-center gap-1 mt-0.5"
                >
                  Get Directions <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. The 4 Primary Customer Action Buttons ──────────────────── */}
      <div className="card p-4 border border-surface-border bg-surface-elevated/40 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Button 1: [View Menu] */}
          <button
            id="btn-view-menu"
            type="button"
            onClick={handleViewMenu}
            className="py-3 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold bg-brand hover:bg-brand-light text-surface-bg shadow-md rounded-xl transition-all"
          >
            <Utensils size={16} />
            <span>View Menu</span>
          </button>

          {/* Button 2: [Reserve Table] */}
          <button
            id="btn-reserve-table"
            type="button"
            onClick={handleReserveClick}
            className="py-3 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl transition-all border border-brand text-brand hover:bg-brand/10 bg-brand/5 shadow-sm"
          >
            <CalendarDays size={16} className="text-brand" />
            <span>Reserve Table</span>
          </button>

          {/* Button 3: [Join Queue] */}
          <button
            id="btn-join-queue"
            type="button"
            onClick={handleQueueClick}
            className="py-3 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl transition-all border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 bg-amber-500/5 shadow-sm"
          >
            <Users size={16} className="text-amber-400" />
            <span>Join Queue</span>
          </button>

          {/* Button 4: [Order Food] */}
          <button
            id="btn-order-food"
            type="button"
            onClick={handlePreOrderClick}
            className="py-3 px-3 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <ShoppingBag size={16} />
            <span>Order Food</span>
          </button>
        </div>
      </div>

      {/* ── 3. Operational Section: Registered TablePulse vs Discovery-Only State ── */}
      {isTablePulseRegistered ? (
        /* ═══════════════════════════════════════════════════════════════
           TABLEPULSE REGISTERED RESTAURANT: FULL OPERATIONAL EXPERIENCE
           ═══════════════════════════════════════════════════════════════ */
        <>
          {/* Live Operational Metrics Card */}
          <div className="card p-5 border-2 border-brand/30 bg-surface-elevated/70 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-brand block mb-1">
                  Live Status Overview
                </span>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <span className="text-lg">⚡</span> Current Crowd & Estimated Free Table Wait Time
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Real-time operational metrics calculated directly from active dining tables at {restaurant.name}.
                </p>
              </div>

              {/* Live Crowd Level */}
              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-bold text-xs self-start sm:self-auto border ${
                  restaurant.crowdLevel === 'LOW'
                    ? 'bg-status-available/15 text-status-available border-status-available/40'
                    : restaurant.crowdLevel === 'MODERATE'
                    ? 'bg-status-reserved/15 text-status-reserved border-status-reserved/40'
                    : restaurant.crowdLevel === 'HIGH'
                    ? 'bg-status-occupied/15 text-status-occupied border-status-occupied/40'
                    : 'bg-red-950/40 text-red-400 border-red-500/40'
                }`}
              >
                <span>{crowdConfig.icon}</span>
                <span>Crowd Level: {crowdConfig.label}</span>
              </div>
            </div>

            {/* Clear Banner if No Table Available */}
            {avail.availableTables === 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
                <Clock size={18} className="shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-amber-200 block">
                    No Table Currently Free — Estimated Wait: {restaurant.estimatedWaitMinutes || 15} minutes
                  </span>
                  <p className="text-amber-300/90 text-xs">
                    All tables are currently occupied or being cleaned. You can explore the menu below and pre-order your meal right now so it is served promptly when your table opens.
                  </p>
                </div>
              </div>
            )}

            {/* 4 Metric Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* Available Tables */}
              <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Available Tables
                </span>
                <span className="text-2xl font-extrabold text-status-available">
                  {avail.availableTables ?? 0}
                </span>
                <span className="text-[10px] text-text-muted block">of {avail.totalTables ?? 0} total</span>
              </div>

              {/* Occupied Tables */}
              <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Occupied Tables
                </span>
                <span className="text-2xl font-extrabold text-status-occupied">
                  {avail.occupiedTables ?? 0}
                </span>
                <span className="text-[10px] text-text-muted block">Dining now</span>
              </div>

              {/* Sanitizing / Cleaning */}
              <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Sanitizing / Cleaning
                </span>
                <span className="text-2xl font-extrabold text-status-cleaning">
                  {avail.cleaningTables ?? 0}
                </span>
                <span className="text-[10px] text-text-muted block">Fast turnaround</span>
              </div>

              {/* Estimated Waiting Time */}
              <div className="p-3 rounded-xl bg-surface-card border border-surface-border">
                <span className="text-[10px] uppercase font-bold text-text-muted block">
                  Estimated Waiting Time
                </span>
                <span
                  className={`text-2xl font-extrabold ${
                    restaurant.estimatedWaitMinutes === 0 ? 'text-brand' : 'text-status-reserved'
                  }`}
                >
                  {restaurant.estimatedWaitMinutes === 0 ? '0 mins' : `${restaurant.estimatedWaitMinutes} mins`}
                </span>
                <span className="text-[10px] text-text-muted block">Estimated wait</span>
              </div>
            </div>

            {/* Transparent Estimate Note */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-card/60 text-xs text-text-muted">
              <Info size={14} className="text-brand shrink-0" />
              <span>
                {restaurant.waitEstimation?.reason || 'Rule-based operational estimate based on live table availability.'}{' '}
                <strong className="text-text-secondary">Based on current occupancy.</strong>
              </span>
            </div>
          </div>

          {/* Live Table Status */}
          <div className="card space-y-4 border border-surface-border">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-brand block mb-1">
                  Floor Overview
                </span>
                <h3 className="font-bold text-base text-text-primary">
                  Live Table Status
                </h3>
                <p className="text-xs text-text-muted">
                  Current real-time status of all dining tables: Available (🟢), Occupied (🔴), Reserved (🟡), Cleaning (🟣).
                </p>
              </div>
              <button
                onClick={fetchDetails}
                className="btn-outline btn-sm text-xs inline-flex items-center gap-1"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Sync</span>
              </button>
            </div>

            <TableGrid tables={restaurant.tables || []} updatedTableId={updatedTableId} />
          </div>

          {/* Pre-order Menu While Waiting Section */}
          <div id="restaurant-menu-section" className="card space-y-5 border border-surface-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-brand block mb-1">
                  Waitlist Pre-Ordering
                </span>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Utensils size={20} className="text-brand" />
                  <span>Pre-order Menu While Waiting</span>
                </h2>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Prepare and select your food order while waiting for your table. When you take your seat, your order will be sent to the kitchen without delay!
                </p>
              </div>

              {/* Cart Quick Summary */}
              {itemCount > 0 && cart.restaurant?.id === restaurant.id && (
                <button
                  onClick={() => setPreOrderDrawerOpen(true)}
                  className="btn-primary btn-sm flex items-center gap-2 bg-brand text-surface-bg text-xs font-bold shadow-md"
                >
                  <ShoppingBag size={14} />
                  <span>
                    Cart: {itemCount} item(s) • ₹{total.toFixed(2)}
                  </span>
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {menuCategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setActiveMenuCategory('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeMenuCategory === 'all'
                      ? 'bg-brand text-surface-bg font-bold shadow-sm'
                      : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-surface-border'
                  }`}
                >
                  All Items ({allMenuItems.length})
                </button>
                {menuCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveMenuCategory(String(cat.id))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeMenuCategory === String(cat.id)
                        ? 'bg-brand text-surface-bg font-bold shadow-sm'
                        : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-surface-border'
                    }`}
                  >
                    {cat.name} ({cat.items?.length || 0})
                  </button>
                ))}
              </div>
            )}

            {/* Dishes Grid */}
            {filteredMenuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => {
                  const qty = getItemQty(item.id);
                  const isAvail = Boolean(item.is_available);
                  const isVeg = Boolean(item.is_vegetarian);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        !isAvail
                          ? 'bg-surface-elevated/30 border-surface-border/60 opacity-60'
                          : 'bg-surface-elevated/60 border-surface-border hover:border-brand/40 hover:bg-surface-elevated/80 shadow-sm'
                      }`}
                    >
                      {/* Top Header: Food Name & Price */}
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-base text-text-primary leading-snug">
                              {item.name}
                            </h4>
                            {/* Veg / Non-Veg Indicator Badge & Category */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  isVeg
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}
                                title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                              >
                                <span
                                  className={`w-2.5 h-2.5 border flex items-center justify-center shrink-0 ${
                                    isVeg ? 'border-emerald-500' : 'border-rose-500'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isVeg ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                  />
                                </span>
                                <span>{isVeg ? 'Veg' : 'Non-Veg'}</span>
                              </span>

                              {item.category_name && (
                                <span className="text-[11px] text-text-muted bg-surface-card px-2 py-0.5 rounded border border-surface-border/60 font-mono">
                                  {item.category_name}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="font-extrabold text-base text-brand shrink-0">
                            ₹{Number(item.price).toFixed(2)}
                          </span>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-text-secondary mt-2.5 leading-relaxed line-clamp-3">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Bottom Footer: Availability, Prep Time & Add/Quantity Actions */}
                      <div className="mt-4 pt-3 border-t border-surface-border/50 flex items-center justify-between gap-2">
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
                              <Clock size={12} className="text-text-muted" />
                              <span>{item.preparation_time_mins} min</span>
                            </span>
                          )}
                        </div>

                        {/* Add to Cart / Quantity controls */}
                        <div>
                          {!isAvail ? (
                            <span className="text-[11px] font-semibold text-text-muted uppercase px-2.5 py-1 rounded bg-surface-card border border-surface-border/60">
                              Unavailable
                            </span>
                          ) : qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                addToCart(item, restaurant);
                                toast.success(`Added ${item.name} to cart`);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-brand/10 hover:bg-brand text-brand hover:text-surface-bg text-xs font-bold border border-brand/30 transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Plus size={13} />
                              <span>Add</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-surface-card px-2 py-1 rounded-lg border border-brand/50 shadow-sm">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold text-brand px-1 min-w-[16px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                No menu items available in this category.
              </div>
            )}
          </div>

          {/* Weekly Hours */}
          {restaurant.weeklyHours && restaurant.weeklyHours.length > 0 && (
            <div className="card space-y-3 border border-surface-border">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Calendar size={16} className="text-brand" />
                <span>Weekly Operating Hours</span>
              </h3>
              <div className="divide-y divide-surface-border/60 text-xs">
                {restaurant.weeklyHours.map((day) => {
                  const isToday = day.dayOfWeek === new Date().getDay();
                  return (
                    <div
                      key={day.dayOfWeek}
                      className={`py-2 flex items-center justify-between ${
                        isToday ? 'font-bold text-brand' : 'text-text-secondary'
                      }`}
                    >
                      <span>
                        {day.dayName || day.day} {isToday && '(Today)'}
                      </span>
                      <span>{day.hours}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technical Verification Simulator (for viva/evaluation) */}
          {restaurant.tables && restaurant.tables.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-elevated/40 border border-dashed border-surface-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-muted">
                  🧪 Live Socket.IO Technical Verification Tool (Staff Simulator):
                </span>
                <span className="text-[10px] text-text-disabled">Live Sync</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Toggle table status to trigger backend event <code className="text-brand">restaurant:availability_updated</code> and observe real-time UI synchronization without page refresh.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {restaurant.tables.slice(0, 4).map((t) => (
                  <div key={t.id} className="flex items-center gap-1 bg-surface-card px-2 py-1 rounded border border-surface-border">
                    <span className="font-bold text-text-primary">{t.tableNumber}:</span>
                    <button
                      disabled={simulating}
                      onClick={() => handleSimulateStatus(t.id, 'available')}
                      className="px-1.5 py-0.5 rounded bg-status-available/20 text-status-available hover:bg-status-available/30"
                    >
                      Free
                    </button>
                    <button
                      disabled={simulating}
                      onClick={() => handleSimulateStatus(t.id, 'occupied')}
                      className="px-1.5 py-0.5 rounded bg-status-occupied/20 text-status-occupied hover:bg-status-occupied/30"
                    >
                      Occupy
                    </button>
                    <button
                      disabled={simulating}
                      onClick={() => handleSimulateStatus(t.id, 'cleaning')}
                      className="px-1.5 py-0.5 rounded bg-status-cleaning/20 text-status-cleaning hover:bg-status-cleaning/30"
                    >
                      Clean
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════════
           OSM-ONLY DISCOVERED RESTAURANT: POLISHED DISCOVERY STATE
           ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* ── Discovery Showcase Hero Banner ───────────────────────── */}
          <div className="card p-6 md:p-8 border border-brand/30 bg-gradient-to-br from-surface-elevated/90 via-surface-card to-surface-elevated/90 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-wider">
                <Globe size={13} />
                <span>Discovered Restaurant</span>
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-text-primary tracking-tight">
                Real-World Restaurant on TablePulse
              </h2>
              <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-2xl">
                This restaurant is discoverable on TablePulse through OpenStreetMap. Verified live operational capabilities (live table tracking, contactless queue, pre-ordering, and reservations) will activate when this restaurant joins the TablePulse partner network.
              </p>
            </div>

            {/* Feature Matrix Comparison (Available Now vs Coming with Partner Registration) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Column 1: Available Right Now */}
              <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary">
                    Available Now
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Real-world restaurant identity & verified location</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Operating hours when published by community</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Turn-by-turn directions via Google Maps</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Inspect OpenStreetMap node details & metadata</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-400 shrink-0" />
                    <span>Share venue link with friends & family</span>
                  </li>
                </ul>
              </div>

              {/* Column 2: Coming with TablePulse Registration */}
              <div className="p-4 rounded-xl bg-surface-elevated/60 border border-brand/20 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-surface-border/60">
                  <Sparkles size={14} className="text-brand shrink-0" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-brand">
                    Coming with TablePulse Registration
                  </h3>
                </div>
                <ul className="space-y-2 text-xs text-text-muted">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                    <span>Live table availability & seating layout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                    <span>Real-time crowd meter & density calculation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                    <span>Transparent wait-time estimation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                    <span>Guaranteed advance table reservations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                    <span>Contactless walk-in waitlist joining</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50 shrink-0" />
                    <span>Digital menu ordering & live order tracking</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Quick Action Buttons for Discovered Venue */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={getDirectionsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-2 shadow-md"
              >
                <Navigation size={14} />
                <span>Get Directions</span>
              </a>

              <a
                href={restaurant.sourceUrl || `https://www.openstreetmap.org/${restaurant.osm_id || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-2.5 px-4 text-xs font-semibold inline-flex items-center gap-2"
              >
                <Globe size={14} className="text-brand" />
                <span>View on OpenStreetMap</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={handleCopyAddress}
                className="btn-ghost py-2.5 px-3 text-xs font-semibold inline-flex items-center gap-1.5 border border-surface-border rounded-xl"
              >
                {copiedAddress ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedAddress ? 'Address Copied' : 'Copy Address'}</span>
              </button>

              <button
                type="button"
                onClick={handleRequestRestaurant}
                disabled={hasRequested}
                className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 ${
                  hasRequested
                    ? 'bg-brand/10 text-brand border border-brand/30 cursor-default'
                    : 'bg-gradient-to-r from-brand/20 to-brand/10 text-brand hover:bg-brand/20 border border-brand/40 shadow-sm'
                }`}
              >
                <Sparkles size={14} />
                <span>{hasRequested ? 'Requested! We Noted Your Interest' : 'Request this Restaurant on TablePulse'}</span>
              </button>
            </div>
          </div>

          {/* ── Location & Navigation Card ───────────────────────────── */}
          <div className="card p-5 border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border/60">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <MapPin size={18} className="text-brand" />
                <span>Location & Navigation</span>
              </h3>
              {restaurant.latitude && restaurant.longitude && (
                <span className="text-[11px] font-mono text-text-muted">
                  {Number(restaurant.latitude).toFixed(5)}, {Number(restaurant.longitude).toFixed(5)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <span className="font-semibold text-text-secondary block">Full Address:</span>
                <p className="text-text-primary bg-surface-elevated/40 p-3 rounded-xl border border-surface-border leading-relaxed">
                  {restaurant.address || 'Address details in OpenStreetMap record'}
                </p>
                {restaurant.area && (
                  <span className="text-text-muted block text-[11px]">
                    Neighborhood: <strong className="text-brand">{restaurant.area}</strong>
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-text-secondary block">Direct Navigation Links:</span>
                <div className="flex flex-col gap-2">
                  <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated border border-surface-border flex items-center justify-between text-text-primary font-medium hover:border-brand/40 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Navigation size={14} className="text-brand" />
                      <span>Open in Google Maps</span>
                    </span>
                    <ExternalLink size={12} className="text-text-muted" />
                  </a>

                  {restaurant.sourceUrl && (
                    <a
                      href={restaurant.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-surface-elevated/50 hover:bg-surface-elevated border border-surface-border flex items-center justify-between text-text-primary font-medium hover:border-brand/40 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Globe size={14} className="text-brand" />
                        <span>Open on OpenStreetMap.org</span>
                      </span>
                      <ExternalLink size={12} className="text-text-muted" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Digital Menu Section (Discovery State) ───────────────── */}
          <div id="restaurant-menu-section" className="card p-6 border border-surface-border text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-surface-border text-text-secondary flex items-center justify-center mx-auto">
              <Utensils size={22} className="text-brand" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                Digital Menu Not Yet Published
              </h3>
              <p className="text-xs text-text-muted mt-1 max-w-md mx-auto leading-relaxed">
                This restaurant was discovered via OpenStreetMap and has not yet onboarded its digital menu to TablePulse. Once registered, full menus, prices, and online ordering become available.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRequestRestaurant}
                disabled={hasRequested}
                className="btn-outline btn-sm text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                <span>{hasRequested ? 'Menu Requested' : 'Request Menu from Restaurant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TablePulse Operational Verified Platform Footer ─────────── */}
      <div className="card p-4 border border-surface-border/50 bg-surface-card/60 text-xs text-text-muted space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-brand" />
            <span>
              Verified Restaurant Status:{' '}
              <strong className="text-text-primary">TablePulse AI Registered Partner</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Database Connected
            </span>
            <span>•</span>
            <span className="text-text-muted">Real-Time Table State Active</span>
          </div>
        </div>
      </div>

      {/* ── Feature Explanation Modal for Discovered OSM Restaurants ─── */}
      {featureModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="card max-w-md w-full space-y-4 border border-surface-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Info className="text-brand" size={20} />
                <h3 className="font-bold text-base text-text-primary">{featureModal.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setFeatureModal({ ...featureModal, isOpen: false })}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-text-secondary">
              <div className="p-3 rounded-xl bg-surface-elevated/50 border border-surface-border space-y-1">
                <span className="font-semibold text-text-primary block">
                  {restaurant.name}
                </span>
                <span className="text-[11px] text-text-muted">
                  Discovered through OpenStreetMap • Not yet a TablePulse Partner
                </span>
              </div>

              <p>{featureModal.description}</p>

              <div className="p-3 rounded-xl bg-brand/5 border border-brand/20 text-brand text-[11px] flex items-start gap-2">
                <Sparkles size={14} className="shrink-0 mt-0.5" />
                <span>
                  Would you like to dine here with TablePulse? You can request this restaurant to help us onboard them faster!
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border/60">
              <button
                type="button"
                onClick={() => setFeatureModal({ ...featureModal, isOpen: false })}
                className="btn-ghost btn-sm text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRequestRestaurant();
                  setFeatureModal({ ...featureModal, isOpen: false });
                }}
                disabled={hasRequested}
                className="btn-primary btn-sm text-xs inline-flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                <span>{hasRequested ? 'Already Requested' : 'Request this Restaurant'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky Bottom Cart Bar (when dishes are in cart) ─────────── */}
      {itemCount > 0 && cart.restaurant?.id === restaurant.id && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-md border-t border-surface-border p-3 shadow-2xl animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                <ShoppingBag size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  {itemCount} item(s) selected
                </span>
                <span className="text-xs text-brand font-extrabold">
                  Total: ₹{total.toFixed(2)}{' '}
                  <span className="text-[10px] text-text-muted font-normal">(incl. 5% GST)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCart}
                className="btn-ghost btn-sm text-xs text-text-muted hover:text-status-occupied"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setPreOrderDrawerOpen(true)}
                className="btn-primary btn-sm px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-surface-bg font-extrabold text-xs shadow-lg inline-flex items-center gap-1.5"
              >
                <span>Review & Pre-Order</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-Order Review & Confirmation Modal / Drawer ───────────── */}
      {preOrderDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="card max-w-lg w-full space-y-4 border border-surface-border shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-amber-400" size={20} />
                <h3 className="font-bold text-base text-text-primary">Confirm Food Pre-Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreOrderDrawerOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="p-3 rounded-xl bg-surface-elevated/50 border border-surface-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-text-primary block">{restaurant.name}</span>
                  <span className="text-[11px] text-text-muted">{restaurant.address}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand/20 text-brand">
                  PRE-ORDER
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="font-bold text-text-secondary block">Selected Dishes:</span>
                <div className="divide-y divide-surface-border bg-surface-elevated/30 rounded-xl p-3">
                  {cart.items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-text-primary block">{item.name}</span>
                        <span className="text-[10px] text-text-muted">
                          ₹{item.price.toFixed(2)} × {item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="inline-flex items-center gap-1 bg-surface-card px-1.5 py-0.5 rounded border border-surface-border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-4 h-4 rounded flex items-center justify-center text-text-secondary hover:text-brand"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-[11px] font-bold text-brand px-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-4 h-4 rounded flex items-center justify-center text-text-secondary hover:text-brand"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table assignment (optional) */}
              {restaurant.tables && restaurant.tables.length > 0 && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-secondary block">
                    Dining Table (Optional)
                  </label>
                  <select
                    value={selectedTableForOrder}
                    onChange={(e) => setSelectedTableForOrder(e.target.value)}
                    className="input w-full text-xs font-semibold"
                  >
                    <option value="">Auto-assign best available table</option>
                    {restaurant.tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Table {t.tableNumber} ({t.capacity} Seats) — {t.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Special Note */}
              <div className="space-y-1.5">
                <label className="font-semibold text-text-secondary block">
                  Kitchen Notes / Pre-Order Instructions
                </label>
                <textarea
                  value={preOrderNote}
                  onChange={(e) => setPreOrderNote(e.target.value)}
                  placeholder="e.g., Less spicy, prepare for arrival in 20 minutes"
                  rows={2}
                  className="input text-xs w-full resize-none"
                />
              </div>

              {/* Price Breakdown */}
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border space-y-1 text-xs">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>GST (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-text-primary font-bold text-sm pt-1 border-t border-surface-border">
                  <span>Total Amount</span>
                  <span className="text-brand">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border/60">
              <button
                type="button"
                onClick={() => setPreOrderDrawerOpen(false)}
                className="btn-ghost btn-sm text-xs"
              >
                Back to Menu
              </button>
              <button
                type="button"
                disabled={submittingPreOrder || cart.items.length === 0}
                onClick={handlePreOrderSubmit}
                className="btn-primary btn-sm text-xs px-5 py-2 bg-amber-500 hover:bg-amber-400 text-surface-bg font-extrabold shadow-lg"
              >
                {submittingPreOrder ? 'Creating Pre-Order...' : 'Confirm & Send to Kitchen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reserve Table Modal (TablePulse Registered) ───────────────── */}
      {reserveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="card max-w-md w-full space-y-4 border border-surface-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="text-brand" size={20} />
                <h3 className="font-bold text-base text-text-primary">Reserve a Table</h3>
              </div>
              <button
                type="button"
                onClick={() => setReserveModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReserveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-text-secondary">Date</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-text-secondary">Time</label>
                  <input
                    type="time"
                    required
                    value={resTime}
                    onChange={(e) => setResTime(e.target.value)}
                    className="input text-xs w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-secondary">Number of Guests</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={resPartySize}
                  onChange={(e) => setResPartySize(e.target.value)}
                  className="input text-xs w-full"
                />
                <span className="text-[10px] text-text-muted">Parties up to 20 guests accommodated online.</span>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-secondary">Special Requests / Notes (Optional)</label>
                <textarea
                  value={resNote}
                  onChange={(e) => setResNote(e.target.value)}
                  placeholder="e.g., Anniversary, booth preference, booster seat"
                  rows={2}
                  className="input text-xs w-full resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border/50">
                <button
                  type="button"
                  onClick={() => setReserveModalOpen(false)}
                  className="btn-ghost btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReservation}
                  className="btn-primary btn-sm text-xs px-4"
                >
                  {submittingReservation ? 'Booking...' : 'Confirm Table Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Join Walk-In Queue Modal (TablePulse Registered) ──────────── */}
      {queueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fade-in">
          <div className="card max-w-md w-full space-y-4 border border-surface-border shadow-2xl">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Users className="text-brand" size={20} />
                <h3 className="font-bold text-base text-text-primary">Join Walk-In Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => setQueueModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQueueSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated/50 border border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Estimated Wait Time:</span>
                  <span className="font-bold text-brand">
                    ~{restaurant.estimatedWaitMinutes || 5} mins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Calculation Model:</span>
                  <span className="font-bold text-text-secondary">RULE_BASED (Operational)</span>
                </div>
                <p className="text-[11px] text-text-disabled">
                  Live queue positions update automatically as parties ahead are seated.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-text-secondary">Party Size (Number of People)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={queuePartySize}
                  onChange={(e) => setQueuePartySize(e.target.value)}
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border/50">
                <button
                  type="button"
                  onClick={() => setQueueModalOpen(false)}
                  className="btn-ghost btn-sm text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQueue}
                  className="btn-primary btn-sm text-xs px-4"
                >
                  {submittingQueue ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Digital Menu Modal (for full-screen digital menu browsing) ─── */}
      {restaurant && menuModalOpen && (
        <DigitalMenuModal
          restaurant={restaurant}
          isOpen={menuModalOpen}
          onClose={() => setMenuModalOpen(false)}
        />
      )}
    </div>
  );
}

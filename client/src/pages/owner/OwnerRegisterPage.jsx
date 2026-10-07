import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, Lock, Eye, EyeOff, MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SmartTableLogo from '../../components/common/SmartTableLogo';
import toast from 'react-hot-toast';

export default function OwnerRegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    restaurantName: '',
    city: 'Chennai',
    password: '',
    confirmPassword: '',
    role: 'owner',
    terms: true,
  });

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }
    if (!form.email) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (!form.restaurantName.trim()) {
      errs.restaurantName = 'Restaurant or brand name is required';
    }
    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!form.terms) {
      errs.terms = 'You must accept the Partner Merchant Agreement';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    const { data, error } = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      password: form.password,
      role: 'owner',
    });
    setLoading(false);

    if (error) {
      if (error.code === 'DUPLICATE_ERROR') {
        setErrors({ email: 'An account with this email already exists' });
      } else {
        toast.error(error.message || 'Owner registration failed');
      }
      return;
    }

    toast.success('Restaurant owner account registered! Sign in to access your portal.');
    navigate('/owner/login');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4 py-8">
      {/* Brand Header */}
      <div className="mb-6 text-center animate-fade-in flex flex-col items-center">
        <SmartTableLogo variant="full" size="md" subtitle="Restaurant Partner" />
        <h1 className="text-xl font-bold text-text-primary mt-2">Partner Registration</h1>
        <p className="text-text-secondary text-xs mt-0.5">
          Join Smart Table AI to manage live table occupancy and reservations
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md card p-6 border border-surface-border animate-slide-up space-y-4">
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 text-xs">
          {/* Owner Full Name */}
          <div className="space-y-1">
            <label className="input-label">Owner Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Vikram Malhotra"
                className={`input pl-10 text-xs w-full ${errors.name ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.name && <p className="input-error text-[11px]">{errors.name}</p>}
          </div>

          {/* Restaurant Business Name */}
          <div className="space-y-1">
            <label className="input-label">Restaurant / Establishment Name</label>
            <div className="relative">
              <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                type="text"
                name="restaurantName"
                value={form.restaurantName}
                onChange={handleChange}
                placeholder="e.g. Coastal Spice Kitchen"
                className={`input pl-10 text-xs w-full ${errors.restaurantName ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.restaurantName && <p className="input-error text-[11px]">{errors.restaurantName}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="input-label">Business Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="partner@restaurant.com"
                className={`input pl-10 text-xs w-full ${errors.email ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.email && <p className="input-error text-[11px]">{errors.email}</p>}
          </div>

          {/* Phone & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="input-label">Contact Phone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="input pl-10 text-xs w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="input-label">Operating City</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="input pl-10 text-xs w-full"
                >
                  <option value="Chennai">Chennai</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password & Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="input-label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 chars"
                  className={`input pl-10 pr-9 text-xs w-full ${errors.password ? 'border-status-occupied' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
                  aria-label="Toggle password"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="input-error text-[11px]">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
                <input
                  type={showPw ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className={`input pl-10 text-xs w-full ${errors.confirmPassword ? 'border-status-occupied' : ''}`}
                />
              </div>
              {errors.confirmPassword && <p className="input-error text-[11px]">{errors.confirmPassword}</p>}
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-1 pt-1">
            <label className="flex items-start gap-2 text-xs text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                className="mt-0.5 rounded border-surface-border text-brand focus:ring-brand accent-brand"
              />
              <span>
                I represent an authorized dining venue and agree to the Smart Table AI Merchant Terms.
              </span>
            </label>
            {errors.terms && <p className="input-error text-[11px]">{errors.terms}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Register Restaurant'}
          </button>
        </form>

        <div className="pt-3 border-t border-surface-border text-center space-y-2">
          <p className="text-xs text-text-secondary">
            Already have an owner account?{' '}
            <Link to="/owner/login" className="text-brand font-medium hover:underline">
              Owner Sign In
            </Link>
          </p>
          <div>
            <Link to="/login" className="text-[11px] text-text-disabled hover:text-text-secondary">
              ← Customer Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

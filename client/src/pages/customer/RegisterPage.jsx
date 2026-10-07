import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SmartTableLogo from '../../components/common/SmartTableLogo';
import toast from 'react-hot-toast';

/**
 * CustomerRegisterPage — /register
 */
export default function CustomerRegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]       = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', terms: true, role: 'customer' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.confirmPassword) errs.confirmPassword = 'Confirm your password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!form.terms) errs.terms = 'You must accept the terms of service';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { data, error } = await register({
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
    });
    setLoading(false);

    if (error) {
      if (error.code === 'DUPLICATE_ERROR') {
        setErrors({ email: 'An account with this email already exists' });
      } else if (error.details) {
        const fieldErrors = {};
        error.details.forEach(d => { fieldErrors[d.field] = d.message; });
        setErrors(fieldErrors);
      } else {
        toast.error(error.message || 'Registration failed');
      }
      return;
    }

    toast.success('Account created! Please sign in.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-6 text-center animate-fade-in flex flex-col items-center">
        <SmartTableLogo variant="full" size="md" />
        <h1 className="text-xl font-bold text-text-primary mt-2">Create Account</h1>
        <p className="text-text-secondary text-sm mt-0.5">Join Smart Table AI today</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card animate-slide-up">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Name */}
          <div>
            <label htmlFor="reg-name" className="input-label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="reg-name" type="text" name="name"
                value={form.name} onChange={handleChange}
                placeholder="Your full name"
                autoComplete="name"
                className={`input pl-10 ${errors.name ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.name && <p className="input-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="input-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="reg-email" type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={`input pl-10 ${errors.email ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.email && <p className="input-error">{errors.email}</p>}
          </div>

          {/* Phone (optional) */}
          <div>
            <label htmlFor="reg-phone" className="input-label">
              Phone <span className="text-text-disabled font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="reg-phone" type="tel" name="phone"
                value={form.phone} onChange={handleChange}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                className="input pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="input-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="reg-password" type={showPw ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                className={`input pl-10 pr-10 ${errors.password ? 'border-status-occupied' : ''}`}
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
                aria-label="Toggle password visibility">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="input-error">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm-password" className="input-label">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="reg-confirm-password" type={showPw ? 'text' : 'password'} name="confirmPassword"
                value={form.confirmPassword} onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.confirmPassword && <p className="input-error">{errors.confirmPassword}</p>}
          </div>

          {/* Terms Agreement */}
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
                I agree to Smart Table AI's terms of service and dining policies.
              </span>
            </label>
            {errors.terms && <p className="input-error text-[11px]">{errors.terms}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">Sign in</Link>
        </p>

        <div className="mt-3 text-center">
          <Link to="/owner/register" className="text-xs text-text-disabled hover:text-brand transition-colors">
            Register your restaurant →
          </Link>
        </div>
      </div>
    </div>
  );
}

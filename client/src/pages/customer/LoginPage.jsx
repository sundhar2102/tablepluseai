import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * CustomerLoginPage — /login
 */
export default function CustomerLoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/app';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email)    errs.email    = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const { data, error } = await login(form.email, form.password, 'customer');
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Login failed');
      if (error.code === 'INVALID_CREDENTIALS') {
        setErrors({ password: 'Incorrect email or password' });
      }
      return;
    }

    toast.success(`Welcome back, ${data.user.name}! 👋`);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand mx-auto mb-4 flex items-center justify-center shadow-glow">
          <span className="text-surface-bg font-bold text-2xl">TP</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">TablePulse AI</h1>
        <p className="text-text-secondary text-sm mt-1">Know the Crowd. Get Your Table. Dine Smarter.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card animate-slide-up">
        <h2 className="text-xl font-bold text-text-primary mb-6">Sign In</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="input-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={`input pl-10 ${errors.email ? 'border-status-occupied' : ''}`}
              />
            </div>
            {errors.email && <p className="input-error">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="input-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`input pl-10 pr-10 ${errors.password ? 'border-status-occupied' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="input-error">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-sm text-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/owner/login" className="text-xs text-text-disabled hover:text-brand transition-colors">
            Restaurant owner? Sign in here →
          </Link>
        </div>
      </div>

      {/* Dev hint */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-3 bg-surface-card border border-surface-border rounded-lg text-xs text-text-secondary max-w-sm w-full">
          <p className="font-semibold text-accent mb-1">🧪 Dev Test Account</p>
          <p>Email: customer@demo.com</p>
          <p>Password: Demo@1234</p>
        </div>
      )}
    </div>
  );
}

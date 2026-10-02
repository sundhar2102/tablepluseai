import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Store, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * OwnerLoginPage — /owner/login
 */
export default function OwnerLoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
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
    const { data, error } = await login(form.email, form.password, 'owner');
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Login failed');
      if (error.code === 'INVALID_CREDENTIALS') {
        setErrors({ password: 'Incorrect email or password' });
      }
      return;
    }

    toast.success('Welcome back! 🏪');
    navigate('/owner');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-brand mx-auto mb-4 flex items-center justify-center shadow-glow">
          <Store size={28} className="text-surface-bg" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Owner Portal</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your restaurant in real time</p>
      </div>

      <div className="w-full max-w-sm card animate-slide-up">
        <h2 className="text-xl font-bold text-text-primary mb-6">Sign In</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="owner-email" className="input-label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input id="owner-email" type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="owner@restaurant.com" autoComplete="email"
                className={`input pl-10 ${errors.email ? 'border-status-occupied' : ''}`} />
            </div>
            {errors.email && <p className="input-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="owner-password" className="input-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input id="owner-password" type={showPw ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange} placeholder="••••••••" autoComplete="current-password"
                className={`input pl-10 pr-10 ${errors.password ? 'border-status-occupied' : ''}`} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
                aria-label="Toggle password">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="input-error">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full btn-lg mt-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-text-secondary">
          New restaurant?{' '}
          <Link to="/owner/register" className="text-brand font-medium hover:underline">Register here</Link>
        </p>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-text-disabled hover:text-brand transition-colors">
            ← Customer login
          </Link>
        </div>
      </div>

      {import.meta.env.DEV && (
        <div className="mt-6 p-3 bg-surface-card border border-surface-border rounded-lg text-xs text-text-secondary max-w-sm w-full">
          <p className="font-semibold text-accent mb-1">🧪 Dev Test Account</p>
          <p>Email: owner@demo.com | Password: Demo@1234</p>
        </div>
      )}
    </div>
  );
}

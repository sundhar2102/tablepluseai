import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const { data, error } = await login(form.email, form.password, 'admin');
    setLoading(false);
    if (error) { setError(error.message || 'Login failed'); return; }
    toast.success('Admin access granted');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-surface-bg flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 mx-auto mb-4 flex items-center justify-center">
          <Shield size={28} className="text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Access</h1>
        <p className="text-text-secondary text-sm mt-1">TablePulse AI — Super Admin</p>
      </div>

      <div className="w-full max-w-sm card">
        {error && (
          <div className="mb-4 p-3 bg-status-occupied/10 border border-status-occupied/20 rounded-lg
                          text-sm text-status-occupied">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="input-label">Admin Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input id="admin-email" type="email" value={form.email}
                onChange={e => setForm(p => ({...p, email: e.target.value}))}
                placeholder="admin@tablepulse.app" className="input pl-10" />
            </div>
          </div>
          <div>
            <label htmlFor="admin-password" className="input-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled" />
              <input id="admin-password" type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(p => ({...p, password: e.target.value}))}
                placeholder="••••••••" className="input pl-10 pr-10" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="btn w-full btn-lg bg-accent text-surface-bg hover:opacity-90 active:scale-95">
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Access Admin Panel'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-text-disabled hover:text-brand">← Back to customer login</Link>
        </div>
      </div>
    </div>
  );
}

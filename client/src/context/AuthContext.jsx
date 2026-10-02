import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

/**
 * AuthContext — Global authentication state.
 * Provides user info, loading state, and auth actions to the entire app.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true until initial auth check is done

  // ── Initialise from localStorage on mount ──────────────────────
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (email, password, role) => {
    const { data, error } = await authService.login({ email, password, role });
    if (data) {
      setUser(data.user);
    }
    return { data, error };
  }, []);

  // ── Register ───────────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    return authService.register(payload);
  }, []);

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // ── Refresh user from API ──────────────────────────────────────
  const refreshUser = useCallback(async () => {
    const { data } = await authService.getMe();
    if (data) {
      setUser(data);
      localStorage.setItem('tp_user', JSON.stringify(data));
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isCustomer: user?.role === 'customer',
    isOwner:    user?.role === 'owner',
    isAdmin:    user?.role === 'admin',
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook — call from any component to access auth state.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

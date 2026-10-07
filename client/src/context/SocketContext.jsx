import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const isNativeApp = () => {
  if (typeof window === 'undefined') return false;
  return (
    Capacitor.isNativePlatform() ||
    window.Capacitor?.isNativePlatform?.() ||
    !!window.androidBridge ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '5173')
  );
};

const getSocketUrl = () => {
  if (isNativeApp()) {
    if (import.meta.env.VITE_MOBILE_SOCKET_URL) {
      return import.meta.env.VITE_MOBILE_SOCKET_URL;
    }
    if (import.meta.env.VITE_API_HOST) {
      const host = import.meta.env.VITE_API_HOST.trim();
      const port = host.includes(':') ? '' : ':3001';
      return `http://${host}${port}`;
    }
    const envUrl = import.meta.env.VITE_SOCKET_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'http://10.0.2.2:3001';
  }
  return import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();
console.log('[Socket] Initialized Socket URL:', SOCKET_URL, '| Native detected:', isNativeApp());

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('smarttable_token') || localStorage.getItem('tp_token');
    if (!token) return;

    // Create socket connection with JWT auth
    const socket = io(SOCKET_URL, {
      auth:             { token },
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports:       ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] ❌ Disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated]);

  const value = {
    socket:    socketRef.current,
    connected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within <SocketProvider>');
  return ctx;
}

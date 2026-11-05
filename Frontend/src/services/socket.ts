import { io, Socket } from 'socket.io-client';
import { User } from '../types';

let socket: Socket | null = null;

// Determine backend Socket.IO URL
const getSocketUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    // If VITE_API_URL is e.g. "https://backend.onrender.com/api", strip "/api"
    return envUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    // In local development with Vite dev server (e.g. port 3000), backend is on port 5000
    if (window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    socket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    });
  }

  return socket;
};

export const connectSocketUser = (user: User | null) => {
  if (!user) return;
  const s = getSocket();

  if (!s.connected) {
    s.connect();
  }

  // Register user details for room routing & online status
  s.emit('register_user', {
    id: user.id,
    email: (user.email || '').toLowerCase().trim(),
    name: user.name,
    role: user.role
  });

  // Re-register upon auto-reconnection to resume missed messages
  s.off('reconnect');
  s.on('reconnect', () => {
    s.emit('register_user', {
      id: user.id,
      email: (user.email || '').toLowerCase().trim(),
      name: user.name,
      role: user.role
    });
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

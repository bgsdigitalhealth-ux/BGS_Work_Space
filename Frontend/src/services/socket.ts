import { io, Socket } from 'socket.io-client';
import { User } from '../types';

let socket: Socket | null = null;
let activeUser: User | null = null;
let heartbeatInterval: any = null;

// Determine backend Socket.IO URL
const getSocketUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    // If local dev on port 3000 or any dev port:
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:5000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = getSocketUrl();
    socket = io(socketUrl, {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend server:', socket?.id);
      // Immediately register the logged-in user upon connection
      if (activeUser) {
        socket?.emit('register_user', {
          id: activeUser.id,
          email: (activeUser.email || '').toLowerCase().trim(),
          name: activeUser.name,
          role: activeUser.role
        });
        socket?.emit('get_online_users');
      }
    });

    socket.on('reconnect', () => {
      console.log('[Socket.IO] Reconnected to server');
      if (activeUser) {
        socket?.emit('register_user', {
          id: activeUser.id,
          email: (activeUser.email || '').toLowerCase().trim(),
          name: activeUser.name,
          role: activeUser.role
        });
        socket?.emit('get_online_users');
      }
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
  activeUser = user;
  const s = getSocket();

  // If already connected, register immediately
  if (s.connected) {
    s.emit('register_user', {
      id: user.id,
      email: (user.email || '').toLowerCase().trim(),
      name: user.name,
      role: user.role
    });
    s.emit('get_online_users');
  } else {
    s.connect();
  }

  // Setup periodic presence heartbeat to ensure the backend never loses status
  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      if (s.connected && activeUser) {
        s.emit('presence_heartbeat', {
          id: activeUser.id,
          email: (activeUser.email || '').toLowerCase().trim(),
          name: activeUser.name,
          role: activeUser.role
        });
      }
    }, 15000);
  }
};

export const disconnectSocket = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeUser = null;
};

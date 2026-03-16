import { io } from 'socket.io-client';

const rawUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080';
// Fix invalid namespace error: strip trailing slash from Render URLs
const SOCKET_URL = rawUrl.replace(/\/+$/, '');

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.handlers = new Map(); // event -> Set of callbacks
        this.userId = null;
    }

    connect(userId, onConnected, onError) {
        if (this.socket?.connected) return;
        this.userId = userId;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            this.connected = true;
            this.socket.emit('authenticate', { userId });
            if (onConnected) onConnected();
            console.log('[Socket.IO] Connected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('[Socket.IO] Connection error:', err.message);
            this.connected = false;
            if (onError) onError(err);
        });

        this.socket.on('disconnect', (reason) => {
            this.connected = false;
            console.log('[Socket.IO] Disconnected:', reason);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`[Socket.IO] Reconnected after ${attemptNumber} attempts`);
            this.connected = true;
            // Re-authenticate after reconnection
            this.socket.emit('authenticate', { userId: this.userId });
        });

        this.socket.on('error', (error) => {
            console.error('[Socket.IO] Server error:', error);
        });

        // Route all events to registered handlers
        this.socket.onAny((event, ...args) => {
            if (this.handlers.has(event)) {
                this.handlers.get(event).forEach(cb => cb(...args));
            }
        });
    }

    subscribe(event, callback) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            const set = this.handlers.get(event);
            if (set) {
                set.delete(callback);
                if (set.size === 0) this.handlers.delete(event);
            }
        };
    }

    emit(event, payload) {
        if (this.socket?.connected) {
            this.socket.emit(event, payload);
        } else {
            if (event !== 'activity') {
                console.warn(`[Socket.IO] Cannot emit '${event}' — not connected`);
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.handlers.clear();
            this.userId = null;
        }
    }
}

export const socketService = new SocketService();

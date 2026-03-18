import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, // Increased to 60s to handle Render free-tier cold starts
});

// Automatically attach JWT to all outgoing requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — auto logout
            console.warn('[API] 401 Unauthorized — token may be expired');
            // Don't auto-logout on auth endpoints
            if (!error.config.url.includes('/auth/')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('privateKey');
                window.location.href = '/login';
            }
        }
        if (error.response?.status === 403) {
            console.error('[API] 403 Forbidden — access denied');
        }
        if (error.response?.status === 429) {
            console.warn('[API] 429 Rate limited — too many requests');
        }
        return Promise.reject(error);
    }
);

// ── Auth API ─────────────────────────────────────────────────────────────────────
export const authAPI = {
    loginWithGoogle: (data) => api.post('/auth/google', data),
    loginWithTest: (data) => api.post('/auth/test', data),
    getCurrentUser: () => api.get('/auth/me'),
};

// ── User API ─────────────────────────────────────────────────────────────────────
export const userAPI = {
    searchUsers: (query) => api.get(`/users/search?email=${encodeURIComponent(query)}`),
    getUserById: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => api.put('/users/profile', data),
    getNicknames: () => api.get('/users/nicknames'),
    setNickname: (friendId, nickname) => api.post('/users/nickname', { friendId, nickname }),
};

// ── Chat API ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
    getUserChats: () => api.get('/chats'),
    createOrGetChat: (userId) => api.post(`/chats/${userId}`),
    updateWallpaper: (chatId, wallpaperUrl) => api.put(`/chats/${chatId}/wallpaper`, { wallpaperUrl }),
    deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
};

// ── Group API ────────────────────────────────────────────────────────────────────
export const groupAPI = {
    createGroup: (data) => api.post('/groups/create', data),
    addMember: (groupId, userId) => api.post(`/groups/${groupId}/add`, { userId }),
};

// ── Message API ──────────────────────────────────────────────────────────────────
export const messageAPI = {
    getMessages: (chatId, page = 1) => api.get(`/messages/${chatId}?page=${page}`),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    markAsRead: (chatId) => api.post(`/messages/${chatId}/read`),
};

// ── Media API ────────────────────────────────────────────────────────────────────
export const mediaAPI = {
    uploadMedia: (file, type = 'auto') => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/media/upload?type=${type}`, formData, {
            timeout: 60000, // 60s timeout for uploads
        });
    },
};

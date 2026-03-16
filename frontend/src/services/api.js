import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
    baseURL: API_URL,
});

// Automatically attach JWT to all outgoing requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for debugging and security errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403) {
            console.error("Neural Security Rejection (403): Your account session may be invalid or you are calling the wrong backend domain.");
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    loginWithGoogle: (data) => api.post('/auth/google', data),
    loginWithTest: (data) => api.post('/auth/test', data),
};

export const userAPI = {
    searchUsers: (email) => api.get(`/users/search?email=${encodeURIComponent(email)}`),
    getUserById: (id) => api.get(`/users/${id}`),
    getCurrentUser: () => api.get('/users/me'),
    updateProfile: (data) => api.put('/users/profile', data),
    getNicknames: () => api.get('/users/nicknames'),
    setNickname: (friendId, nickname) => api.post('/users/nickname', { friendId, nickname }),
};

export const chatAPI = {
    getUserChats: () => api.get('/chats'),
    createOrGetChat: (userId) => api.post(`/chats/${userId}`),
    updateWallpaper: (chatId, wallpaperUrl) => api.put(`/chats/${chatId}/wallpaper`, { wallpaperUrl }),
    deleteChat: (chatId) => api.delete(`/chats/${chatId}`),
};

export const groupAPI = {
    createGroup: (data) => api.post('/groups/create', data),
    addMember: (groupId, userId) => api.post(`/groups/${groupId}/add/${userId}`),
};

export const messageAPI = {
    getMessages: (chatId) => api.get(`/messages/${chatId}`),
    deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
    markAsRead: (chatId) => api.post(`/messages/${chatId}/read`),
};

export const mediaAPI = {
    uploadMedia: (file, type = 'auto') => {
        const formData = new FormData();
        formData.append('file', file);
        // Let axios set the Content-Type automatically with the correct boundary
        return api.post(`/media/upload?type=${type}`, formData);
    },
};

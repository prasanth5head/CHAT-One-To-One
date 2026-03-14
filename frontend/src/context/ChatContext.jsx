import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatAPI, messageAPI, userAPI, mediaAPI, groupAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import {
    encryptMessage,
    encryptAESKeyWithRSA,
    decryptMessage,
    decryptAESKeyWithRSA,
    generateAESKey
} from '../utils/encryption';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activityStatus, setActivityStatus] = useState({}); // { chatId: { userId: { typing, recording } } }
    const [presenceStatus, setPresenceStatus] = useState({}); // { userId: 'online' | 'offline' }
    const [nicknames, setNicknames] = useState({});
    const userCache = useRef({});

    useEffect(() => {
        if (user) {
            loadChats();
            loadNicknames();
            const token = localStorage.getItem('token');
            socketService.connect(token);
        } else {
            socketService.disconnect();
        }
    }, [user]);

    const loadNicknames = async () => {
        try {
            const res = await userAPI.getNicknames();
            const map = {};
            res.data.forEach(n => map[n.friendId] = n.nickname);
            setNicknames(map);
        } catch (e) { }
    };

    useEffect(() => {
        if (!socketService.connected) return;

        // Presence Subscription
        socketService.subscribe('/topic/presence', (payload) => {
            setPresenceStatus(prev => ({ ...prev, [payload.userId]: payload.status }));
        });

    }, [socketService.connected]);

    useEffect(() => {
        if (!activeChat) return;
        const chatId = activeChat.id || activeChat._id;
        
        loadMessages(chatId);
        markChatAsRead(chatId);

        const subscribe = () => {
            if (!socketService.connected) {
                setTimeout(subscribe, 500);
                return;
            }

            socketService.subscribe(`/topic/chat/${chatId}`, (msg) => {
                const decrypted = tryDecrypt(msg);
                setMessages((prev) => {
                    if (prev.find(m => (m.id || m._id) === (msg.id || msg._id))) return prev;
                    return [...prev, decrypted];
                });
            });

            socketService.subscribe(`/topic/chat/${chatId}/activity`, (payload) => {
                if (payload.userId !== (user?.id || user?._id)) {
                    setActivityStatus((prev) => ({
                        ...prev,
                        [chatId]: { ...prev[chatId], [payload.userId]: { typing: payload.typing, recording: payload.recording } }
                    }));
                }
            });

            socketService.subscribe(`/topic/chat/${chatId}/reaction`, (payload) => {
                setMessages(prev => prev.map(m => {
                    if ((m.id || m._id) === payload.messageId) {
                        const reactions = m.reactions || [];
                        const filtered = reactions.filter(r => r.userId !== payload.reaction.userId);
                        return { ...m, reactions: [...filtered, payload.reaction] };
                    }
                    return m;
                }));
            });
        };

        subscribe();
    }, [activeChat]);

    const tryDecrypt = (msg) => {
        if (!msg || !user) return msg;
        try {
            const privateKeyPem = localStorage.getItem('privateKey');
            if (!privateKeyPem) return msg;

            const myId = user.id || user._id;
            // Check for key in either 'id' or '_id' format in the encryptedKeys map
            const myEncryptedKey = msg.encryptedKeys?.[myId] || msg.encryptedKeys?.[user._id] || msg.encryptedKeys?.[user.id];
            
            if (myEncryptedKey) {
                const aesKeyBytes = decryptAESKeyWithRSA(myEncryptedKey, privateKeyPem);
                const text = decryptMessage(msg.encryptedMessage, aesKeyBytes);
                return { ...msg, text };
            }
        } catch (e) {
            console.error("Neural Decryption Error:", e);
        }
        return msg;
    };

    const fetchUser = async (userId, forceRefresh = false) => {
        if (!userId) return null;
        if (!forceRefresh && userCache.current[userId]) return userCache.current[userId];
        try {
            const res = await userAPI.getUserById(userId);
            userCache.current[userId] = res.data;
            if (res.data.status) {
                setPresenceStatus(prev => ({ ...prev, [userId]: res.data.status }));
            }
            return res.data;
        } catch (err) { return null; }
    };

    const loadChats = async () => {
        try {
            const res = await chatAPI.getUserChats();
            const chatsWithData = await Promise.all(res.data.map(async (chat) => {
                if (!chat.isGroup) {
                    const otherId = chat.participants.find(p => p !== (user.id || user._id));
                    const otherUser = await fetchUser(otherId);
                    return { ...chat, otherUser };
                }
                return chat;
            }));
            setChats(chatsWithData.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            return chatsWithData;
        } catch (e) { return []; }
    };

    const selectChat = (chat) => setActiveChat(chat);

    const loadMessages = async (chatId) => {
        try {
            const res = await messageAPI.getMessages(chatId);
            const decrypted = res.data.map(tryDecrypt);
            setMessages(decrypted);
        } catch (e) { }
    };

    const markChatAsRead = async (chatId) => {
        try {
            await messageAPI.markAsRead(chatId);
        } catch (e) { }
    };

    const sendMessage = async (text, mediaUrl = null, messageType = 'text') => {
        if (!activeChat) return;
        const chatId = activeChat.id || activeChat._id;
        try {
            const aesKeyBytes = generateAESKey();
            const encryptedMessage = encryptMessage(text || 'Neural Packet', aesKeyBytes);
            const encryptedKeys = {};
            
            // Ensure we include our own public key for self-decryption
            const myId = user.id || user._id;
            if (user.publicKey) {
                encryptedKeys[myId] = encryptAESKeyWithRSA(aesKeyBytes, user.publicKey);
            }

            for (const pId of activeChat.participants) {
                if (pId === myId) continue; // Already added self
                const pUser = await fetchUser(pId, true);
                if (pUser?.publicKey) {
                    encryptedKeys[pId] = encryptAESKeyWithRSA(aesKeyBytes, pUser.publicKey);
                }
            }
            
            socketService.sendMessage('/app/chat.sendMessage', {
                chatId, senderId: myId,
                encryptedMessage, encryptedKeys, mediaUrl, messageType, status: 'sent'
            });

            // Optimistically update last updated for UI responsiveness
            setChats(prev => prev.map(c => 
                ((c.id || c._id) === chatId) ? { ...c, updatedAt: new Date(), lastMessage: text || "Neural Link Updated" } : c
            ).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        } catch (err) {
            console.error("Neural Transmission Failure:", err);
        }
    };

    const sendReaction = (messageId, emoji) => {
        if (!activeChat) return;
        socketService.sendMessage('/app/chat.reaction', {
            chatId: (activeChat.id || activeChat._id),
            messageId,
            reaction: { userId: (user.id || user._id), emoji }
        });
    };

    const sendActivity = (activity) => {
        if (activeChat) {
            socketService.sendMessage('/app/chat.activity', {
                chatId: (activeChat.id || activeChat._id),
                userId: (user.id || user._id),
                ...activity,
            });
        }
    };

    const createGroup = async (groupName, participants) => {
        try {
            const res = await groupAPI.createGroup({
                groupName,
                members: [...participants, user.id || user._id],
                isGroup: true,
                createdBy: user.id || user._id
            });
            await loadChats();
            return res.data;
        } catch (e) { }
    };

    const setNickname = async (friendId, nickname) => {
        try {
            await userAPI.setNickname(friendId, nickname);
            setNicknames(prev => ({ ...prev, [friendId]: nickname }));
        } catch (e) { }
    };

    const updateChatWallpaper = async (chatId, wallpaperUrl) => {
        try {
            await chatAPI.updateWallpaper(chatId, wallpaperUrl);
            setChats(prev => prev.map(c => (c.id === chatId || c._id === chatId) ? { ...c, wallpaperUrl } : c));
            if ((activeChat?.id || activeChat?._id) === chatId) {
                setActiveChat(prev => ({ ...prev, wallpaperUrl }));
            }
        } catch (e) { }
    };

    const createChat = async (targetUser) => {
        try {
            const res = await chatAPI.createOrGetChat(targetUser.id);
            const updated = await loadChats();
            const full = updated?.find(c => (c.id || c._id) === (res.data.id || res.data._id));
            setActiveChat(full || res.data);
            return full || res.data;
        } catch (e) { }
    };

    const deleteChat = async (chatId) => {
        try {
            await chatAPI.deleteChat(chatId);
            setChats(prev => prev.filter(c => (c.id || c._id) !== chatId));
            if ((activeChat?.id || activeChat?._id) === chatId) setActiveChat(null);
        } catch (e) { }
    };

    const deleteMessage = async (messageId) => {
        try {
            await messageAPI.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => (m.id || m._id) !== messageId));
        } catch (e) { }
    };

    return (
        <ChatContext.Provider value={{
            chats, activeChat, messages, selectChat,
            sendMessage, sendReaction, loadChats, sendActivity, activityStatus, presenceStatus,
            createChat, createGroup, nicknames, setNickname, 
            updateChatWallpaper, deleteChat, deleteMessage
        }}>
            {children}
        </ChatContext.Provider>
    );
};

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
    const [socketConnected, setSocketConnected] = useState(false);
    const [activityStatus, setActivityStatus] = useState({});
    const [presenceStatus, setPresenceStatus] = useState({});
    const [nicknames, setNicknames] = useState({});
    const userCache = useRef({});

    // ── Connect to Socket.IO on user login ──────────────────────────────────────
    useEffect(() => {
        if (user) {
            loadChats();
            loadNicknames();
            const userId = user.id || user._id;
            socketService.connect(
                userId,
                () => setSocketConnected(true),
                () => setSocketConnected(false)
            );

            const interval = setInterval(() => {
                setSocketConnected(socketService.connected);
            }, 5000);

            return () => {
                clearInterval(interval);
            };
        } else {
            socketService.disconnect();
            setSocketConnected(false);
            setChats([]);
            setMessages([]);
            setActiveChat(null);
        }
    }, [user]);

    // ── Load Nicknames ──────────────────────────────────────────────────────────
    const loadNicknames = async () => {
        try {
            const res = await userAPI.getNicknames();
            const map = {};
            res.data.forEach(n => (map[n.friendId] = n.nickname));
            setNicknames(map);
        } catch (e) { /* Nicknames are optional */ }
    };

    // ── Presence Subscription ───────────────────────────────────────────────────
    useEffect(() => {
        if (!socketConnected) return;

        const unsub = socketService.subscribe('presence', (payload) => {
            setPresenceStatus(prev => ({ ...prev, [payload.userId]: payload.status }));
        });

        return unsub;
    }, [socketConnected]);

    // ── Active Chat Subscriptions ───────────────────────────────────────────────
    useEffect(() => {
        if (!activeChat) return;
        const chatId = activeChat.id || activeChat._id;

        loadMessages(chatId);
        markChatAsRead(chatId);

        if (socketConnected) {
            socketService.emit('joinChat', chatId);
        }

        const unsubs = [
            socketService.subscribe('receiveMessage', (msg) => {
                if (msg.chatId !== chatId) return;
                const decrypted = tryDecrypt(msg);
                setMessages((prev) => {
                    const index = prev.findIndex(m => (m.id || m._id) === (msg.id || msg._id));
                    if (index !== -1) {
                        const existing = prev[index];
                        if (!existing.text && decrypted.text) {
                            const next = [...prev];
                            next[index] = decrypted;
                            return next;
                        }
                        return prev;
                    }
                    return [...prev, decrypted];
                });

                setChats(prev =>
                    prev
                        .map(c =>
                            (c.id || c._id) === chatId
                                ? { ...c, lastMessage: decrypted.text || decrypted.encryptedMessage, updatedAt: new Date() }
                                : c
                        )
                        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                );
            }),

            socketService.subscribe('activity', (payload) => {
                if (payload.chatId !== chatId) return;
                if (payload.userId !== (user?.id || user?._id)) {
                    setActivityStatus(prev => ({
                        ...prev,
                        [chatId]: {
                            ...prev[chatId],
                            [payload.userId]: { typing: payload.typing, recording: payload.recording },
                        },
                    }));
                }
            }),

            socketService.subscribe('reaction', (payload) => {
                if (payload.chatId !== chatId) return;
                setMessages(prev =>
                    prev.map(m => {
                        if ((m.id || m._id) === payload.messageId) {
                            const reactions = m.reactions || [];
                            const filtered = reactions.filter(r => r.userId !== payload.reaction.userId);
                            return { ...m, reactions: [...filtered, payload.reaction] };
                        }
                        return m;
                    })
                );
            }),

            socketService.subscribe('messagesRead', (payload) => {
                if (payload.chatId !== chatId) return;
                setMessages(prev =>
                    prev.map(m => {
                        if (String(m.senderId) === (user?.id || user?._id) && m.status !== 'read') {
                            return { ...m, status: 'read' };
                        }
                        return m;
                    })
                );
            }),
        ];

        return () => unsubs.forEach(unsub => unsub());
    }, [activeChat, socketConnected]);

    // ── Decryption ──────────────────────────────────────────────────────────────
    const tryDecrypt = (msg) => {
        if (!msg || !msg.encryptedMessage || !user) return msg;
        try {
            const privateKeyPem = localStorage.getItem('privateKey');
            if (!privateKeyPem) {
                console.warn('[Decryption] Missing private key');
                return { ...msg, text: '🔒 Decryption Failed: Private key missing.' };
            }

            const myId = user.id || user._id;
            const keys = msg.encryptedKeys || {};

            // Try various ID matches
            let myEncryptedKey = keys[myId] || keys[user.id] || keys[user._id];

            // Scan keys if IDs are potentially different formats
            if (!myEncryptedKey) {
                const myIdStr = String(myId);
                const foundKey = Object.entries(keys).find(([k]) => String(k) === myIdStr);
                if (foundKey) myEncryptedKey = foundKey[1];
            }

            if (myEncryptedKey) {
                try {
                    const aesKeyBytes = decryptAESKeyWithRSA(myEncryptedKey, privateKeyPem);
                    const text = decryptMessage(msg.encryptedMessage, aesKeyBytes);
                    return { ...msg, text };
                } catch (rsaErr) {
                    console.error('[Decryption] RSA Error:', rsaErr.message);
                    return { ...msg, text: '🔒 Decryption Failed: Key mismatch.' };
                }
            } else {
                return { ...msg, text: '🔒 Decryption Failed: Not encrypted for this session.' };
            }
        } catch (e) {
            console.error('[Decryption] Fatal error:', e);
            return { ...msg, text: '🔒 Decryption Failed.' };
        }
    };

    // ── Data Loading ────────────────────────────────────────────────────────────
    const syncKeys = async () => {
        userCache.current = {};
        await loadChats();
        if (activeChat) await loadMessages(activeChat.id || activeChat._id);
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
        } catch (err) {
            return null;
        }
    };

    const loadChats = async () => {
        try {
            const res = await chatAPI.getUserChats();
            const chatsWithData = await Promise.all(
                res.data.map(async (chat) => {
                    if (!chat.isGroup) {
                        const otherId = chat.participants.find(p => p !== (user.id || user._id));
                        const otherUser = await fetchUser(otherId);
                        return { ...chat, otherUser };
                    }
                    return chat;
                })
            );
            const sorted = chatsWithData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            setChats(sorted);
            return sorted;
        } catch (e) {
            return [];
        }
    };

    const selectChat = (chat) => setActiveChat(chat);

    const loadMessages = async (chatId) => {
        try {
            const res = await messageAPI.getMessages(chatId);
            const decrypted = res.data.map(tryDecrypt);
            setMessages(decrypted);
        } catch (e) { /* silently fail */ }
    };

    const markChatAsRead = async (chatId) => {
        try {
            await messageAPI.markAsRead(chatId);
        } catch (e) { /* silently fail */ }
    };

    // ── Send Message ────────────────────────────────────────────────────────────
    const sendMessage = async (text, mediaUrl = null, messageType = 'text') => {
        if (!activeChat) return;
        if (!socketConnected) {
            alert('⚠️ Connection lost. Reconnecting...');
            return;
        }
        const chatId = activeChat.id || activeChat._id;
        const myId = user.id || user._id;

        try {
            const aesKeyBytes = generateAESKey();
            const encryptedMessage = encryptMessage(text || 'Media', aesKeyBytes);
            const encryptedKeys = {};

            // Encrypt AES key with my public key
            let myPublicKey = user.publicKey;
            if (!myPublicKey) {
                const refreshed = await fetchUser(myId, true);
                myPublicKey = refreshed?.publicKey;
            }
            if (myPublicKey) {
                encryptedKeys[myId] = encryptAESKeyWithRSA(aesKeyBytes, myPublicKey);
            }

            // Encrypt AES key with each participant's public key
            for (const pId of activeChat.participants) {
                if (pId === myId) continue;
                const pUser = await fetchUser(pId, true);
                if (pUser?.publicKey) {
                    encryptedKeys[pId] = encryptAESKeyWithRSA(aesKeyBytes, pUser.publicKey);
                } else {
                    console.warn(`[Encryption] Missing public key for ${pId}`);
                }
            }

            const msgPayload = {
                chatId,
                senderId: myId,
                encryptedMessage,
                encryptedKeys,
                mediaUrl,
                messageType,
                status: 'sent',
                timestamp: new Date().toISOString(),
            };

            // Emit directly via Socket.IO
            socketService.emit('sendMessage', msgPayload);

            // Optimistically update chat list
            setChats(prev =>
                prev
                    .map(c =>
                        (c.id || c._id) === chatId
                            ? { ...c, updatedAt: new Date(), lastMessage: text || 'Media' }
                            : c
                    )
                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            );
        } catch (err) {
            console.error('[Send] Failed:', err);
        }
    };

    // ── Reactions ───────────────────────────────────────────────────────────────
    const sendReaction = (messageId, emoji) => {
        if (!activeChat) return;
        socketService.emit('reaction', {
            chatId: activeChat.id || activeChat._id,
            messageId,
            reaction: { userId: user.id || user._id, emoji },
        });
    };

    // ── Activity Status ─────────────────────────────────────────────────────────
    const sendActivity = (activity) => {
        if (activeChat && socketConnected) {
            socketService.emit('activity', {
                chatId: activeChat.id || activeChat._id,
                userId: user.id || user._id,
                ...activity,
            });
        }
    };

    // ── Group Management ────────────────────────────────────────────────────────
    const createGroup = async (groupName, participants) => {
        try {
            const res = await groupAPI.createGroup({
                groupName,
                members: [...participants, user.id || user._id],
                isGroup: true,
                createdBy: user.id || user._id,
            });
            await loadChats();
            return res.data;
        } catch (e) {
            console.error('[Group] Create failed:', e);
        }
    };

    // ── Nicknames ───────────────────────────────────────────────────────────────
    const setNickname = async (friendId, nickname) => {
        try {
            await userAPI.setNickname(friendId, nickname);
            setNicknames(prev => ({ ...prev, [friendId]: nickname }));
        } catch (e) { /* silently fail */ }
    };

    // ── Chat Wallpaper ──────────────────────────────────────────────────────────
    const updateChatWallpaper = async (chatId, wallpaperUrl) => {
        try {
            await chatAPI.updateWallpaper(chatId, wallpaperUrl);
            setChats(prev =>
                prev.map(c =>
                    (c.id === chatId || c._id === chatId) ? { ...c, wallpaperUrl } : c
                )
            );
            if ((activeChat?.id || activeChat?._id) === chatId) {
                setActiveChat(prev => ({ ...prev, wallpaperUrl }));
            }
        } catch (e) { /* silently fail */ }
    };

    // ── Create Chat ─────────────────────────────────────────────────────────────
    const createChat = async (targetUser) => {
        try {
            const res = await chatAPI.createOrGetChat(targetUser.id || targetUser._id || targetUser.email);
            const updated = await loadChats();
            const full = updated?.find(c => (c.id || c._id) === (res.data.id || res.data._id));
            setActiveChat(full || res.data);
            return full || res.data;
        } catch (e) {
            console.error('[Chat] Create failed:', e);
        }
    };

    // ── Delete Chat ─────────────────────────────────────────────────────────────
    const deleteChat = async (chatId) => {
        try {
            await chatAPI.deleteChat(chatId);
            setChats(prev => prev.filter(c => (c.id || c._id) !== chatId));
            if ((activeChat?.id || activeChat?._id) === chatId) setActiveChat(null);
        } catch (e) {
            console.error('[Chat] Delete failed:', e);
        }
    };

    // ── Delete Message ──────────────────────────────────────────────────────────
    const deleteMessage = async (messageId) => {
        try {
            await messageAPI.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => (m.id || m._id) !== messageId));
        } catch (e) {
            console.error('[Message] Delete failed:', e);
        }
    };

    return (
        <ChatContext.Provider
            value={{
                chats,
                activeChat,
                messages,
                selectChat,
                sendMessage,
                sendReaction,
                loadChats,
                sendActivity,
                activityStatus,
                presenceStatus,
                createChat,
                createGroup,
                nicknames,
                setNickname,
                updateChatWallpaper,
                deleteChat,
                deleteMessage,
                syncKeys,
                socketConnected,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

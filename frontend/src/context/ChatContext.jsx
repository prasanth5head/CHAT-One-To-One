import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatAPI, messageAPI, userAPI, mediaAPI } from '../services/api';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import {
    encryptMessage,
    encryptAESKeyWithRSA,
    decryptMessage,
    decryptAESKeyWithRSA,
    generateAESKey
} from '../utils/encryption';
import forge from 'node-forge';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [activityStatus, setActivityStatus] = useState({}); // { chatId: { userId: { typing, recording } } }
    const [nicknames, setNicknames] = useState({}); // { friendId: nickname }
    // Cache of { userId -> User object } to avoid repeated API calls
    const userCache = useRef({});

    // ── Connect WebSocket when user logs in ─────────────────────────────────────
    useEffect(() => {
        if (user) {
            loadChats();
            loadNicknames();
            const token = localStorage.getItem('token');
            socketService.connect(token, () => {
                console.log('Connected to STOMP over WebSocket');
            });
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
        } catch (e) {
            console.error("Failed to load nicknames:", e);
        }
    };

    // ── Subscribe to the active chat channel ────────────────────────────────────
    useEffect(() => {
        if (!activeChat) return;

        const chatId = activeChat.id || activeChat._id;
        console.log("Switching to chat:", chatId);
        
        setMessages([]);
        loadMessages(chatId);

        // Wait for socket to be connected, retry if needed
        const subscribe = () => {
            if (!socketService.connected) {
                setTimeout(subscribe, 500);
                return;
            }

            const chatId = activeChat.id || activeChat._id;
            socketService.subscribe(`/topic/chat/${chatId}`, (incomingMessage) => {
                const decrypted = tryDecrypt(incomingMessage);
                setMessages((prev) => {
                    // Avoid duplicates (message may arrive via WS after we already loaded via REST)
                    const msgId = incomingMessage.id || incomingMessage._id;
                    if (prev.find(m => (m.id || m._id) === msgId)) return prev;
                    return [...prev, decrypted];
                });
            });

            socketService.subscribe(`/topic/chat/${chatId}/activity`, (payload) => {
                const currentUserId = user.id || user._id;
                if (payload.userId !== currentUserId) {
                    setActivityStatus((prev) => ({
                        ...prev,
                        [chatId]: {
                            ...prev[chatId],
                            [payload.userId]: { typing: payload.typing, recording: payload.recording }
                        }
                    }));
                }
            });
        };

        subscribe();
    }, [activeChat]);

    // ── Helper: decrypt a message using local private key ────────────────────────
    const tryDecrypt = (msg) => {
        if (!msg || !user) return msg;
        
        try {
            const privateKeyPem = localStorage.getItem('privateKey');
            const myId = user.id || user._id;
            
            // Check for key using myId, and also broad check of the keys object
            const myEncryptedKey = msg.encryptedKeys?.[myId];
            
            if (myEncryptedKey && privateKeyPem) {
                const aesKeyBytes = decryptAESKeyWithRSA(myEncryptedKey, privateKeyPem);
                const text = decryptMessage(msg.encryptedMessage, aesKeyBytes);
                console.log(`Successfully decrypted msg ${msg.id || msg._id}`);
                return { ...msg, text };
            } else {
                // If it's an old message and we don't have the key, label it
                if (!myEncryptedKey) {
                    return { ...msg, text: "[Message encrypted with a previous security key]", isStale: true };
                }
                console.warn(`Decryption skipped: PrivateKey found? ${!!privateKeyPem}`);
            }
        } catch (e) {
            console.warn('Decryption error for message:', msg.id || msg._id, e.message);
        }
        return msg; // Return raw (renders as ciphertext if decryption fails)
    };

    // ── Helper: get a user from cache or API ─────────────────────────────────────
    const fetchUser = async (userId, forceRefresh = false) => {
        if (!userId) return null;
        if (!forceRefresh && userCache.current[userId]) return userCache.current[userId];
        try {
            const res = await userAPI.getUserById(userId);
            userCache.current[userId] = res.data;
            return res.data;
        } catch (err) {
            console.warn(`User ${userId} not found (404)`);
            return null;
        }
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
            setChats(chatsWithData);
        } catch (e) {
            console.error("Failed to load chats:", e);
        }
    };

    const selectChat = (chat) => {
        setActiveChat(chat);
    };

    const loadMessages = async (chatId) => {
        try {
            const res = await messageAPI.getMessages(chatId);
            const decrypted = res.data.map(tryDecrypt);
            setMessages(decrypted);
        } catch (e) {
            console.error(e);
        }
    };

    // ── Send a message with full E2EE ────────────────────────────────────────────
    const sendMessage = async (text, mediaUrl = null, messageType = 'text') => {
        if (!activeChat) return;
        const chatId = activeChat.id || activeChat._id;
        const currentUserId = user.id || user._id;

        try {
            // 1. Generate a fresh AES-256 key for this message
            const aesKeyBytes = generateAESKey();

            // 2. Encrypt the plaintext with AES-256-GCM
            const encryptedMessage = encryptMessage(text || 'Media File', aesKeyBytes);

            // 3. For each participant, RSA-encrypt the AES key with their public key
            const encryptedKeys = {};
            for (const participantId of activeChat.participants) {
                // Force refresh user data to ensure we have the absolute LATEST public key from server
                const participantUser = await fetchUser(participantId, true);
                if (participantUser?.publicKey) {
                    try {
                        encryptedKeys[participantId] = encryptAESKeyWithRSA(aesKeyBytes, participantUser.publicKey);
                    } catch (e) {
                        console.warn(`Could not encrypt key for user ${participantId}`, e.message);
                    }
                }
            }

            // 4. Send the fully encrypted payload over WebSocket — server never sees plaintext
            socketService.sendMessage('/app/chat.sendMessage', {
                chatId: chatId,
                senderId: currentUserId,
                encryptedMessage,
                encryptedKeys,
                mediaUrl,
                messageType,
                status: 'sent',
            });
        } catch (err) {
            console.error("Encryption or Send failed:", err);
        }
    };

    const sendActivity = (activity) => {
        // activity = { typing: boolean, recording: boolean }
        if (activeChat) {
            const chatId = activeChat.id || activeChat._id;
            const currentUserId = user.id || user._id;
            socketService.sendMessage('/app/chat.activity', {
                chatId: chatId,
                userId: currentUserId,
                ...activity,
            });
        }
    };

    const setNickname = async (friendId, nickname) => {
        try {
            await userAPI.setNickname(friendId, nickname);
            setNicknames(prev => ({ ...prev, [friendId]: nickname }));
        } catch (e) {
            console.error("Failed to set nickname:", e);
        }
    };

    const updateChatWallpaper = async (chatId, wallpaperUrl) => {
        try {
            await chatAPI.updateWallpaper(chatId, wallpaperUrl);
            setChats(prev => prev.map(c => (c.id === chatId || c._id === chatId) ? { ...c, wallpaperUrl } : c));
        } catch (e) {
            console.error("Failed to update wallpaper:", e);
        }
    };

    const createChat = async (targetUser) => {
        try {
            const res = await chatAPI.createOrGetChat(targetUser.id);
            await loadChats();
            setActiveChat(res.data);
            return res.data;
        } catch (e) {
            console.error(e);
        }
    };

    const deleteChat = async (chatId) => {
        try {
            await chatAPI.deleteChat(chatId);
            setChats(prev => prev.filter(c => (c.id || c._id) !== chatId));
            if ((activeChat?.id || activeChat?._id) === chatId) {
                setActiveChat(null);
                setMessages([]);
            }
        } catch (e) {
            console.error("Failed to delete chat:", e);
        }
    };

    const deleteMessage = async (messageId) => {
        try {
            await messageAPI.deleteMessage(messageId);
            setMessages(prev => prev.filter(m => (m.id || m._id) !== messageId));
        } catch (e) {
            console.error("Failed to delete message:", e);
        }
    };

    return (
        <ChatContext.Provider value={{
            chats, activeChat, messages, selectChat,
            sendMessage, loadChats, sendActivity, activityStatus, createChat,
            nicknames, setNickname, updateChatWallpaper, deleteChat, deleteMessage
        }}>
            {children}
        </ChatContext.Provider>
    );
};

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatAPI, messageAPI, userAPI } from '../services/api';
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
    const [typingUsers, setTypingUsers] = useState({});
    // Cache of { userId -> User object } to avoid repeated API calls
    const userCache = useRef({});

    // ── Connect WebSocket when user logs in ─────────────────────────────────────
    useEffect(() => {
        if (user) {
            loadChats();
            const token = localStorage.getItem('token');
            socketService.connect(token, () => {
                console.log('Connected to STOMP over WebSocket');
            });
        } else {
            socketService.disconnect();
        }
    }, [user]);

    // ── Subscribe to the active chat channel ────────────────────────────────────
    useEffect(() => {
        if (!activeChat) return;

        setMessages([]);
        loadMessages(activeChat.id);

        // Wait for socket to be connected, retry if needed
        const subscribe = () => {
            if (!socketService.connected) {
                setTimeout(subscribe, 500);
                return;
            }

            socketService.subscribe(`/topic/chat/${activeChat.id}`, (incomingMessage) => {
                const decrypted = tryDecrypt(incomingMessage);
                setMessages((prev) => {
                    // Avoid duplicates (message may arrive via WS after we already loaded via REST)
                    if (prev.find(m => m.id === incomingMessage.id)) return prev;
                    return [...prev, decrypted];
                });
            });

            socketService.subscribe(`/topic/chat/${activeChat.id}/typing`, (payload) => {
                if (payload.userId !== user.id) {
                    setTypingUsers((prev) => ({ ...prev, [activeChat.id]: payload.typing }));
                    // Auto-clear typing indicator after 3 seconds
                    setTimeout(() => setTypingUsers((prev) => ({ ...prev, [activeChat.id]: false })), 3000);
                }
            });
        };

        subscribe();
    }, [activeChat]);

    // ── Helper: decrypt a message using local private key ────────────────────────
    const tryDecrypt = (msg) => {
        try {
            const privateKeyPem = localStorage.getItem('privateKey');
            const myEncryptedKey = msg.encryptedKeys?.[user.id];
            if (myEncryptedKey && privateKeyPem) {
                const aesKeyBytes = decryptAESKeyWithRSA(myEncryptedKey, privateKeyPem);
                const aesKeyB64 = forge.util.encode64(aesKeyBytes);
                const text = decryptMessage(msg.encryptedMessage, aesKeyB64);
                return { ...msg, text };
            }
        } catch (e) {
            console.warn('Decryption failed for message:', msg.id, e.message);
        }
        return msg; // Return raw (still renders as ciphertext if decryption fails)
    };

    // ── Helper: get a user from cache or API ─────────────────────────────────────
    const fetchUser = async (userId) => {
        if (userCache.current[userId]) return userCache.current[userId];
        try {
            const res = await userAPI.getUserById(userId);
            userCache.current[userId] = res.data;
            return res.data;
        } catch {
            return null;
        }
    };

    const loadChats = async () => {
        try {
            const res = await chatAPI.getUserChats();
            setChats(res.data);
        } catch (e) {
            console.error(e);
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

        // 1. Generate a fresh AES-256 key for this message
        const aesKeyBytes = generateAESKey();
        const aesKeyB64 = forge.util.encode64(aesKeyBytes);

        // 2. Encrypt the plaintext with AES-256-GCM
        const encryptedMessage = encryptMessage(text || 'Media File', aesKeyB64);

        // 3. For each participant, RSA-encrypt the AES key with their public key
        const encryptedKeys = {};
        for (const participantId of activeChat.participants) {
            const participantUser = await fetchUser(participantId);
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
            chatId: activeChat.id,
            senderId: user.id,
            encryptedMessage,
            encryptedKeys,
            mediaUrl,
            messageType,
            status: 'sent',
        });
    };

    const sendTyping = (isTyping) => {
        if (activeChat) {
            socketService.sendMessage('/app/chat.typing', {
                chatId: activeChat.id,
                userId: user.id,
                typing: isTyping,
            });
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

    return (
        <ChatContext.Provider value={{
            chats, activeChat, messages, selectChat,
            sendMessage, loadChats, sendTyping, typingUsers, createChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};

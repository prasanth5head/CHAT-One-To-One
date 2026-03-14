import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { userAPI, mediaAPI } from '../services/api';
import { 
    Box, Typography, TextField, IconButton, List, ListItem, ListItemAvatar, 
    ListItemText, Avatar, Paper, InputAdornment, Badge, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
    useMediaQuery, useTheme, Drawer, Fab
} from '@mui/material';
import {
    Search as SearchIcon,
    Send as SendIcon,
    ExitToApp as ExitToAppIcon,
    Group as GroupIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Image as ImageIcon,
    Mic as MicIcon,
    Stop as StopIcon,
    EmojiEmotions as EmojiIcon,
    Lock as LockIcon,
    Close as CloseIcon,
    PhotoCamera as PhotoCameraIcon,
    Delete as DeleteIcon,
    Menu as MenuIcon
} from '@mui/icons-material';

// ─── Encrypt helper ──────────────────────────────────────────────────────────
// Improved visual encryption: mix of cool symbols and base64
function visualEncrypt(text) {
    if (!text) return '';
    try {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        const noise = '§∆Ω∑†‡µπ∂∫≈≠≡≤≥';
        let result = '';
        for (let i = 0; i < encoded.length; i++) {
            result += encoded[i];
            if ((i + 1) % 4 === 0) result += noise[Math.floor(Math.random() * noise.length)];
        }
        return result.substring(0, 40) + '...'; // Keep it tidy
    } catch {
        return '█▓░ [SECURE] ░▓█';
    }
}

// How many SECONDS until a read message gets visually encrypted
const ENCRYPT_AFTER_SECONDS = 30; // Faster for better user experience demo

export default function ChatPage() {
    const { user, logout } = useAuth();
    const { 
        chats, activeChat, messages, selectChat, sendMessage, 
        sendActivity, activityStatus, createChat,
        nicknames, setNickname, updateChatWallpaper, deleteChat, deleteMessage
    } = useChat();
    const navigate = useNavigate();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Mobile sidebar drawer state
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Derive activity indicators for the ACTIVE chat
    const activeChatId = activeChat?.id || activeChat?._id;
    const activeChatStatus = activeChatId ? activityStatus[activeChatId] : null;
    const someoneTyping = activeChatStatus
        ? Object.values(activeChatStatus).some(s => s.typing)
        : false;
    const someoneRecording = activeChatStatus
        ? Object.values(activeChatStatus).some(s => s.recording)
        : false;

    // UI States
    const [msgInput, setMsgInput] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    const [newDisplayName, setNewDisplayName] = useState(user?.displayName || "");
    const [newAvatar, setNewAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordTime, setRecordTime] = useState(0);

    // Encrypted display state
    const [encryptedMsgIds, setEncryptedMsgIds] = useState(new Set());
    const [peekingMsgIds, setPeekingMsgIds] = useState(new Set());
    const encryptTimers = useRef({}); 
    
    const messagesEndRef = useRef(null);
    const mediaRecorder = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Auto-encrypt logic ────────────────────────────────────────────────────
    useEffect(() => {
        const myId = user?.id || user?._id;
        messages.forEach(msg => {
            const msgId = msg.id || msg._id;
            if (!msgId) return;
            
            if (
                msg.senderId !== myId &&
                msg.messageType !== 'image' &&
                msg.messageType !== 'voice' &&
                !encryptTimers.current[msgId]
            ) {
                encryptTimers.current[msgId] = setTimeout(() => {
                    setEncryptedMsgIds(prev => {
                        const next = new Set(prev);
                        next.add(msgId);
                        return next;
                    });
                }, ENCRYPT_AFTER_SECONDS * 1000);
            }
        });

        const currentIds = new Set(messages.map(m => m.id || m._id).filter(Boolean));
        Object.keys(encryptTimers.current).forEach(id => {
            if (!currentIds.has(id)) {
                clearTimeout(encryptTimers.current[id]);
                delete encryptTimers.current[id];
            }
        });
    }, [messages, user]);

    useEffect(() => {
        Object.values(encryptTimers.current).forEach(clearTimeout);
        encryptTimers.current = {};
        setEncryptedMsgIds(new Set());
        setPeekingMsgIds(new Set());
    }, [activeChatId]);

    const handlePeek = (msgId) => {
        if (!encryptedMsgIds.has(msgId)) return;
        setPeekingMsgIds(prev => {
            const next = new Set(prev);
            next.add(msgId);
            return next;
        });
        setTimeout(() => {
            setPeekingMsgIds(prev => {
                const next = new Set(prev);
                next.delete(msgId);
                return next;
            });
        }, 3000);
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSearch = async (e) => {
        setSearchEmail(e.target.value);
        if (e.target.value.length > 2) {
            try {
                const res = await userAPI.searchUsers(e.target.value);
                setSearchResults(res.data);
            } catch (err) { }
        } else {
            setSearchResults([]);
        }
    };

    const handleCreateChat = async (targetUser) => {
        await createChat(targetUser);
        setSearchEmail("");
        setSearchResults([]);
        if (isMobile) setSidebarOpen(false);
    };

    const handleChatSelect = (chat) => {
        selectChat(chat);
        if (isMobile) setSidebarOpen(false);
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if ((!msgInput.trim() && !selectedImage && !audioBlob) || !activeChat) return;

        let mediaUrl = null;
        let messageType = 'text';

        try {
            if (selectedImage) {
                const uploadRes = await mediaAPI.uploadMedia(selectedImage, 'image');
                mediaUrl = uploadRes.data;
                messageType = 'image';
            } else if (audioBlob) {
                const uploadRes = await mediaAPI.uploadMedia(audioBlob, 'video');
                mediaUrl = uploadRes.data;
                messageType = 'voice';
            }
            sendMessage(msgInput, mediaUrl, messageType);
            setMsgInput("");
            setSelectedImage(null);
            setImagePreview(null);
            setAudioBlob(null);
            sendActivity({ typing: false, recording: false });
        } catch (e) {
            console.error("Upload/Send failed:", e);
        }
    };

    const handleTyping = (e) => {
        setMsgInput(e.target.value);
        sendActivity({ typing: e.target.value.length > 0, recording: isRecording });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("File too large (max 5MB)");
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.current.start();
            setIsRecording(true);
            setRecordTime(0);
            sendActivity({ typing: msgInput.length > 0, recording: true });
            timerRef.current = setInterval(() => setRecordTime(v => v + 1), 1000);
        } catch (err) {
            alert("Microphone access denied.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            sendActivity({ typing: msgInput.length > 0, recording: false });
        }
    };

    const handleUpdateProfile = async () => {
        try {
            let avatarUrl = user.avatar;
            if (newAvatar) {
                const up = await mediaAPI.uploadMedia(newAvatar, 'image');
                avatarUrl = up.data;
            }
            const res = await userAPI.updateProfile({ 
                displayName: newDisplayName, 
                avatar: avatarUrl 
            });
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
        } catch (e) {
            console.error("Profile update failed", e);
        }
    };

    const handleWallpaperUpload = async (e) => {
        const file = e.target.files[0];
        if (file && activeChat) {
            try {
                const up = await mediaAPI.uploadMedia(file, 'image');
                updateChatWallpaper(activeChat.id || activeChat._id, up.data);
            } catch (e) { console.error(e); }
        }
    };

    if (!user) return null;

    // ── Sidebar Content ───────────────────────────────────────────────────────
    const SidebarContent = (
        <Box sx={{ 
            width: '100%', 
            height: '100%',
            display: 'flex', 
            flexDirection: 'column', 
            bgcolor: 'rgba(5, 10, 21, 0.95)',
            backdropFilter: 'blur(20px)',
            color: '#fff'
        }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar 
                        src={user.avatar || user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.name || user.email || 'U')}&background=00e5ff&color=040712`} 
                        sx={{ border: '2px solid #00e5ff', boxShadow: '0 0 10px rgba(0,229,255,0.3)' }} 
                    />
                    <Box>
                        <Typography variant="subtitle2" fontWeight="800" sx={{ color: '#fff' }}>{user.displayName || user.name || user.email?.split('@')[0] || 'You'}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, bgcolor: '#00e5ff', borderRadius: '50%', boxShadow: '0 0 5px #00e5ff' }} />
                            <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 'bold' }}>Active</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box>
                    <IconButton onClick={() => setSettingsOpen(true)} size="small" sx={{ color: '#00e5ff' }}><SettingsIcon fontSize="small"/></IconButton>
                    <IconButton onClick={() => { logout(); navigate('/login'); }} size="small" color="error"><ExitToAppIcon fontSize="small" /></IconButton>
                </Box>
            </Box>

            <Box sx={{ p: 2 }}>
                <TextField fullWidth size="small" placeholder="Search direct messages..." value={searchEmail} onChange={handleSearch}
                    InputProps={{ 
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#00e5ff' }} /></InputAdornment>, 
                        sx: { 
                            borderRadius: 2, 
                            bgcolor: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            '& fieldset': { border: '1px solid rgba(0,229,255,0.2)' },
                            '&:hover fieldset': { borderColor: '#00e5ff' }
                        }
                    }} 
                />
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                {chats.map(chat => {
                    const chatId = chat.id || chat._id;
                    const isSelected = (activeChat?.id || activeChat?._id) === chatId;
                    const otherId = !chat.isGroup ? chat.participants?.find(p => p !== (user.id || user._id)) : null;
                    const nickname = otherId ? nicknames[otherId] : null;
                    const chatName = chat.isGroup ? chat.groupName : (nickname || chat.otherUser?.displayName || chat.otherUser?.name || "Direct Chat");
                    const status = activityStatus[chatId];
                    const someoneRecordingItem = status ? Object.values(status).some(s => s.recording) : false;
                    const someoneTypingItem = status ? Object.values(status).some(s => s.typing) : false;

                    return (
                        <ListItem key={chatId} onClick={() => handleChatSelect(chat)} 
                            sx={{ 
                                borderRadius: 2, mb: 1, 
                                bgcolor: isSelected ? 'rgba(0,229,255,0.1)' : 'transparent', 
                                border: isSelected ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: isSelected ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)' },
                                '&:hover .delete-chat-btn': { opacity: 1 }
                            }}
                        >
                            <ListItemAvatar>
                                <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success" invisible={!someoneTypingItem && !someoneRecordingItem}>
                                    <Avatar src={chat.otherUser?.avatar} sx={{ border: isSelected ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)' }}>
                                        {chat.isGroup ? <GroupIcon /> : <PersonIcon />}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText 
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: isSelected ? 800 : 500, color: '#fff' }}>{chatName}</Typography>} 
                                secondary={someoneRecordingItem ? "recording..." : (someoneTypingItem ? "typing..." : (chat.lastMessage || "No messages"))}
                                secondaryTypographyProps={{ color: (someoneTypingItem || someoneRecordingItem) ? '#00e5ff' : 'rgba(255,255,255,0.5)', noWrap: true }} 
                            />
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#040712', overflow: 'hidden' }}>
            {isMobile ? (
                <Drawer
                    anchor="left"
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    PaperProps={{
                        sx: {
                            width: '50vw',
                            bgcolor: 'transparent',
                            boxShadow: 'none'
                        }
                    }}
                >
                    {SidebarContent}
                </Drawer>
            ) : (
                <Box sx={{ width: 320, borderRight: '1px solid rgba(0,229,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                    {SidebarContent}
                </Box>
            )}

            {activeChat ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <Paper elevation={0} sx={{ height: 64, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0, bgcolor: 'rgba(5, 10, 21, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,229,255,0.1)', zIndex: 1, color: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {isMobile && (
                                <IconButton color="primary" onClick={() => setSidebarOpen(true)}><MenuIcon /></IconButton>
                            )}
                            <Avatar src={activeChat.otherUser?.avatar} sx={{ width: 40, height: 40, bgcolor: '#00e5ff', color: '#040712' }}>{activeChat.isGroup ? <GroupIcon /> : <PersonIcon />}</Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="800">
                                    {activeChat.isGroup ? activeChat.groupName : (nicknames[activeChat.participants?.find(p => p !== (user.id || user._id))] || activeChat.otherUser?.displayName || activeChat.otherUser?.name || "Private Chat")}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {someoneRecording ? "recording..." : (someoneTyping ? "typing..." : <><LockIcon sx={{ fontSize: '0.8rem' }} /> Quantum Encrypted</>)}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Wallpaper">
                                <IconButton color="primary" size="small" component="label"><ImageIcon /><input type="file" hidden accept="image/*" onChange={handleWallpaperUpload} /></IconButton>
                            </Tooltip>
                        </Box>
                    </Paper>

                    <Box sx={{ 
                        flex: 1, overflowY: 'auto', p: isMobile ? 2 : 4, display: 'flex', flexDirection: 'column', gap: 2.5, 
                        backgroundImage: activeChat.wallpaperUrl ? `url(${activeChat.wallpaperUrl})` : 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.05) 0%, transparent 100%)',
                        backgroundSize: 'cover', backgroundAttachment: 'fixed', bgcolor: '#040712'
                    }}>
                        {messages.map((msg, i) => {
                            const isMine = msg.senderId === (user.id || user._id);
                            const msgId = msg.id || msg._id || `m-${i}`;
                            const isEnc = encryptedMsgIds.has(msgId);
                            const isPeeking = peekingMsgIds.has(msgId);
                            const showEncrypted = isEnc && !isPeeking;
                            
                            return (
                                <Box key={msgId} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                    <Paper 
                                        onClick={() => !isMine && handlePeek(msgId)}
                                        sx={{ 
                                            p: 2, maxWidth: isMobile ? '85%' : '70%', borderRadius: isMine ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                                            bgcolor: isMine ? '#00e5ff' : 'rgba(255,255,255,0.05)', 
                                            color: isMine ? '#040712' : '#fff',
                                            cursor: !isMine && showEncrypted ? 'help' : 'default',
                                            position: 'relative',
                                            boxShadow: isMine ? '0 10px 20px rgba(0,229,255,0.15)' : 'none',
                                            border: '1px solid',
                                            borderColor: isMine ? 'transparent' : 'rgba(255,255,255,0.1)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': { transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        {msg.messageType === 'image' && msg.mediaUrl && <img src={msg.mediaUrl} style={{ maxWidth: '100%', borderRadius: 16, marginBottom: 8 }} />}
                                        {msg.messageType === 'voice' && msg.mediaUrl && <audio src={msg.mediaUrl} controls style={{ maxWidth: '210px', height: '32px', filter: isMine ? 'invert(1)' : 'none' }} />}
                                        
                                        {showEncrypted ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <LockIcon sx={{ fontSize: '1rem', color: '#00e5ff' }} />
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: '2px', opacity: 0.6, fontSize: '0.7rem' }}>
                                                    {visualEncrypt(msg.text)}
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                {msg.text || msg.encryptedMessage}
                                            </Typography>
                                        )}
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, opacity: 0.5, gap: 1 }}>
                                            {isPeeking && <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 'bold' }}>PEEKING</Typography>}
                                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                                {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>

                    <Box component="form" onSubmit={handleSend} sx={{ p: isMobile ? 2 : 3, bgcolor: 'rgba(5, 10, 21, 0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,229,255,0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.03)', p: 0.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <IconButton component="label" size="small" sx={{ color: '#00e5ff' }}><ImageIcon /><input type="file" hidden accept="image/*" onChange={handleImageSelect} /></IconButton>
                            <IconButton color={isRecording ? "error" : "primary"} size="small" onClick={isRecording ? stopRecording : startRecording}><MicIcon /></IconButton>
                            <TextField 
                                fullWidth 
                                variant="standard" 
                                placeholder="Write a secure message..." 
                                value={msgInput} 
                                onChange={handleTyping}
                                InputProps={{ disableUnderline: true, sx: { color: '#fff', px: 1, fontSize: '0.9rem' } }}
                            />
                            <IconButton type="submit" sx={{ bgcolor: '#00e5ff', color: '#040712', '&:hover': { bgcolor: '#00b8cc' }, width: 40, height: 40 }}><SendIcon sx={{ fontSize: '1.2rem' }} /></IconButton>
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#040712' }}>
                    {isMobile && (
                        <Button variant="contained" onClick={() => setSidebarOpen(true)} startIcon={<MenuIcon />} sx={{ bgcolor: '#00e5ff', color: '#040712', mb: 4, borderRadius: 4 }}>Open All Chats</Button>
                    )}
                    <LockIcon sx={{ fontSize: 120, color: 'rgba(0,229,255,0.05)', mb: 2 }} />
                    <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>End-to-End Encrypted</Typography>
                </Box>
            )}

            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} PaperProps={{ sx: { bgcolor: '#050a15', backgroundImage: 'none', border: '1px solid rgba(0,229,255,0.2)', borderRadius: 4 } }}>
                <DialogTitle sx={{ color: '#fff', fontWeight: 800 }}>Security Identity</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pt: 1 }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
                            badgeContent={<IconButton component="label" size="small" sx={{ bgcolor: '#00e5ff', color: '#040712' }}><PhotoCameraIcon fontSize="inherit"/><input type="file" hidden accept="image/*" onChange={(e)=>{
                                const f = e.target.files[0];
                                if(f){ setNewAvatar(f); setAvatarPreview(URL.createObjectURL(f)); }
                            }}/></IconButton>}>
                            <Avatar src={avatarPreview} sx={{ width: 100, height: 100, border: '3px solid #00e5ff' }} />
                        </Badge>
                        <TextField fullWidth label="Digital Display Name" value={newDisplayName} onChange={(e)=>setNewDisplayName(e.target.value)} 
                            sx={{ '& label': { color: 'rgba(255,255,255,0.5)' }, '& input': { color: '#fff' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(0,229,255,0.1)' }, '&:hover fieldset': { borderColor: '#00e5ff' } } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setSettingsOpen(false)} sx={{ color: 'rgba(255,255,255,0.3)' }}>Discard</Button>
                    <Button variant="contained" onClick={handleUpdateProfile} sx={{ bgcolor: '#00e5ff', color: '#040712', fontWeight: 'bold' }}>Update Identity</Button>
                </DialogActions>
            </Dialog>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); borderRadius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(0,229,255,0.5); }
            `}</style>
        </Box>
    );
}

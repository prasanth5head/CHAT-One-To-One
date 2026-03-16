import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { userAPI, mediaAPI } from '../services/api';
import { 
    Box, Typography, TextField, IconButton, List, ListItem, ListItemAvatar, 
    ListItemText, Avatar, Paper, InputAdornment, Badge, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
    useMediaQuery, useTheme, Drawer, Fab, Divider, Chip, LinearProgress
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
    Menu as MenuIcon,
    Done as DoneIcon,
    DoneAll as DoneAllIcon,
    Add as AddIcon,
    AttachFile as FileIcon,
    Description as DocumentIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon
} from '@mui/icons-material';

const visualEncrypt = (text) => {
    if (!text) return "";
    const symbols = "▰▱▲△▴▵▼▽▲△▴▾◁▷◆◇◈◉◊○◌⦿๏ʘ";
    return text.split('').map(() => symbols[Math.floor(Math.random() * symbols.length)]).join('');
};

const ENCRYPT_AFTER_SECONDS = 30;

export default function ChatPage() {
    const { user, logout } = useAuth();
    const { 
        chats, activeChat, messages, selectChat, sendMessage, sendReaction,
        sendActivity, activityStatus, presenceStatus, createChat, createGroup,
        nicknames, setNickname, updateChatWallpaper, deleteChat, deleteMessage, syncKeys, socketConnected
    } = useChat();
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // State
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [msgInput, setMsgInput] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [groupModalOpen, setGroupModalOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [reactionMenuMsgId, setReactionMenuMsgId] = useState(null);

    // Profile States
    const [newDisplayName, setNewDisplayName] = useState(user?.displayName || "");
    const [newBio, setNewBio] = useState(user?.bio || "");
    const [newAvatar, setNewAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

    // Media States
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordTime, setRecordTime] = useState(0);

    // Encryption States
    const [encryptedMsgIds, setEncryptedMsgIds] = useState(new Set());
    const [peekingMsgIds, setPeekingMsgIds] = useState(new Set());
    const encryptTimers = useRef({}); 
    
    const messagesEndRef = useRef(null);
    const mediaRecorder = useRef(null);
    const timerRef = useRef(null);

    // Auto-Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
        // Fallback for media loading
        const timer = setTimeout(scrollToBottom, 100);
        return () => clearTimeout(timer);
    }, [messages]);

    // Auto-Encrypt logic
    useEffect(() => {
        const myId = user?.id || user?._id;
        messages.forEach(msg => {
            const msgId = msg.id || msg._id;
            if (msg.senderId !== myId && msg.messageType === 'text' && !encryptTimers.current[msgId]) {
                encryptTimers.current[msgId] = setTimeout(() => {
                    setEncryptedMsgIds(prev => new Set(prev).add(msgId));
                }, ENCRYPT_AFTER_SECONDS * 1000);
            }
        });
        return () => {
            Object.values(encryptTimers.current).forEach(clearTimeout);
        };
    }, [messages, user]);

    useEffect(() => {
        setEncryptedMsgIds(new Set());
        setPeekingMsgIds(new Set());
    }, [activeChat?.id || activeChat?._id]);

    const handlePeek = (msgId) => {
        if (!encryptedMsgIds.has(msgId)) return;
        setPeekingMsgIds(prev => new Set(prev).add(msgId));
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
        } else { setSearchResults([]); }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if ((!msgInput.trim() && !selectedImage && !audioBlob && !selectedFile) || !activeChat) return;

        setUploading(true);
        let mediaUrl = null;
        let messageType = 'text';
        try {
            if (selectedImage) {
                const up = await mediaAPI.uploadMedia(selectedImage, 'image');
                mediaUrl = up.data; messageType = 'image';
            } else if (audioBlob) {
                const up = await mediaAPI.uploadMedia(audioBlob, 'video');
                mediaUrl = up.data; messageType = 'voice';
            } else if (selectedFile) {
                const up = await mediaAPI.uploadMedia(selectedFile, 'auto');
                mediaUrl = up.data; messageType = 'file';
            }
            sendMessage(msgInput || (messageType === 'file' ? selectedFile.name : null), mediaUrl, messageType);
            setMsgInput(""); setSelectedImage(null); setImagePreview(null); setAudioBlob(null); setSelectedFile(null);
            sendActivity({ typing: false, recording: false });
        } catch (e) { } finally { setUploading(false); }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.current.onstop = () => {
                setAudioBlob(new Blob(chunks, { type: 'audio/webm' }));
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.current.start();
            setIsRecording(true); setRecordTime(0);
            timerRef.current = setInterval(() => setRecordTime(v => v + 1), 1000);
            sendActivity({ typing: !!msgInput, recording: true });
        } catch (err) { alert("Microphone access denied."); }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop(); setIsRecording(false);
            clearInterval(timerRef.current);
            sendActivity({ typing: !!msgInput, recording: false });
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
                avatar: avatarUrl,
                bio: newBio
            });
            localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
            window.location.reload();
        } catch (e) { }
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedMembers.length === 0) return;
        await createGroup(groupName, selectedMembers.map(m => m.id || m._id));
        setGroupModalOpen(false); setGroupName(""); setSelectedMembers([]);
    };

    if (!user) return null;

    // ── Sidebar Content ───────────────────────────────────────────────────────
    const SidebarContent = (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(5, 10, 21, 0.98)', backdropFilter: 'blur(20px)', color: '#fff' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={user.avatar} sx={{ border: '2px solid #00e5ff', width: 44, height: 44 }} />
                    <Box>
                        <Typography variant="subtitle2" fontWeight="800">{user.displayName || user.name || 'Operative'}</Typography>
                        <Typography variant="caption" sx={{ color: socketConnected ? '#00e5ff' : '#ff4444', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: socketConnected ? '#00e5ff' : '#ff4444', borderRadius: '50%', boxShadow: socketConnected ? '0 0 10px #00e5ff' : 'none' }} /> {socketConnected ? 'Link Active' : 'Link Severed'}
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <IconButton size="small" onClick={() => setGroupModalOpen(true)} sx={{ color: '#00e5ff' }}><AddIcon fontSize="small"/></IconButton>
                    <IconButton size="small" onClick={() => setSettingsOpen(true)} sx={{ color: '#00e5ff' }}><SettingsIcon fontSize="small"/></IconButton>
                    <IconButton size="small" onClick={() => { logout(); navigate('/login'); }} color="error"><ExitToAppIcon fontSize="small" /></IconButton>
                </Box>
            </Box>

            <Box sx={{ p: 2 }}>
                <TextField fullWidth size="small" placeholder="Secure search..." value={searchEmail} onChange={handleSearch}
                    InputProps={{ 
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#00e5ff' }} /></InputAdornment>, 
                        sx: { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', color: '#fff', '& fieldset': { borderColor: 'rgba(0,229,255,0.1)' } }
                    }} 
                />
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                {chats.map(chat => {
                    const chatId = chat.id || chat._id;
                    const isSelected = (activeChat?.id || activeChat?._id) === chatId;
                    const otherId = chat.participants.find(p => p !== (user.id || user._id));
                    const name = chat.isGroup ? chat.groupName : (nicknames[otherId] || chat.otherUser?.displayName || 'Private Chat');
                    const isOnline = presenceStatus[otherId] === 'online';
                    const actStatus = activityStatus[chatId];
                    const activeText = actStatus ? (Object.values(actStatus).some(s => s.recording) ? "recording voice..." : (Object.values(actStatus).some(s => s.typing) ? "typing..." : null)) : null;

                    return (
                        <ListItem key={chatId} 
                            sx={{ borderRadius: 2, mb: 0.5, bgcolor: isSelected ? 'rgba(0,229,255,0.08)' : 'transparent', cursor: 'pointer', transition: '0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' } }}
                            secondaryAction={
                                <IconButton edge="end" size="small" onClick={(e) => { e.stopPropagation(); if(window.confirm('Erase this neural link from records?')) deleteChat(chatId); }} sx={{ color: 'rgba(255,255,255,0.2)', '&:hover': { color: '#ff4444' } }}>
                                    <DeleteIcon fontSize="inherit" />
                                </IconButton>
                            }
                        >
                            <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }} onClick={() => { selectChat(chat); if(isMobile) setSidebarOpen(false); }}>
                                <ListItemAvatar>
                                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color={isOnline ? "success" : "default"} invisible={chat.isGroup}>
                                        <Avatar src={chat.otherUser?.avatar} sx={{ width: 48, height: 48, border: isSelected ? '2px solid #00e5ff' : 'none', opacity: isOnline || chat.isGroup ? 1 : 0.5 }}>
                                            {chat.isGroup ? <GroupIcon /> : <PersonIcon />}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="subtitle2" sx={{ fontWeight: isSelected ? 800 : 500 }}>{name}</Typography><Typography variant="caption" sx={{ opacity: 0.4 }}>{chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Typography></Box>} 
                                    secondary={activeText || chat.lastMessage || "Identity verified"}
                                    secondaryTypographyProps={{ color: activeText ? '#00e5ff' : 'rgba(255,255,255,0.5)', noWrap: true, sx: { fontSize: '0.75rem' } }} 
                                />
                            </Box>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#040712', overflow: 'hidden' }}>
            {isMobile ? (
                <Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)} PaperProps={{ sx: { width: '80vw', maxWidth: '300px', bgcolor: 'transparent', boxShadow: 'none' } }}>
                    {SidebarContent}
                </Drawer>
            ) : (
                <Box sx={{ width: 340, borderRight: '1px solid rgba(0,229,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                    {SidebarContent}
                </Box>
            )}

            {activeChat ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <Paper elevation={0} sx={{ height: 72, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0, bgcolor: 'rgba(5, 10, 21, 0.9)', backdropFilter: 'blur(15px)', borderBottom: '1px solid rgba(0,229,255,0.1)', zIndex: 1, color: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {isMobile && <IconButton onClick={() => setSidebarOpen(true)} sx={{ color: '#00e5ff' }}><MenuIcon /></IconButton>}
                            <Avatar src={activeChat.otherUser?.avatar} sx={{ width: 44, height: 44 }}>
                                {activeChat.isGroup ? <GroupIcon /> : <PersonIcon />}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="800">
                                    {activeChat.isGroup ? activeChat.groupName : (nicknames[activeChat.participants.find(p => p !== (user.id || user._id))] || activeChat.otherUser?.displayName || 'Secure Link')}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#00e5ff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    {presenceStatus[activeChat.participants.find(p => p !== user.id)] === 'online' ? <><Box sx={{ width: 6, height: 6, bgcolor: '#4caf50', borderRadius: '50%' }} /> Live Connection</> : <><LockIcon sx={{ fontSize: '0.8rem' }} /> Neural Secured</>}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Resync Neural Link"><IconButton sx={{ color: '#00e5ff' }} onClick={syncKeys}><GppGoodIcon /></IconButton></Tooltip>
                            <Tooltip title="Neural Files"><IconButton sx={{ color: '#00e5ff' }} component="label"><FileIcon /><input type="file" hidden onChange={(e) => { const f = e.target.files[0]; if(f) setSelectedFile(f); }} /></IconButton></Tooltip>
                            <Tooltip title="Neural Images"><IconButton sx={{ color: '#00e5ff' }} component="label"><ImageIcon /><input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setSelectedImage(f); setImagePreview(URL.createObjectURL(f)); } }} /></IconButton></Tooltip>
                            <IconButton sx={{ color: '#00e5ff' }} onClick={() => setSettingsOpen(true)}><SettingsIcon /></IconButton>
                        </Box>
                    </Paper>

                    {uploading && <LinearProgress sx={{ position: 'absolute', top: 72, left: 0, right: 0, zIndex: 2, height: 2, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: '#00e5ff' } }} />}

                    <Box 
                        id="neural-message-feed"
                        sx={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            p: isMobile ? 2 : 4, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 3, 
                            backgroundImage: activeChat.wallpaperUrl ? `url(${activeChat.wallpaperUrl})` : 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.02) 0%, transparent 100%)',
                            backgroundSize: 'cover', 
                            bgcolor: '#040712',
                            scrollBehavior: 'smooth'
                        }}
                    >
                        {messages.map((msg, i) => {
                            const isMine = msg.senderId === (user.id || user._id);
                            const msgId = msg.id || msg._id || `m-${i}`;
                            const isEnc = encryptedMsgIds.has(msgId);
                            const isPeeking = peekingMsgIds.has(msgId);
                            const showEnc = isEnc && !isPeeking;

                            return (
                                <Box key={msgId} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', position: 'relative' }}>
                                    <Box onMouseEnter={() => setReactionMenuMsgId(msgId)} onMouseLeave={() => setReactionMenuMsgId(null)}>
                                        <Paper 
                                            onClick={() => !isMine && handlePeek(msgId)}
                                            sx={{ 
                                                p: 1.5, px: 2, maxWidth: isMobile ? '85vw' : '70%', borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                bgcolor: isMine ? '#00e5ff' : 'rgba(255,255,255,0.04)', color: isMine ? '#040712' : '#fff',
                                                cursor: showEnc ? 'help' : 'default', border: '1px solid rgba(255,255,255,0.05)',
                                                boxShadow: isMine ? '0 10px 20px rgba(0,229,255,0.1)' : 'none',
                                                transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: isMine ? '#00e5ff' : 'rgba(255,255,255,0.07)' }
                                            }}
                                        >
                                            {msg.messageType === 'image' && msg.mediaUrl && <img src={msg.mediaUrl} style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 8, display: 'block' }} />}
                                            {msg.messageType === 'voice' && msg.mediaUrl && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 200, py: 0.5 }}>
                                                    <Fab size="small" sx={{ bgcolor: isMine ? '#040712' : '#00e5ff', color: isMine ? '#fff' : '#040712', width: 32, height: 32, minHeight: 0 }} onClick={() => {
                                                        const audio = new Audio(msg.mediaUrl); audio.play();
                                                    }}><PlayIcon /></Fab>
                                                    <Box sx={{ flex: 1, height: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                                                    <Typography variant="caption" sx={{ opacity: 0.6 }}>Voice Link</Typography>
                                                </Box>
                                            )}
                                            {msg.messageType === 'file' && msg.mediaUrl && (
                                                <Button size="small" variant="text" href={msg.mediaUrl} target="_blank" startIcon={<DocumentIcon />} sx={{ color: isMine ? '#040712' : '#00e5ff', textTransform: 'none', fontWeight: 600 }}>
                                                    {msg.text || "View Neutral File"}
                                                </Button>
                                            )}
                                            
                                            {showEnc ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LockIcon sx={{ fontSize: '1rem', color: '#00e5ff' }} />
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', opacity: 0.6, fontSize: '0.75rem', letterSpacing: '1px' }}>{visualEncrypt(msg.text || msg.encryptedMessage)}</Typography>
                                                </Box>
                                            ) : (
                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.92rem' }}>{msg.text || msg.encryptedMessage}</Typography>
                                            )}

                                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, opacity: 0.5, gap: 0.8, alignItems: 'center' }}>
                                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                {isMine && (msg.status === 'read' ? <DoneAllIcon sx={{ fontSize: '0.95rem', color: '#fff' }} /> : <DoneIcon sx={{ fontSize: '0.95rem' }} />)}
                                            </Box>

                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                                                    {msg.reactions.map((r, ri) => (
                                                        <Chip key={ri} label={r.emoji} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', color: '#fff', fontSize: '0.7rem', height: 20 }} />
                                                    ))}
                                                </Box>
                                            )}
                                        </Paper>

                                        {reactionMenuMsgId === msgId && !showEnc && (
                                            <Paper sx={{ position: 'absolute', top: -45, [isMine ? 'right' : 'left']: 0, p: 0.5, display: 'flex', gap: 0.2, bgcolor: 'rgba(5,10,21,0.95)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: 5, zIndex: 10, boxShadow: '0 5px 15px rgba(0,0,0,0.5)' }}>
                                                {['❤️', '😂', '😮', '😢', '🔥', '👍'].map(emoji => (
                                                    <IconButton key={emoji} size="small" onClick={() => sendReaction(msgId, emoji)} sx={{ fontSize: '1.2rem', p: 0.6, transition: '0.2s', '&:hover': { transform: 'scale(1.3)' } }}>{emoji}</IconButton>
                                                ))}
                                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }} />
                                                <IconButton size="small" onClick={() => { if(window.confirm('Delete this neural record?')) deleteMessage(msgId); }} sx={{ color: '#ff4444', p: 0.6, '&:hover': { bgcolor: 'rgba(255,68,68,0.1)' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Paper>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input */}
                    <Box component="form" onSubmit={handleSend} sx={{ p: 2, bgcolor: 'rgba(5, 10, 21, 0.98)', borderTop: '1px solid rgba(0,229,255,0.1)' }}>
                        {(imagePreview || selectedFile) && (
                            <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
                                {imagePreview && <Box sx={{ position: 'relative' }}><img src={imagePreview} style={{ height: 70, borderRadius: 10, border: '1px solid #00e5ff' }} /><IconButton size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#040712', border: '1px solid #00e5ff', color: '#00e5ff' }} onClick={() => setImagePreview(null)}><CloseIcon fontSize="inherit"/></IconButton></Box>}
                                {selectedFile && <Chip icon={<DocumentIcon />} label={selectedFile.name} onDelete={() => setSelectedFile(null)} sx={{ bgcolor: 'rgba(0,229,255,0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }} />}
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(255,255,255,0.03)', p: 0.8, px: 2, borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Tooltip title={isRecording ? "Stop Neural Link" : "Microvoice Link"}>
                                <IconButton sx={{ bgcolor: isRecording ? '#f44336' : 'transparent', color: isRecording ? '#fff' : '#00e5ff' }} onClick={isRecording ? stopRecording : startRecording}>
                                    {isRecording ? <StopIcon /> : <MicIcon />}
                                </IconButton>
                            </Tooltip>
                            <TextField fullWidth variant="standard" placeholder={isRecording ? `Encoding voice... ${recordTime}s` : "Link neural data..."} value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onFocus={() => sendActivity({ typing: true })} onBlur={() => sendActivity({ typing: false })} InputProps={{ disableUnderline: true, sx: { color: '#fff', fontSize: '1rem' } }} />
                            <IconButton type="submit" disabled={uploading} sx={{ bgcolor: '#00e5ff', color: '#040712', width: 44, height: 44, '&:hover': { bgcolor: '#00b8cc', transform: 'rotate(-45deg)' }, transition: '0.3s' }}><SendIcon /></IconButton>
                        </Box>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                        <LockIcon sx={{ fontSize: 130, color: 'rgba(0,229,255,0.1)' }} />
                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 80, height: 80, border: '4px solid #00e5ff', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 2s linear infinite' }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#00e5ff', letterSpacing: 2 }}>QUANTUM SECURE</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.3 }}>Establish neural data link to begin</Typography>
                </Box>
            )}

            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} PaperProps={{ sx: { bgcolor: '#050a15', border: '1px solid #00e5ff', borderRadius: 5, color: '#fff', maxWidth: 450 } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.5rem', color: '#00e5ff' }}>Identity Calibration</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2, alignItems: 'center' }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={<IconButton component="label" sx={{ bgcolor: '#00e5ff', color: '#000', '&:hover': { bgcolor: '#00b8cc' } }} size="small"><PhotoCameraIcon fontSize="inherit"/><input type="file" hidden accept="image/*" onChange={(e) => { const f = e.target.files[0]; if(f){ setNewAvatar(f); setAvatarPreview(URL.createObjectURL(f)); } }}/></IconButton>}>
                            <Avatar src={avatarPreview} sx={{ width: 120, height: 120, border: '4px solid #00e5ff', boxShadow: '0 0 30px rgba(0,229,255,0.2)' }} />
                        </Badge>
                        <TextField fullWidth label="Neural Signature" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} variant="outlined" sx={{ '& label': { color: '#00e5ff' }, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(0,229,255,0.3)' } } }} />
                        <TextField fullWidth label="Biometric Bio" multiline rows={3} value={newBio} onChange={(e) => setNewBio(e.target.value)} variant="outlined" sx={{ '& label': { color: '#00e5ff' }, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(0,229,255,0.3)' } } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}><Button onClick={() => setSettingsOpen(false)} sx={{ color: 'rgba(255,255,255,0.4)' }}>Abort</Button><Button variant="contained" onClick={handleUpdateProfile} sx={{ bgcolor: '#00e5ff', color: '#000', fontWeight: 800 }}>Update Identity</Button></DialogActions>
            </Dialog>

            <Dialog open={groupModalOpen} onClose={() => setGroupModalOpen(false)} PaperProps={{ sx: { bgcolor: '#050a15', border: '1px solid #00e5ff', borderRadius: 5, color: '#fff', width: 420 } }}>
                <DialogTitle sx={{ fontWeight: 900, color: '#00e5ff' }}>Assemble Tactical Unit</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Unit Identification" value={groupName} onChange={(e) => setGroupName(e.target.value)} sx={{ mb: 4, mt: 1, '& label': { color: '#00e5ff' } }} />
                    <Typography variant="caption" sx={{ color: '#00e5ff', fontWeight: 800, mb: 1, display: 'block' }}>RECRUIT OPERATIVES</Typography>
                    <List sx={{ maxHeight: 250, overflow: 'auto', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
                        {chats.filter(c => !c.isGroup).map(c => {
                            const u = c.otherUser;
                            const isSel = selectedMembers.find(m => m.id === (u.id || u._id));
                            return (
                                <ListItem key={u.id} button onClick={() => setSelectedMembers(prev => isSel ? prev.filter(m => m.id !== (u.id || u._id)) : [...prev, u])} sx={{ transition: '0.2s', bgcolor: isSel ? 'rgba(0,229,255,0.1)' : 'transparent' }}>
                                    <ListItemAvatar><Avatar src={u.avatar} /></ListItemAvatar>
                                    <ListItemText primary={u.displayName || u.name} secondary={isSel ? "READY" : "WAITING"} secondaryTypographyProps={{ color: isSel ? '#00e5ff' : 'rgba(255,255,255,0.3)', sx: { fontSize: '0.6rem', fontWeight: 800 } }} />
                                    {isSel && <DoneIcon sx={{ color: '#00e5ff' }} />}
                                </ListItem>
                            );
                        })}
                    </List>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}><Button onClick={() => setGroupModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.4)' }}>Abort</Button><Button variant="contained" disabled={!groupName || selectedMembers.length === 0} onClick={handleCreateGroup} sx={{ bgcolor: '#00e5ff', color: '#040712', fontWeight: 800 }}>Initialize Unit</Button></DialogActions>
            </Dialog>

            <style>{`
                @keyframes spin { 100% { transform: translate(-50%, -50%) rotate(360deg); } }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.15); borderRadius: 10px; }
                ::placeholder { color: rgba(255,255,255,0.2) !important; }
            `}</style>
        </Box>
    );
}

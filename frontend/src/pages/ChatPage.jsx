import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { userAPI, mediaAPI } from '../services/api';
import { 
    Box, Typography, TextField, IconButton, List, ListItem, ListItemAvatar, 
    ListItemText, Avatar, Paper, InputAdornment, Badge, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
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
    Delete as DeleteIcon
} from '@mui/icons-material';

export default function ChatPage() {
    const { user, logout } = useAuth();
    const { 
        chats, activeChat, messages, selectChat, sendMessage, 
        loadChats, sendActivity, activityStatus, createChat,
        nicknames, setNickname, updateChatWallpaper, deleteChat, deleteMessage
    } = useChat();
    const navigate = useNavigate();

    // UI States
    const [msgInput, setMsgInput] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    // User Profile Update States
    const [newDisplayName, setNewDisplayName] = useState(user?.displayName || "");
    const [newAvatar, setNewAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");

    // Media States
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordTime, setRecordTime] = useState(0);
    
    const messagesEndRef = useRef(null);
    const mediaRecorder = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            // Update local state
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            // Trigger a re-render/logic update by calling login with same token
            window.location.reload(); // Simplest way to broadcast profile change
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

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            {/* Sidebar */}
            <Box sx={{ width: 320, borderRight: '1px solid rgba(0,229,255,0.1)', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', zIndex: 2 }}>
                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} sx={{ border: '2px solid rgba(0,229,255,0.5)' }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold">{user.displayName || user.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#00e5ff' }}>Online</Typography>
                        </Box>
                    </Box>
                    <Box>
                        <IconButton onClick={() => setSettingsOpen(true)} size="small" color="primary"><SettingsIcon fontSize="small"/></IconButton>
                        <IconButton onClick={() => { logout(); navigate('/login'); }} size="small" color="error"><ExitToAppIcon fontSize="small" /></IconButton>
                    </Box>
                </Box>

                {/* Search */}
                <Box sx={{ p: 2, position: 'relative' }}>
                    <TextField fullWidth size="small" placeholder="Search friends..." value={searchEmail} onChange={handleSearch}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="primary" /></InputAdornment>, sx: { borderRadius: 6, bgcolor: 'rgba(0,0,0,0.3)' }}} />
                    {searchResults.length > 0 && (
                        <Paper elevation={16} sx={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 10, bgcolor: 'background.paper', border: '1px solid #00e5ff' }}>
                            <List sx={{ p: 0 }}>
                                {searchResults.map(u => (
                                    <ListItem key={u.id || u._id} button onClick={() => handleCreateChat(u)}>
                                        <ListItemAvatar><Avatar src={u.avatar} sx={{ width: 32, height: 32 }} /></ListItemAvatar>
                                        <ListItemText primary={u.displayName || u.name} secondary={u.email} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>

                {/* Chat List */}
                <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                    {chats.map(chat => {
                        const chatId = chat.id || chat._id;
                        const isSelected = (activeChat?.id || activeChat?._id) === chatId;
                        const otherId = !chat.isGroup ? chat.participants.find(p => p !== (user.id || user._id)) : null;
                        const nickname = otherId ? nicknames[otherId] : null;
                        const chatName = chat.isGroup ? chat.groupName : (nickname || chat.otherUser?.displayName || chat.otherUser?.name || "Direct Chat");
                        const status = activityStatus[chatId];
                        const someoneRecording = status ? Object.values(status).some(s => s.recording) : false;
                        const someoneTyping = status ? Object.values(status).some(s => s.typing) : false;

                        return (
                            <ListItem key={chatId} button onClick={() => selectChat(chat)} 
                                sx={{ 
                                    borderRadius: 2, mb: 0.5, 
                                    bgcolor: isSelected ? 'rgba(0,229,255,0.15)' : 'transparent', 
                                    border: isSelected ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
                                    position: 'relative',
                                    '&:hover .delete-chat-btn': { opacity: 1 }
                                }}
                            >
                                <ListItemAvatar>
                                    <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success" invisible={!someoneTyping && !someoneRecording}>
                                        <Avatar sx={{ border: '1px solid #00e5ff' }}>{chat.isGroup ? <GroupIcon /> : <PersonIcon />}</Avatar>
                                    </Badge>
                                </ListItemAvatar>
                                <ListItemText primary={chatName} secondary={someoneRecording ? "recording..." : (someoneTyping ? "typing..." : (chat.lastMessage || "No messages"))}
                                    secondaryTypographyProps={{ color: (someoneTyping || someoneRecording) ? 'primary.main' : 'text.secondary', noWrap: true, sx: { maxWidth: '140px' } }} />
                                
                                <IconButton 
                                    className="delete-chat-btn"
                                    size="small" 
                                    sx={{ 
                                        opacity: 0, position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                        color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'error.main' }, transition: 'opacity 0.2s'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm("Delete this chat and all messages?")) deleteChat(chatId);
                                    }}
                                >
                                    <DeleteIcon fontSize="inherit" />
                                </IconButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Main Chat Area */}
            {activeChat ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    {/* Header */}
                    <Paper elevation={4} sx={{ height: 64, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0, bgcolor: 'rgba(13, 24, 46, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', color: '#000' }}>{activeChat.isGroup ? <GroupIcon /> : <PersonIcon />}</Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    {!activeChat.isGroup && nicknames[activeChat.participants.find(p => p !== (user.id || user._id))] 
                                        || (activeChat.isGroup ? activeChat.groupName : (activeChat.otherUser?.displayName || activeChat.otherUser?.name))}
                                </Typography>
                                <Typography variant="caption" color="primary.main">
                                    {someoneRecording ? "recording..." : (someoneTyping ? "typing..." : "Encrypted")}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Set Chat Wallpaper">
                                <IconButton color="primary" component="label"><ImageIcon /><input type="file" hidden accept="image/*" onChange={handleWallpaperUpload} /></IconButton>
                            </Tooltip>
                            {!activeChat.isGroup && (
                                <Tooltip title="Set Nickname">
                                    <IconButton color="primary" onClick={() => {
                                        const nick = prompt("Enter nickname for this friend:");
                                        if (nick !== null) setNickname(activeChat.participants.find(p => p !== (user.id || user._id)), nick);
                                    }}><EmojiIcon /></IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Paper>

                    {/* Messages */}
                    <Box sx={{ 
                        flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, 
                        backgroundImage: activeChat.wallpaperUrl ? `url(${activeChat.wallpaperUrl})` : 'none',
                        backgroundSize: 'cover', backgroundPosition: 'center', bgcolor: '#050a15' 
                    }}>
                        {messages.map((msg, i) => {
                            const isMine = msg.senderId === (user.id || user._id);
                            return (
                                <Box key={i} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', position: 'relative', '&:hover .delete-msg-btn': { opacity: 1 } }}>
                                    <Paper sx={{ 
                                        p: 1.5, maxWidth: '75%', borderRadius: isMine ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                        bgcolor: isMine ? 'primary.main' : 'rgba(255,255,255,0.08)', color: isMine ? '#000' : '#fff',
                                        position: 'relative'
                                    }}>
                                        {msg.messageType === 'image' && <img src={msg.mediaUrl} style={{ maxWidth: '100%', borderRadius: 8, mb: 1 }} />}
                                        {msg.messageType === 'voice' && <audio src={msg.mediaUrl} controls style={{ maxWidth: '200px', filter: isMine ? 'invert(1)' : 'none' }} />}
                                        <Typography variant="body2">{msg.text}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', opacity: 0.6, mt: 0.5 }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                        
                                        <IconButton 
                                            className="delete-msg-btn"
                                            size="small" 
                                            sx={{ 
                                                opacity: 0, position: 'absolute', 
                                                top: -10, [isMine ? 'left' : 'right']: -30,
                                                color: 'rgba(255,255,255,0.3)', '&:hover': { color: 'error.main' },
                                                transition: 'opacity 0.2s'
                                            }}
                                            onClick={() => {
                                                if (window.confirm("Delete this message?")) deleteMessage(msg.id || msg._id);
                                            }}
                                        >
                                            <DeleteIcon fontSize="inherit" />
                                        </IconButton>
                                    </Paper>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Media Previews */}
                    {imagePreview && (
                        <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <img src={imagePreview} style={{ height: 50, borderRadius: 4 }} />
                            <IconButton color="error" onClick={() => { setSelectedImage(null); setImagePreview(null); }}><CloseIcon /></IconButton>
                        </Box>
                    )}
                    {isRecording && (
                        <Box sx={{ p: 1, bgcolor: 'rgba(211,47,47,0.2)', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 10, height: 10, bgcolor: 'error.main', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                            <Typography color="error">Recording... {recordTime}s</Typography>
                        </Box>
                    )}

                    {/* Input */}
                    <Box component="form" onSubmit={handleSend} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper' }}>
                        <IconButton component="label" color="primary"><ImageIcon /><input type="file" hidden accept="image/*" onChange={handleImageSelect} /></IconButton>
                        <IconButton color={isRecording ? "error" : "primary"} onClick={isRecording ? stopRecording : startRecording}><MicIcon /></IconButton>
                        <TextField fullWidth size="small" placeholder="Message..." value={msgInput} onChange={handleTyping} />
                        <IconButton type="submit" color="primary" sx={{ bgcolor: 'primary.main', color: '#000', '&:hover': { bgcolor: 'primary.light' } }}><SendIcon /></IconButton>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                    <LockIcon sx={{ fontSize: 100, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5">Select a secure conversation</Typography>
                </Box>
            )}

            {/* Profile Settings Modal */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}>
                <DialogTitle>Profile Settings</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, pt: 1 }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
                            badgeContent={<IconButton component="label" size="small" sx={{ bgcolor: 'primary.main', color: '#000' }}><PhotoCameraIcon fontSize="inherit"/><input type="file" hidden accept="image/*" onChange={(e)=>{
                                const f = e.target.files[0];
                                if(f){ setNewAvatar(f); setAvatarPreview(URL.createObjectURL(f)); }
                            }}/></IconButton>}>
                            <Avatar src={avatarPreview} sx={{ width: 100, height: 100, border: '3px solid #00e5ff' }} />
                        </Badge>
                        <TextField fullWidth label="Display Name" value={newDisplayName} onChange={(e)=>setNewDisplayName(e.target.value)} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateProfile}>Save Changes</Button>
                </DialogActions>
            </Dialog>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </Box>
    );
}

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { userAPI } from '../services/api';
import { Box, Typography, TextField, IconButton, List, ListItem, ListItemAvatar, ListItemText, Avatar, Paper, InputAdornment, Badge } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LockIcon from '@mui/icons-material/Lock';

export default function ChatPage() {
    const { user, logout } = useAuth();
    const { chats, activeChat, messages, selectChat, sendMessage, loadChats, sendTyping, typingUsers, createChat } = useChat();

    const [msgInput, setMsgInput] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const messagesEndRef = useRef(null);

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

    const handleSend = (e) => {
        e.preventDefault();
        if (msgInput.trim() === '') return;
        sendMessage(msgInput, null, 'text');
        setMsgInput("");
    };

    const handleTyping = (e) => {
        setMsgInput(e.target.value);
        sendTyping(true);
        setTimeout(() => {
            sendTyping(false); // Debounce
        }, 2000);
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>

            {/* Sidebar */}
            <Box sx={{ width: 320, borderRight: '1px solid rgba(0,229,255,0.1)', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', zIndex: 2 }}>

                {/* Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success">
                            <Avatar src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} sx={{ border: '2px solid rgba(0,229,255,0.5)' }} />
                        </Badge>
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold">{user.name}</Typography>
                            <Typography variant="caption" sx={{ color: '#00e5ff', textShadow: '0 0 5px rgba(0,229,255,0.5)' }}>Online</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={logout} size="small" sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.dark', color: '#fff', boxShadow: '0 0 10px red' } }}>
                        <ExitToAppIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Search */}
                <Box sx={{ p: 2, position: 'relative' }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search users by email..."
                        value={searchEmail}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="primary" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 6, bgcolor: 'rgba(0,0,0,0.3)' }
                        }}
                    />

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <Paper elevation={16} sx={{ position: 'absolute', top: 70, left: 16, right: 16, zIndex: 10, bgcolor: 'background.paper', border: '1px solid #00e5ff', boxShadow: '0 0 15px rgba(0,229,255,0.3)' }}>
                            <List sx={{ p: 0 }}>
                                {searchResults.map(u => (
                                    <ListItem key={u.id} button onClick={() => handleCreateChat(u)} sx={{ '&:hover': { bgcolor: 'rgba(0,229,255,0.1)' } }}>
                                        <ListItemAvatar>
                                            <Avatar src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} sx={{ width: 32, height: 32, border: 'none', boxShadow: 'none' }} />
                                        </ListItemAvatar>
                                        <ListItemText primary={u.name} secondary={u.email} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Box>

                {/* Chat List */}
                <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
                    {chats.map(chat => {
                        const isSelected = activeChat?.id === chat.id;
                        return (
                            <ListItem
                                key={chat.id}
                                button
                                onClick={() => selectChat(chat)}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.5,
                                    bgcolor: isSelected ? 'rgba(0,229,255,0.15)' : 'transparent',
                                    border: isSelected ? '1px solid rgba(0,229,255,0.3)' : '1px solid transparent',
                                    boxShadow: isSelected ? 'inset 0 0 10px rgba(0,229,255,0.1)' : 'none',
                                    '&:hover': { bgcolor: isSelected ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.05)' }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : 'background.default', color: isSelected ? '#000' : 'primary.main', border: '1px solid #00e5ff', boxShadow: isSelected ? '0 0 10px rgba(0,229,255,0.8)' : 'none' }}>
                                        {chat.isGroup ? <GroupIcon /> : <PersonIcon />}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={chat.isGroup ? chat.groupName : "Direct Chat"}
                                    secondary={chat.lastMessage || "No messages yet"}
                                    primaryTypographyProps={{ variant: 'subtitle2', noWrap: true, color: isSelected ? '#fff' : 'text.primary' }}
                                    secondaryTypographyProps={{ variant: 'caption', noWrap: true, color: 'text.secondary' }}
                                />
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* Main Chat Area */}
            {activeChat ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

                    {/* Header */}
                    <Paper elevation={4} sx={{ height: 64, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0, borderBottom: '1px solid rgba(0,229,255,0.1)', bgcolor: 'rgba(13, 24, 46, 0.8)', backdropFilter: 'blur(10px)', zIndex: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', color: '#000', boxShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
                                {activeChat.isGroup ? <GroupIcon /> : <PersonIcon />}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">{activeChat.isGroup ? activeChat.groupName : "Direct Chat"}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {typingUsers[activeChat.id] ? (
                                        <span style={{ color: '#00e5ff', textShadow: '0 0 5px rgba(0,229,255,0.8)' }}>typing...</span>
                                    ) : "Click here for contact info"}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>
                            <IconButton color="primary" sx={{ '&:hover': { boxShadow: '0 0 10px rgba(0,229,255,0.3)', bgcolor: 'rgba(0,229,255,0.1)' } }}><SearchIcon /></IconButton>
                            <IconButton color="primary" sx={{ '&:hover': { boxShadow: '0 0 10px rgba(0,229,255,0.3)', bgcolor: 'rgba(0,229,255,0.1)' } }}><SettingsIcon /></IconButton>
                        </Box>
                    </Paper>

                    {/* Messages Wrapper */}
                    <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'rgba(5, 10, 21, 0.9)', backgroundImage: 'radial-gradient(circle at center, rgba(0,229,255,0.03) 0%, transparent 70%)' }}>
                        {messages.map((msg, i) => {
                            const isMine = msg.senderId === user.id;
                            return (
                                <Box key={i} sx={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                                    <Paper
                                        elevation={isMine ? 8 : 2}
                                        sx={{
                                            maxWidth: '70%', p: 1.5, px: 2,
                                            bgcolor: isMine ? 'rgba(0, 229, 255, 0.15)' : 'background.paper',
                                            color: isMine ? '#fff' : 'text.primary',
                                            borderRadius: isMine ? '20px 20px 0 20px' : '20px 20px 20px 0',
                                            border: isMine ? '1px solid rgba(0,229,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                            boxShadow: isMine ? '0 0 15px rgba(0,229,255,0.15)' : 'none',
                                        }}
                                    >
                                        {msg.messageType === 'text' && (
                                            <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
                                                {msg.text || msg.encryptedMessage}
                                            </Typography>
                                        )}
                                        {msg.messageType === 'image' && (
                                            <img src={msg.mediaUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 4 }} />
                                        )}
                                        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right', color: isMine ? 'rgba(255,255,255,0.5)' : 'text.secondary', fontSize: '0.65rem' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Paper>
                                </Box>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Paper elevation={12} component="form" onSubmit={handleSend} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 0, borderTop: '1px solid rgba(0,229,255,0.2)', bgcolor: 'background.paper', zIndex: 1 }}>
                        <IconButton color="primary" sx={{ '&:hover': { boxShadow: '0 0 10px rgba(0,229,255,0.3)', bgcolor: 'rgba(0,229,255,0.1)' } }}>
                            <AttachFileIcon />
                        </IconButton>
                        <TextField
                            fullWidth
                            variant="outlined"
                            size="small"
                            placeholder="Message securely..."
                            value={msgInput}
                            onChange={handleTyping}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 8, bgcolor: 'rgba(0,0,0,0.4)' },
                            }}
                        />
                        <IconButton
                            type="submit"
                            disabled={!msgInput.trim()}
                            sx={{
                                bgcolor: msgInput.trim() ? 'primary.main' : 'transparent',
                                color: msgInput.trim() ? '#000' : 'text.secondary',
                                '&:hover': { bgcolor: 'primary.light', boxShadow: '0 0 15px #00e5ff' },
                                transition: 'all 0.3s'
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Paper>

                </Box>
            ) : (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(5, 10, 21, 0.9)' }}>
                    <Box sx={{
                        width: 100, height: 100, borderRadius: '50%', border: '2px solid #00e5ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                        boxShadow: '0 0 30px rgba(0,229,255,0.4)', bgcolor: 'rgba(0,229,255,0.05)'
                    }}>
                        <LockIcon sx={{ fontSize: 50, color: '#00e5ff', filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.8))' }} />
                    </Box>
                    <Typography variant="h5" fontWeight="bold" sx={{ textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>SecureChat for Web</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 300, textAlign: 'center' }}>
                        End-to-end encrypted messaging. Click on a chat from the sidebar or search for users by email.
                    </Typography>
                </Box>
            )}

        </Box>
    );
}

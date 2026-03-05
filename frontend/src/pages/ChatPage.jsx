import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { LogOut, Settings, Moon, Sun, Search, Paperclip, Smile, Send, Mic, MapPin, File, Image } from 'lucide-react';
import { userAPI } from '../services/api';

export default function ChatPage({ toggleTheme, theme }) {
    const { user, logout } = useAuth();
    const { chats, activeChat, messages, selectChat, sendMessage, loadChats, sendTyping, typingUsers, createChat } = useChat();

    const [msgInput, setMsgInput] = useState("");
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
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
        // basic debounce to stop typing
        setTimeout(() => {
            sendTyping(false);
        }, 2000);
    };

    return (
        <div className="flex w-full h-screen overflow-hidden bg-background">

            {/* Sidebar */}
            <div className="w-1/4 h-full border-r border-border flex flex-col pt-4 pb-0 bg-secondary/30">

                {/* Header */}
                <div className="flex items-center justify-between px-4 mb-4">
                    <div className="flex items-center gap-3">
                        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="Profile" className="w-10 h-10 rounded-full" />
                        <div>
                            <h3 className="font-semibold text-sm">{user.name}</h3>
                            <p className="text-xs text-green-500">Online</p>
                        </div>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                        <button onClick={toggleTheme} className="p-2 hover:bg-muted rounded-full">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={logout} className="p-2 hover:bg-muted rounded-full text-red-400">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 mb-4">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search users by email..."
                            value={searchEmail}
                            onChange={handleSearch}
                            className="w-full bg-input rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-32 left-4 w-64 bg-background border border-border shadow-lg rounded-xl z-50 overflow-hidden">
                            {searchResults.map(u => (
                                <div key={u.id} className="flex items-center p-3 hover:bg-muted cursor-pointer gap-3" onClick={() => handleCreateChat(u)}>
                                    <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`} alt="avatar" className="w-8 h-8 rounded-full" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{u.name}</span>
                                        <span className="text-xs text-muted-foreground">{u.email}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto w-full px-2">
                    {chats.map(chat => {
                        const isSelected = activeChat?.id === chat.id;
                        return (
                            <div
                                key={chat.id}
                                onClick={() => selectChat(chat)}
                                className={`flex gap-3 items-center p-3 rounded-xl cursor-pointer transition-colors mb-1 ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}
                            >
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                                    {chat.isGroup ? 'G' : 'C'}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-semibold text-sm truncate">{chat.isGroup ? chat.groupName : "Direct Chat"}</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {chat.lastMessage || "No messages yet"}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Chat Area */}
            {activeChat ? (
                <div className="flex-1 flex flex-col bg-background/50 relative">

                    {/* Header */}
                    <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-secondary/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                                {activeChat.isGroup ? 'G' : 'C'}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold">{activeChat.isGroup ? activeChat.groupName : "Direct Chat"}</span>
                                <span className="text-xs text-muted-foreground">
                                    {typingUsers[activeChat.id] ? (
                                        <span className="text-primary animate-pulse">typing...</span>
                                    ) : (
                                        "Click here for contact info"
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <button className="p-2 hover:bg-muted rounded-full">
                                <Search size={20} />
                            </button>
                            <button className="p-2 hover:bg-muted rounded-full">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Wrapper */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {messages.map((msg, i) => {
                            const isMine = msg.senderId === user.id;

                            return (
                                <div key={i} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] sm:max-w-[50%] p-3 rounded-2xl flex flex-col gap-1 shadow-sm
                    ${isMine
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-secondary text-secondary-foreground rounded-tl-none border border-border'}`}>

                                        {msg.messageType === 'text' && (
                                            <p className="text-[15px] leading-relaxed break-words">{msg.text || msg.encryptedMessage}</p>
                                        )}

                                        {msg.messageType === 'image' && (
                                            <img src={msg.mediaUrl} alt="attachment" className="rounded-lg w-full max-h-60 object-cover" />
                                        )}

                                        <span className={`text-[10px] self-end mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="h-20 border-t border-border px-4 py-3 bg-secondary/50 flex items-center gap-2">
                        <button className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-full hover:bg-muted">
                            <Paperclip size={22} />
                        </button>
                        <form onSubmit={handleSend} className="flex-1 flex items-center bg-input/50 border border-border rounded-full pr-1 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/50">
                            <input
                                type="text"
                                value={msgInput}
                                onChange={handleTyping}
                                placeholder="Message securely..."
                                className="w-full bg-transparent border-none py-3 pl-5 pr-4 text-sm focus:outline-none"
                            />
                            <button type="button" className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                                <Smile size={20} />
                            </button>
                            <button type="submit" disabled={!msgInput.trim()} className={`p-2.5 rounded-full flex items-center justify-center transition-all ${msgInput.trim() ? 'bg-primary text-white scale-100 hover:scale-105' : 'bg-transparent text-muted-foreground scale-95'}`}>
                                <Send size={18} className={msgInput.trim() ? "ml-0.5" : ""} />
                            </button>
                        </form>
                        <button className="p-3 bg-secondary border border-border text-muted-foreground rounded-full hover:text-primary hover:bg-muted transition-colors ml-1">
                            <Mic size={20} />
                        </button>
                    </div>

                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-background/50 flex-col gap-4">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                        <Lock size={48} strokeWidth={1} />
                    </div>
                    <h2 className="text-2xl font-bold">SecureChat for Web</h2>
                    <p className="text-muted-foreground text-center max-w-sm">
                        End-to-end encrypted messaging. Click on a chat from the sidebar or search for users by email.
                    </p>
                </div>
            )}

        </div>
    );
}

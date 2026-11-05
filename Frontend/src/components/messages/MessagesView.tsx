import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  SendHorizontal, 
  Paperclip, 
  Smile, 
  Check, 
  CheckCheck, 
  Video, 
  Phone, 
  Info, 
  MoreVertical, 
  Download, 
  FileText, 
  X, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { getSocket, connectSocketUser } from '../../services/socket';
import { Conversation, ChatMessage, EligibleUser } from '../../types';

export const MessagesView: React.FC = () => {
  const { currentUser } = useApp();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'All' | 'Unread' | 'Admin' | 'Users'>('All');
  
  // Chat input state
  const [inputText, setInputText] = useState<string>('');
  const [attachment, setAttachment] = useState<{ name: string; url: string; size?: string; type?: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [otherUserTyping, setOtherUserTyping] = useState<boolean>(false);

  // Online users map: Set of userIds or emails
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // New Chat Modal
  const [isNewChatOpen, setIsNewChatOpen] = useState<boolean>(false);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [newChatSearch, setNewChatSearch] = useState<string>('');
  const [newChatRoleFilter, setNewChatRoleFilter] = useState<'All' | 'Admin' | 'User'>('All');
  const [startingChat, setStartingChat] = useState<boolean>(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Color generator for avatar background
  const getAvatarBg = (identifier: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // 1. Initialize Socket.IO connection & Register Current User
  useEffect(() => {
    if (!currentUser) return;
    connectSocketUser(currentUser);
    const socket = getSocket();

    const handleOnlineUsers = (users: any[]) => {
      const set = new Set<string>();
      users.forEach(u => {
        if (u.id) set.add(u.id);
        if (u.email) set.add(u.email.toLowerCase().trim());
      });
      setOnlineUserIds(set);
    };

    const handleUserOnline = (user: any) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (user.id) next.add(user.id);
        if (user.email) next.add(user.email.toLowerCase().trim());
        return next;
      });
    };

    const handleUserOffline = (user: any) => {
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        if (user.id) next.delete(user.id);
        if (user.email) next.delete(user.email.toLowerCase().trim());
        return next;
      });
    };

    // New incoming message
    const handleNewMessage = (msg: ChatMessage) => {
      if (activeConversation && (activeConversation.id === msg.conversationId || activeConversation.customId === msg.conversationId)) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id || (m.customId && m.customId === msg.customId))) return prev;
          return [...prev, msg];
        });

        // If I am recipient and viewing the conversation, immediately mark as read
        if (msg.recipientId === currentUser.id || msg.recipientEmail.toLowerCase() === currentUser.email.toLowerCase()) {
          socket.emit('mark_as_read', { conversationId: msg.conversationId, userId: currentUser.id });
        }
      }

      // Update conversations list in real-time
      setConversations(prev => {
        return prev.map(c => {
          if (c.id === msg.conversationId || c.customId === msg.conversationId) {
            const isMeRecipient = msg.recipientId === currentUser.id || msg.recipientEmail.toLowerCase() === currentUser.email.toLowerCase();
            const isViewing = activeConversation && (activeConversation.id === c.id || activeConversation.customId === c.id);
            return {
              ...c,
              lastMessage: {
                text: msg.text || (msg.attachment ? `📎 ${msg.attachment.name}` : ''),
                senderId: msg.senderId,
                senderEmail: msg.senderEmail,
                senderName: msg.senderName,
                timestamp: msg.createdAt,
                status: msg.status
              },
              unread: isMeRecipient && !isViewing ? (c.unread || 0) + 1 : (isViewing ? 0 : c.unread),
              updatedAt: msg.createdAt
            };
          }
          return c;
        }).sort((a, b) => new Date(b.lastMessage?.timestamp || b.updatedAt || 0).getTime() - new Date(a.lastMessage?.timestamp || a.updatedAt || 0).getTime());
      });
    };

    // Messages marked read receipt
    const handleMessagesRead = ({ conversationId, readerId }: { conversationId: string; readerId: string }) => {
      if (readerId !== currentUser.id) {
        setMessages(prev => prev.map(m => m.conversationId === conversationId ? { ...m, status: 'read', readAt: new Date().toISOString() } : m));
      }
    };

    // User typing notification
    const handleUserTyping = ({ conversationId, isTyping }: any) => {
      if (activeConversation && (activeConversation.id === conversationId || activeConversation.customId === conversationId)) {
        setOtherUserTyping(isTyping);
      }
    };

    socket.on('online_users', handleOnlineUsers);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);

    // Initial fetch of active online users via REST and Socket
    api.getOnlineUsers().then((list) => {
      const set = new Set<string>();
      list.forEach(u => {
        if (u.id) set.add(u.id);
        if (u.email) set.add(u.email.toLowerCase().trim());
      });
      setOnlineUserIds(prev => new Set([...prev, ...set]));
    }).catch(() => {});

    socket.emit('get_online_users');

    // Periodic heartbeat sync to keep online dots accurate
    const syncInterval = setInterval(() => {
      socket.emit('get_online_users');
    }, 6000);

    return () => {
      clearInterval(syncInterval);
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
    };
  }, [currentUser, activeConversation]);

  // 2. Fetch Conversations on Mount
  const loadConversations = async (autoSelectFirst = false) => {
    if (!currentUser) return;
    try {
      setLoadingConversations(true);
      const data = await api.getConversations(currentUser.id, currentUser.email);
      setConversations(data);
      if (autoSelectFirst && data.length > 0 && !activeConversation) {
        selectConversation(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
  }, [currentUser]);

  // 3. Select Conversation & Load Message History
  const selectConversation = async (conv: Conversation) => {
    if (!currentUser) return;
    const socket = getSocket();

    // Leave previous room if any
    if (activeConversation) {
      socket.emit('leave_conversation', { conversationId: activeConversation.id });
    }

    setActiveConversation(conv);
    setOtherUserTyping(false);

    // Join new conversation room
    socket.emit('join_conversation', { conversationId: conv.id, userId: currentUser.id });

    // Mark as read immediately
    if (conv.unread > 0) {
      socket.emit('mark_as_read', { conversationId: conv.id, userId: currentUser.id });
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
    }

    try {
      setLoadingMessages(true);
      const history = await api.getMessageHistory(conv.id, currentUser.id);
      setMessages(history);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // 4. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || !currentUser) return;
    if (!inputText.trim() && !attachment) return;

    const socket = getSocket();
    const other = activeConversation.otherUser;

    const payload = {
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      senderEmail: (currentUser.email || '').toLowerCase().trim(),
      senderName: currentUser.name || 'User',
      senderRole: currentUser.role || 'user',
      recipientEmail: (other.email || '').toLowerCase().trim(),
      text: inputText.trim(),
      attachment: attachment || null
    };

    // Clear input immediately for smooth UX
    setInputText('');
    setAttachment(null);
    setShowEmojiPicker(false);

    // Stop typing indicator
    socket.emit('typing_stop', {
      conversationId: activeConversation.id,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name
    });

    try {
      // Send via socket.io for instant real-time delivery
      socket.emit('send_message', payload, (res: any) => {
        if (!res || !res.success) {
          console.warn('Socket send_message callback error, fallback to REST:', res?.error);
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Typing indicator broadcast
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!activeConversation || !currentUser) return;

    const socket = getSocket();
    socket.emit('typing_start', {
      conversationId: activeConversation.id,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        conversationId: activeConversation.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name
      });
    }, 2000);
  };

  // Handle Attachment Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file size
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        url: reader.result as string,
        size: sizeFormatted,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Quick Emojis
  const quickEmojis = ['👍', '😊', '❤️', '🎉', '🙏', '👋', '✅', '🔥', '🚀', '👏'];

  const addEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 5. "+ New Chat" Action & Modal
  const openNewChatModal = async () => {
    setIsNewChatOpen(true);
    try {
      const users = await api.getEligibleUsers(currentUser?.id);
      setEligibleUsers(users);
    } catch (err) {
      console.error('Failed to load eligible users:', err);
    }
  };

  const handleStartChatWithUser = async (targetUser: EligibleUser) => {
    if (!currentUser) return;
    try {
      setStartingChat(true);
      const conversation = await api.startConversation(currentUser.id, targetUser.email);
      setIsNewChatOpen(false);
      await loadConversations(false);
      selectConversation(conversation);
    } catch (err: any) {
      alert(err.message || 'Failed to start chat');
    } finally {
      setStartingChat(false);
    }
  };

  // Helper: check if a user is online
  const isUserOnline = (user?: { id?: string; email?: string }) => {
    if (!user) return false;
    // If the user being checked is the current active user browsing the website:
    if (
      currentUser && (
        (user.id && user.id === currentUser.id) ||
        (user.email && currentUser.email && user.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
      )
    ) {
      return true; // The user currently browsing the website is by definition Online
    }
    if (user.id && onlineUserIds.has(user.id)) return true;
    if (user.email && onlineUserIds.has(user.email.toLowerCase().trim())) return true;
    return false;
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    // Filter tabs
    if (filterTab === 'Unread') {
      list = list.filter(c => (c.unread || 0) > 0);
    } else if (filterTab === 'Admin') {
      list = list.filter(c => c.otherUser?.role === 'admin');
    } else if (filterTab === 'Users') {
      list = list.filter(c => c.otherUser?.role === 'user');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => 
        (c.otherUser?.email || '').toLowerCase().includes(q) ||
        (c.otherUser?.name || '').toLowerCase().includes(q) ||
        (c.lastMessage?.text || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, filterTab, searchQuery]);

  // Filter eligible users in modal
  const filteredEligibleUsers = useMemo(() => {
    let list = [...eligibleUsers];
    if (newChatRoleFilter !== 'All') {
      list = list.filter(u => u.role === newChatRoleFilter.toLowerCase());
    }
    if (newChatSearch.trim()) {
      const q = newChatSearch.toLowerCase().trim();
      list = list.filter(u => 
        (u.email || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.team || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [eligibleUsers, newChatRoleFilter, newChatSearch]);

  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unread || 0), 0);
  }, [conversations]);

  // Format message time (e.g. "11:24 AM" or "Yesterday")
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] min-h-[640px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* ---------------- LEFT COLUMN: CONVERSATION LIST ---------------- */}
      <div className="w-80 md:w-96 flex flex-col border-r border-gray-200 bg-white shrink-0">
        {/* Header: "Messages" + "+ New Chat" Button */}
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h2>
            {totalUnreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <button
            onClick={openNewChatModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by registered email ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs: All, Unread (3), Admin, Users */}
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto border-b border-gray-100 no-scrollbar">
          {(['All', 'Unread', 'Admin', 'Users'] as const).map(tab => {
            const isActive = filterTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-800 font-semibold'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab === 'Unread' && totalUnreadCount > 0 ? `Unread (${totalUnreadCount})` : tab}
              </button>
            );
          })}
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingConversations ? (
            <div className="p-8 text-center text-gray-400 text-xs">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No chats found</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation with any registered member or admin</p>
              <button
                onClick={openNewChatModal}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start New Chat</span>
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = conv.otherUser;
              const isSelected = activeConversation && (activeConversation.id === conv.id || activeConversation.customId === conv.id);
              const isOnline = isUserOnline(other);
              const unread = conv.unread || 0;
              const initials = getInitials(other?.name, other?.email);
              const avatarStyle = getAvatarBg(other?.email || other?.name || 'user');

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-emerald-50/70 border-l-4 border-emerald-600' 
                      : 'hover:bg-gray-50/80 border-l-4 border-transparent'
                  }`}
                >
                  {/* Avatar Circle with Online Dot */}
                  <div className="relative shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs border ${avatarStyle}`}>
                      {initials}
                    </div>
                    {/* Real-time Online Indicator */}
                    <span 
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                        isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                      }`} 
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>

                  {/* Middle: Email / Name & Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-semibold text-xs text-gray-900 truncate">
                        {other?.email || other?.name || 'Registered User'}
                      </h4>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-1">
                      <p className="text-xs text-gray-500 truncate">
                        {conv.lastMessage?.text || 'No messages yet'}
                      </p>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---------------- RIGHT COLUMN: CHAT AREA ---------------- */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-[#fcfdfc] min-w-0">
          {/* Chat Header */}
          <div className="p-3.5 px-5 bg-white border-b border-gray-200 flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${getAvatarBg(activeConversation.otherUser?.email || 'user')}`}>
                  {getInitials(activeConversation.otherUser?.name, activeConversation.otherUser?.email)}
                </div>
                <span 
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isUserOnline(activeConversation.otherUser) ? 'bg-emerald-500' : 'bg-gray-300'
                  }`} 
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">
                    {activeConversation.otherUser?.email}
                  </h3>
                  {activeConversation.otherUser?.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  {isUserOnline(activeConversation.otherUser) ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      <span>Online</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Offline</span>
                  )}
                </p>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2 text-gray-500">
              <button 
                onClick={() => alert(`Voice and video call initiation with ${activeConversation.otherUser?.email} will connect via WebRTC in the upcoming release.`)}
                className="p-2 rounded-lg hover:bg-gray-100 hover:text-emerald-600 transition-colors cursor-pointer" 
                title="Start Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
              <button 
                onClick={() => alert(`Voice call initiation with ${activeConversation.otherUser?.email} will connect via WebRTC in the upcoming release.`)}
                className="p-2 rounded-lg hover:bg-gray-100 hover:text-emerald-600 transition-colors cursor-pointer" 
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => alert(`User Info:\nName: ${activeConversation.otherUser?.name || 'N/A'}\nEmail: ${activeConversation.otherUser?.email}\nRole: ${activeConversation.otherUser?.role}`)}
                className="p-2 rounded-lg hover:bg-gray-100 hover:text-emerald-600 transition-colors cursor-pointer" 
                title="Contact Info"
              >
                <Info className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-[#f8fafc]/60">
            {/* Centered Date Badge */}
            <div className="flex justify-center my-2">
              <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-gray-500 text-[11px] font-medium shadow-2xs">
                Today
              </span>
            </div>

            {loadingMessages ? (
              <div className="text-center py-10 text-xs text-gray-400">Loading conversation history...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-gray-700">Encrypted Conversation Started</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
                  Messages between registered emails are synchronized in real-time via Socket.IO and stored in MongoDB.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === currentUser?.id || msg.senderEmail.toLowerCase() === currentUser?.email.toLowerCase();

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`relative max-w-[85%] sm:max-w-md px-3.5 py-2.5 rounded-2xl shadow-2xs text-xs ${
                        isMe 
                          ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-xs' 
                          : 'bg-white text-gray-900 border border-gray-100 rounded-tl-xs'
                      }`}
                    >
                      {/* Attachment Rendering */}
                      {msg.attachment && (
                        <div className="mb-2 p-2.5 rounded-xl bg-white/80 border border-gray-200 flex items-center gap-3">
                          {msg.attachment.type === 'image' || msg.attachment.url?.startsWith('data:image') ? (
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name} 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-gray-900 truncate">{msg.attachment.name}</p>
                            <p className="text-[10px] text-gray-500">{msg.attachment.size || 'Document'}</p>
                          </div>
                          {msg.attachment.url && (
                            <a 
                              href={msg.attachment.url} 
                              download={msg.attachment.name} 
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-emerald-700 transition-colors"
                              title="Download File"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Message Text */}
                      {msg.text && (
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      )}

                      {/* Timestamp & Status Checkmarks */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-gray-500">
                        <span>{formatTime(msg.createdAt)}</span>
                        {isMe && (
                          <span title={msg.status === 'read' ? 'Read' : 'Delivered'}>
                            {msg.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            ) : msg.status === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-gray-400 stroke-[2]" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-gray-400 stroke-[2]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Other user is typing bubble */}
            {otherUserTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-gray-500 ml-1">{activeConversation.otherUser?.email} is typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Chip */}
          {attachment && (
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-900 truncate">{attachment.name}</span>
                <span className="text-emerald-700 text-[11px]">({attachment.size})</span>
              </div>
              <button 
                onClick={() => setAttachment(null)}
                className="text-emerald-700 hover:text-red-600 cursor-pointer p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Emoji Bar Popover */}
          {showEmojiPicker && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-2 overflow-x-auto">
              {quickEmojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="p-1.5 text-lg hover:bg-gray-100 rounded-lg transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Bottom Input Bar */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            {/* Attachment Button */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              title="Attach File or Image"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Text Input Pill */}
            <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputText}
                onChange={handleInputChange}
                className="w-full bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none"
              />

              {/* Emoji Trigger */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                title="Insert Emoji"
              >
                <Smile className="w-4 h-4" />
              </button>
            </form>

            {/* Circular Green Send Button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() && !attachment}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all cursor-pointer ${
                inputText.trim() || attachment
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <SendHorizontal className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State (No Chat Selected) */
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f8fafc] text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-4 shadow-sm">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Worker Space Real-Time Messages</h3>
          <p className="text-xs text-gray-500 max-w-sm mt-1.5">
            Select a conversation on the left, or click <strong className="text-emerald-700 font-semibold">+ New Chat</strong> to message any registered Admin or User instantly without page refresh.
          </p>
          <button
            onClick={openNewChatModal}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Chat</span>
          </button>
        </div>
      )}

      {/* ---------------- + NEW CHAT MODAL ---------------- */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">Start New Chat</h3>
                <p className="text-xs text-gray-500">Select any registered member or administrator in Worker Space</p>
              </div>
              <button 
                onClick={() => setIsNewChatOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or department..."
                  value={newChatSearch}
                  onChange={e => setNewChatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                {(['All', 'Admin', 'User'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setNewChatRoleFilter(role)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                      newChatRoleFilter === role
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {role === 'All' ? 'All Registered' : role === 'Admin' ? 'Admins' : 'Users / Members'}
                  </button>
                ))}
              </div>
            </div>

            {/* Registered Users List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-50">
              {startingChat ? (
                <div className="p-8 text-center text-xs text-gray-400">Opening conversation...</div>
              ) : filteredEligibleUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No registered users match your search criteria.
                </div>
              ) : (
                filteredEligibleUsers.map(user => {
                  const isOnline = isUserOnline(user);
                  const initials = getInitials(user.name, user.email);
                  const avatarStyle = getAvatarBg(user.email || user.name);

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleStartChatWithUser(user)}
                      className="p-3 rounded-xl flex items-center justify-between hover:bg-emerald-50/60 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border ${avatarStyle}`}>
                            {initials}
                          </div>
                          <span 
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                            }`} 
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-gray-900 group-hover:text-emerald-700 truncate">
                              {user.name}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{user.email}</p>
                          {(user.department || user.team) && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {[user.department, user.team].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-emerald-600 group-hover:text-white text-gray-500 flex items-center justify-center transition-colors">
                          <SendHorizontal className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

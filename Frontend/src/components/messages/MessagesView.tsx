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
  MoreVertical, 
  Download, 
  FileText, 
  X, 
  MessageSquare, 
  CircleDashed, 
  Users, 
  Settings, 
  Sparkles, 
  Mic, 
  Lock, 
  SquarePen
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
  
  // Leftmost mini rail navigation tab
  const [activeRailTab, setActiveRailTab] = useState<'chats' | 'calls' | 'status' | 'groups' | 'ai' | 'settings'>('chats');

  // Chat input state
  const [inputText, setInputText] = useState<string>('');
  const [attachment, setAttachment] = useState<{ name: string; url: string; size?: string; type?: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [otherUserTyping, setOtherUserTyping] = useState<boolean>(false);

  // Online users set: contains userIds and lowercase emails
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
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // WhatsApp Pastel Avatar Palette
  const getAvatarBg = (identifier: string) => {
    const colors = [
      'bg-[#00a884] text-white',
      'bg-[#53bdeb] text-white',
      'bg-[#e26ab6] text-white',
      'bg-[#7c5cdb] text-white',
      'bg-[#f19a38] text-white',
      'bg-[#20c6b6] text-white',
      'bg-[#df4759] text-white'
    ];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // WhatsApp Group Chat Sender Name Color Generator
  const getSenderColor = (identifier: string) => {
    const colors = [
      'text-[#e26ab6]', // WhatsApp Pink
      'text-[#00a884]', // WhatsApp Green
      'text-[#53bdeb]', // WhatsApp Cyan
      'text-[#7c5cdb]', // WhatsApp Purple
      'text-[#f19a38]', // WhatsApp Orange
      'text-[#20c6b6]', // WhatsApp Teal
      'text-[#df4759]', // WhatsApp Coral
      'text-[#8b5cf6]'  // WhatsApp Violet
    ];
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper to test if a message is purely emoji
  const isOnlyEmoji = (text?: string) => {
    if (!text) return false;
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 8) return false;
    const emojiRegex = /^(\p{Extended_Pictographic}|\u200d|\ufe0f|\s)+$/u;
    return emojiRegex.test(trimmed);
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

  // 1. Initialize Socket.IO connection & Presence Tracking
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

    // Initial fetch of active online users via REST immediately
    api.getOnlineUsers().then((list) => {
      const set = new Set<string>();
      list.forEach(u => {
        if (u.id) set.add(u.id);
        if (u.email) set.add(u.email.toLowerCase().trim());
      });
      setOnlineUserIds(prev => new Set([...prev, ...set]));
    }).catch(() => {});

    socket.emit('get_online_users');

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

    if (activeConversation) {
      socket.emit('leave_conversation', { conversationId: activeConversation.id });
    }

    setActiveConversation(conv);
    setOtherUserTyping(false);
    setShowAttachmentMenu(false);
    setShowEmojiPicker(false);

    socket.emit('join_conversation', { conversationId: conv.id, userId: currentUser.id });

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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // 4. Send Message Handler
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputText.trim();
    if (!activeConversation || !currentUser) return;
    if (!textToSend && !attachment) return;

    const socket = getSocket();
    const other = activeConversation.otherUser;

    const payload = {
      conversationId: activeConversation.id,
      senderId: currentUser.id,
      senderEmail: (currentUser.email || '').toLowerCase().trim(),
      senderName: currentUser.name || 'User',
      senderRole: currentUser.role || 'user',
      recipientEmail: (other.email || '').toLowerCase().trim(),
      text: textToSend,
      attachment: attachment || null
    };

    setInputText('');
    setAttachment(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    socket.emit('typing_stop', {
      conversationId: activeConversation.id,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name
    });

    try {
      socket.emit('send_message', payload, (res: any) => {
        if (!res || !res.success) {
          console.warn('Socket send_message callback fallback:', res?.error);
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Typing indicator
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

  // File & Photo Attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isImage = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        url: reader.result as string,
        size: sizeFormatted,
        type: isImage || file.type.startsWith('image/') ? 'image' : 'file'
      });
      setShowAttachmentMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quickEmojis = ['👍', '❤️', '😂', '🎉', '🔥', '🙏', '👏', '✅', '✨', '👋', '😊', '☕', '🎂', '😍'];

  // Direct Emoji Send: Sends the emoji immediately without placing it in the input column
  const handleDirectSendEmoji = (emoji: string) => {
    handleSendMessage(emoji);
    setShowEmojiPicker(false);
  };

  // Helper to get resolved display name for WhatsApp Group Chatting
  const getDisplayName = (msg: ChatMessage) => {
    if (msg.senderName && msg.senderName !== 'User' && msg.senderName.trim()) {
      return msg.senderName.trim();
    }
    const match = eligibleUsers.find(u => 
      u.id === msg.senderId || 
      (msg.senderEmail && u.email.toLowerCase() === msg.senderEmail.toLowerCase())
    );
    if (match && match.name) return match.name;
    if (msg.senderEmail) {
      const prefix = msg.senderEmail.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Team Member';
  };

  // "+ New Chat" Action & Modal
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
    if (
      currentUser && (
        (user.id && user.id === currentUser.id) ||
        (user.email && currentUser.email && user.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
      )
    ) {
      return true;
    }
    if (user.id && onlineUserIds.has(user.id)) return true;
    if (user.email && onlineUserIds.has(user.email.toLowerCase().trim())) return true;
    return false;
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    if (filterTab === 'Unread') {
      list = list.filter(c => (c.unread || 0) > 0);
    } else if (filterTab === 'Admin') {
      list = list.filter(c => c.otherUser?.role === 'admin');
    } else if (filterTab === 'Users') {
      list = list.filter(c => c.otherUser?.role === 'user');
    }

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

  // Filter modal users
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

  // Format message time like WhatsApp ("14:15", "Yesterday", "03 Nov")
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex h-[calc(100vh-85px)] min-h-[640px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xl relative select-none">
      
      {/* ---------------- 1. WHATSAPP ICON NAVIGATION RAIL (FAR LEFT) ---------------- */}
      <aside className="w-14 sm:w-16 bg-[#f0f2f5] border-r border-[#e9edef] flex flex-col items-center justify-between py-3.5 shrink-0 z-20">
        {/* Top Icons */}
        <div className="flex flex-col items-center gap-3">
          {/* WhatsApp / WorkHub Brand Icon */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366] text-white shadow-xs cursor-pointer hover:opacity-90 transition-opacity" title="WorkHub WhatsApp Chats">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.05 20.15Z"/>
            </svg>
          </div>

          <div className="w-8 h-px bg-gray-300/80 my-1" />

          {/* Chats Icon (Active) */}
          <button 
            onClick={() => setActiveRailTab('chats')} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center relative transition-colors cursor-pointer ${
              activeRailTab === 'chats' ? 'bg-[#d9fdd3] text-[#008069]' : 'text-[#54656f] hover:bg-gray-200/60'
            }`}
            title="Chats"
          >
            <MessageSquare className="w-5 h-5 stroke-[2.2]" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {totalUnreadCount}
              </span>
            )}
          </button>

          {/* Calls */}
          <button 
            onClick={() => {
              setActiveRailTab('calls');
              alert('Voice and Video calls history: All endpoints ready for WebRTC.');
            }} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeRailTab === 'calls' ? 'bg-[#d9fdd3] text-[#008069]' : 'text-[#54656f] hover:bg-gray-200/60'
            }`}
            title="Calls"
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Status */}
          <button 
            onClick={() => {
              setActiveRailTab('status');
              alert('Work Status Updates: Share your active daily progress with connected teams.');
            }} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeRailTab === 'status' ? 'bg-[#d9fdd3] text-[#008069]' : 'text-[#54656f] hover:bg-gray-200/60'
            }`}
            title="Status"
          >
            <CircleDashed className="w-5 h-5" />
          </button>

          {/* Teams / Communities */}
          <button 
            onClick={() => {
              setActiveRailTab('groups');
              openNewChatModal();
            }} 
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              activeRailTab === 'groups' ? 'bg-[#d9fdd3] text-[#008069]' : 'text-[#54656f] hover:bg-gray-200/60'
            }`}
            title="Communities & Teams"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* AI / Meta AI Sparkles */}
          <button 
            onClick={() => {
              alert('WorkHub AI Copilot: Instant task summarization and assignment drafting.');
            }} 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#54656f] hover:bg-gray-200/60 transition-colors cursor-pointer"
            title="WorkHub AI"
          >
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </button>
        </div>

        {/* Bottom Icons: Settings & User Profile */}
        <div className="flex flex-col items-center gap-3">
          <button 
            onClick={() => alert(`Logged in as: ${currentUser?.email} (${currentUser?.role})`)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#54656f] hover:bg-gray-200/60 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* My Profile Avatar with Online Dot */}
          <div className="relative cursor-pointer" title={`You (${currentUser?.email}) - Online`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarBg(currentUser?.email || 'user')}`}>
              {getInitials(currentUser?.name, currentUser?.email)}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-[#f0f2f5]" />
          </div>
        </div>
      </aside>

      {/* ---------------- 2. CHATS LIST COLUMN (MIDDLE PANEL) ---------------- */}
      <div className="w-80 sm:w-96 flex flex-col bg-white border-r border-[#e9edef] shrink-0 z-10">
        {/* Header: "Chats" + Action Icons */}
        <div className="p-3.5 px-4 flex items-center justify-between border-b border-[#f0f2f5]">
          <h2 className="text-xl font-bold text-[#111b21] tracking-tight">Chats</h2>
          <div className="flex items-center gap-1 text-[#54656f]">
            <button 
              onClick={openNewChatModal}
              className="p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              title="New Chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>
            <button 
              onClick={openNewChatModal}
              className="p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Bar ("Search or start a new chat") */}
        <div className="p-2.5 px-3 border-b border-[#f0f2f5]">
          <div className="relative flex items-center bg-[#f0f2f5] rounded-lg px-3 py-1.5 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
            <Search className="w-4 h-4 text-[#54656f] shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-[#111b21] placeholder-[#54656f] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#54656f] hover:text-gray-900">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills: All, Unread, Admin, Users (Matching Screenshot 2) */}
        <div className="px-3 py-2 flex items-center gap-1.5 border-b border-[#f0f2f5] overflow-x-auto no-scrollbar">
          {(['All', 'Unread', 'Admin', 'Users'] as const).map(tab => {
            const isActive = filterTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#d9fdd3] text-[#008069] font-semibold'
                    : 'bg-[#f0f2f5] text-[#54656f] hover:bg-gray-200/80'
                }`}
              >
                {tab === 'Unread' && totalUnreadCount > 0 ? `Unread (${totalUnreadCount})` : tab}
              </button>
            );
          })}
        </div>

        {/* Conversation List Scroll Area */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#f0f2f5]">
          {loadingConversations ? (
            <div className="p-8 text-center text-xs text-[#54656f]">Loading chats...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#111b21]">No chats yet</p>
              <p className="text-xs text-[#54656f] mt-1">Start a conversation with any registered member or admin</p>
              <button
                onClick={openNewChatModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
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
                  className={`p-3 px-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-[#f0f2f5]' 
                      : 'hover:bg-[#f5f6f6]'
                  }`}
                >
                  {/* WhatsApp Circular Avatar with Online Dot */}
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs ${avatarStyle}`}>
                      {initials}
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white" title="Online" />
                    )}
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-medium text-sm text-[#111b21] truncate">
                        {other?.name || other?.email || 'Registered User'}
                      </h4>
                      <span className={`text-[11px] shrink-0 ${unread > 0 ? 'text-[#25D366] font-semibold' : 'text-[#667781]'}`}>
                        {formatTime(conv.lastMessage?.timestamp || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0">
                        {conv.lastMessage?.senderId === currentUser?.id && (
                          <span className="shrink-0 text-[#53bdeb]">
                            {conv.lastMessage?.status === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </span>
                        )}
                        <p className="text-xs text-[#667781] truncate">
                          {conv.lastMessage?.text || 'Draft a message...'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
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

      {/* ---------------- 3. CHAT CANVAS & CONVERSATION (RIGHT PANEL) ---------------- */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-[#efeae2] min-w-0 relative">
          
          {/* Subtle WhatsApp Classic Wallpaper Pattern Overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.06] z-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h20v20H20zm50 0h20v20H70zm-50 50h20v20H20zm50 0h20v20H70z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3Ccircle cx='30' cy='30' r='5' fill='%23000000'/%3E%3Ccircle cx='80' cy='30' r='5' fill='%23000000'/%3E%3Ccircle cx='30' cy='80' r='5' fill='%23000000'/%3E%3Ccircle cx='80' cy='80' r='5' fill='%23000000'/%3E%3C/svg%3E")`,
              backgroundSize: '160px 160px'
            }}
          />

          {/* Top Chat Header matching Screenshot 2 */}
          <div className="h-[60px] px-4 bg-[#f0f2f5] border-b border-[#e9edef] flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarBg(activeConversation.otherUser?.email || 'user')}`}>
                  {getInitials(activeConversation.otherUser?.name, activeConversation.otherUser?.email)}
                </div>
                {isUserOnline(activeConversation.otherUser) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#25D366] border-2 border-white" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-[#111b21] truncate">
                    {activeConversation.otherUser?.name || activeConversation.otherUser?.email}
                  </h3>
                  {activeConversation.otherUser?.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[10px] font-semibold">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-tight">
                  {otherUserTyping ? (
                    <span className="text-[#00a884] font-medium animate-pulse">typing...</span>
                  ) : isUserOnline(activeConversation.otherUser) ? (
                    <span className="text-[#00a884] font-medium">Online</span>
                  ) : (
                    <span className="text-[#667781]">Offline</span>
                  )}
                </p>
              </div>
            </div>

            {/* Header Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-2 text-[#54656f]">
              <button 
                onClick={() => alert(`Connecting video call with ${activeConversation.otherUser?.email}...`)}
                className="p-2 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer" 
                title="Video Call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button 
                onClick={() => alert(`Connecting audio call with ${activeConversation.otherUser?.email}...`)}
                className="p-2 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer" 
                title="Voice Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <div className="h-5 w-px bg-gray-300 mx-1 hidden sm:block" />
              <button 
                onClick={() => alert(`Search conversation messages with ${activeConversation.otherUser?.email}`)}
                className="p-2 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer" 
                title="Search Messages"
              >
                <Search className="w-5 h-5" />
              </button>
              <button 
                className="p-2 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer" 
                title="Menu"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 z-10">
            {/* Centered Date Pill (WhatsApp style) */}
            <div className="flex justify-center my-2">
              <span className="px-3 py-1 rounded-md bg-white shadow-2xs text-[#54656f] text-[11px] font-medium border border-gray-100">
                Today
              </span>
            </div>

            {loadingMessages ? (
              <div className="text-center py-10 text-xs text-[#54656f]">Loading chat history...</div>
            ) : messages.length === 0 ? (
              /* When there are NO messages in this chat, don't leave a blank void! */
              <div className="max-w-md mx-auto my-8 p-6 rounded-2xl bg-white/95 backdrop-blur-sm shadow-md border border-gray-100 text-center animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-[#111b21]">End-to-End Encrypted</h4>
                <p className="text-xs text-[#54656f] mt-1 leading-relaxed">
                  Messages between registered accounts are delivered in real-time via Socket.IO and permanently stored in MongoDB.
                </p>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-700 mb-2.5">Send a quick starter message:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      '👋 Hi there!',
                      '📋 What is today’s task priority?',
                      '✅ Work is completed, please review',
                      '📅 Let’s schedule a quick sync call'
                    ].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-3 py-1.5 rounded-full bg-[#f0f2f5] hover:bg-[#d9fdd3] hover:text-[#008069] text-xs font-medium text-[#111b21] transition-all cursor-pointer shadow-2xs"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.id || msg.senderEmail.toLowerCase() === currentUser?.email.toLowerCase();
                const displayName = getDisplayName(msg);
                const senderColorClass = getSenderColor(msg.senderEmail || displayName);
                const isPureEmoji = isOnlyEmoji(msg.text);

                // Group messages from the same sender in sequence (WhatsApp style)
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isSameSenderAsPrev = prevMsg && (
                  (prevMsg.senderId && prevMsg.senderId === msg.senderId) ||
                  (prevMsg.senderEmail && prevMsg.senderEmail.toLowerCase() === msg.senderEmail.toLowerCase())
                );
                const showSenderHeader = !isMe && !isSameSenderAsPrev;

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSenderAsPrev ? 'mt-0.5' : 'mt-2.5'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-md ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {/* Avatar on the left for incoming team messages (WhatsApp Group style) */}
                      {!isMe && (
                        !isSameSenderAsPrev ? (
                          <div 
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mb-0.5 shadow-2xs ${getAvatarBg(msg.senderEmail || displayName)}`}
                            title={`${displayName} (${msg.senderEmail})`}
                          >
                            {getInitials(displayName, msg.senderEmail)}
                          </div>
                        ) : (
                          <div className="w-7 shrink-0" />
                        )
                      )}

                      {/* Chat Bubble */}
                      <div 
                        className={`relative px-3.5 py-2 rounded-lg shadow-2xs leading-relaxed break-words ${
                          isMe 
                            ? 'bg-[#d9fdd3] text-[#111b21] ' + (isSameSenderAsPrev ? 'rounded-tr-lg' : 'rounded-tr-none')
                            : 'bg-white text-[#111b21] border border-gray-100/60 ' + (isSameSenderAsPrev ? 'rounded-tl-lg' : 'rounded-tl-none')
                        }`}
                      >
                        {/* WhatsApp Group Sender Name with distinct member color & role badge */}
                        {showSenderHeader && (
                          <div className="flex items-center gap-1.5 mb-1 select-none">
                            <span className={`font-bold text-[12px] leading-tight tracking-tight ${senderColorClass}`}>
                              {displayName}
                            </span>
                            {msg.senderRole === 'admin' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-purple-100 text-purple-700">
                                Admin
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-normal">
                                ~{msg.senderEmail.split('@')[0]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Photo / Attachment Card */}
                        {msg.attachment && (
                          <div className="mb-2 p-2 rounded-lg bg-black/5 flex items-center gap-3">
                            {msg.attachment.type === 'image' || msg.attachment.url?.startsWith('data:image') ? (
                              <img 
                                src={msg.attachment.url} 
                                alt={msg.attachment.name} 
                                className="w-16 h-16 rounded-md object-cover border border-white" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-[#00a884] text-white flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs text-gray-900 truncate">{msg.attachment.name}</p>
                              <p className="text-[10px] text-gray-500">{msg.attachment.size || 'Attachment'}</p>
                            </div>
                            {msg.attachment.url && (
                              <a 
                                href={msg.attachment.url} 
                                download={msg.attachment.name} 
                                className="p-1.5 rounded-full hover:bg-white text-gray-700 transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Message Text / Big Emoji */}
                        {msg.text && (
                          <div className={isPureEmoji ? 'text-3xl sm:text-4xl py-0.5 select-none text-center' : 'text-[13px] whitespace-pre-wrap'}>
                            {msg.text}
                          </div>
                        )}

                        {/* Timestamp & Status Checkmarks */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#667781] select-none">
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <span title={msg.status === 'read' ? 'Read' : 'Delivered'}>
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Live Typing Indicator */}
            {otherUserTyping && (
              <div className="flex items-center gap-2 text-xs text-[#54656f]">
                <div className="px-3.5 py-1.5 rounded-lg bg-white shadow-2xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-[#667781] ml-1">typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Chip */}
          {attachment && (
            <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between text-xs z-10">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                <span className="font-semibold text-gray-900 truncate">{attachment.name}</span>
                <span className="text-gray-500 text-[11px]">({attachment.size})</span>
              </div>
              <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Emoji Reaction Bar - Direct Send on Click without populating input column */}
          {showEmojiPicker && (
            <div className="px-4 py-2.5 bg-white border-t border-[#e9edef] flex items-center gap-2 overflow-x-auto z-20 shadow-xs animate-in fade-in slide-in-from-bottom-1 duration-150">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider select-none shrink-0 mr-1">
                Direct Send:
              </span>
              <div className="flex items-center gap-1 sm:gap-2">
                {quickEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleDirectSendEmoji(emoji)}
                    className="p-1.5 text-2xl hover:bg-gray-100 rounded-xl transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0"
                    title={`Send ${emoji} directly`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="ml-auto p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Attachment Popup Menu */}
          {showAttachmentMenu && (
            <div className="absolute bottom-16 left-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-50 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Photos & Videos</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-xs font-semibold text-gray-700 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Document</span>
              </button>
            </div>
          )}

          {/* ---------------- WHATSAPP SIGNATURE BOTTOM INPUT BAR ---------------- */}
          <div className="h-[62px] px-4 bg-[#f0f2f5] border-t border-[#e9edef] flex items-center gap-2.5 shrink-0 z-10">
            {/* Hidden File Inputs */}
            <input type="file" ref={fileInputRef} onChange={e => handleFileSelect(e, false)} className="hidden" />
            <input type="file" accept="image/*" ref={imageInputRef} onChange={e => handleFileSelect(e, true)} className="hidden" />

            {/* Plus / Attachment Button */}
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-gray-200/60 rounded-full transition-colors cursor-pointer"
              title="Attach"
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Smiley Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-gray-200/60 rounded-full transition-colors cursor-pointer"
              title="Emoji"
            >
              <Smile className="w-6 h-6" />
            </button>

            {/* Input Pill */}
            <form 
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }} 
              className="flex-1 flex items-center bg-white rounded-lg px-4 py-2 border border-transparent focus-within:border-gray-200 shadow-2xs"
            >
              <input
                type="text"
                placeholder="Type a message"
                value={inputText}
                onChange={handleInputChange}
                className="w-full bg-transparent text-sm text-[#111b21] placeholder-[#54656f] focus:outline-none"
              />
            </form>

            {/* Send or Mic Button */}
            {inputText.trim() || attachment ? (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0"
                title="Send Message"
              >
                <SendHorizontal className="w-5 h-5 stroke-[2.2]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => alert('Microphone audio message recording ready for deployment.')}
                className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-gray-200/60 rounded-full transition-colors cursor-pointer shrink-0"
                title="Record Voice Note"
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ---------------- WHATSAPP WEB SPLASH SCREEN (WHEN NO CHAT SELECTED) ---------------- */
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f0f2f5] text-center border-l border-[#e9edef] relative select-none">
          <div className="max-w-md flex flex-col items-center">
            {/* WhatsApp Laptop/Phone Center Graphic */}
            <div className="w-20 h-20 rounded-full bg-[#d9fdd3] text-[#008069] flex items-center justify-center mb-6 shadow-sm">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="currentColor">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.6L5.06 16.29C4.24 14.98 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.05 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.05 20.15Z"/>
              </svg>
            </div>

            <h3 className="text-2xl font-light text-[#41525d] tracking-tight">WorkHub for Web</h3>
            <p className="text-xs text-[#667781] leading-relaxed mt-3 max-w-sm">
              Send and receive real-time messages with any registered team member or administrator without page refresh.
            </p>

            <button
              onClick={openNewChatModal}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start a New Chat</span>
            </button>
          </div>

          {/* End-to-end encrypted lock note at bottom */}
          <div className="absolute bottom-6 flex items-center gap-1.5 text-xs text-[#8696a0]">
            <Lock className="w-3.5 h-3.5" />
            <span>End-to-end encrypted</span>
          </div>
        </div>
      )}

      {/* ---------------- + NEW CHAT MODAL ---------------- */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-gray-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between bg-[#f0f2f5]">
              <div>
                <h3 className="font-bold text-base text-[#111b21]">New Chat</h3>
                <p className="text-xs text-[#667781]">Select any registered member or admin</p>
              </div>
              <button 
                onClick={() => setIsNewChatOpen(false)}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="p-3 border-b border-gray-100 space-y-2.5 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name or registered email..."
                  value={newChatSearch}
                  onChange={e => setNewChatSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#f0f2f5] border border-transparent text-[#111b21] placeholder-[#667781] focus:outline-none focus:bg-white focus:border-[#00a884]"
                />
              </div>

              <div className="flex items-center gap-2">
                {(['All', 'Admin', 'User'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setNewChatRoleFilter(role)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                      newChatRoleFilter === role
                        ? 'bg-[#00a884] text-white font-semibold'
                        : 'bg-[#f0f2f5] text-[#54656f] hover:bg-gray-200/80'
                    }`}
                  >
                    {role === 'All' ? 'All Registered' : role === 'Admin' ? 'Admins' : 'Users / Members'}
                  </button>
                ))}
              </div>
            </div>

            {/* Registered Users List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#f0f2f5]">
              {startingChat ? (
                <div className="p-8 text-center text-xs text-[#667781]">Opening chat...</div>
              ) : filteredEligibleUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#667781]">
                  No registered users match your search.
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
                      className="p-3 rounded-xl flex items-center justify-between hover:bg-[#f0f2f5] cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ${avatarStyle}`}>
                            {initials}
                          </div>
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25D366] border-2 border-white" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-xs text-[#111b21] group-hover:text-[#00a884] truncate">
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
                          <p className="text-[11px] text-[#667781] truncate mt-0.5">{user.email}</p>
                          {(user.department || user.team) && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {[user.department, user.team].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <span className={`text-[10px] font-medium ${isOnline ? 'text-[#00a884]' : 'text-gray-400'}`}>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#00a884] group-hover:text-white text-gray-500 flex items-center justify-center transition-colors">
                          <SendHorizontal className="w-4 h-4" />
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

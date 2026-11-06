const { Server } = require('socket.io');
const dataService = require('./seed/dataService');

let io = null;

// Track active connections: socketId -> { id, email, name, role }
const activeSockets = new Map();

// Helper to return unique list of currently online users
function getOnlineUsers() {
  const users = [];
  const seenEmails = new Set();
  const seenIds = new Set();

  for (const info of activeSockets.values()) {
    if (!info) continue;
    const email = (info.email || '').toLowerCase().trim();
    const id = info.id || '';

    if ((email && !seenEmails.has(email)) || (id && !seenIds.has(id))) {
      if (email) seenEmails.add(email);
      if (id) seenIds.add(id);
      users.push({
        id: info.id,
        email: email,
        name: info.name || '',
        role: info.role || 'user'
      });
    }
  }

  return users;
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    let currentUserData = null;

    // 1. User registers their socket connection upon entering the website
    socket.on('register_user', (userData) => {
      if (!userData || (!userData.id && !userData.email)) return;

      const email = (userData.email || '').toLowerCase().trim();
      const id = userData.id || email;
      const name = userData.name || '';
      const role = userData.role || 'user';

      currentUserData = { id, email, name, role };
      activeSockets.set(socket.id, currentUserData);

      // Join private user rooms for targeted notifications
      if (id) socket.join(`user_${id}`);
      if (email) socket.join(`user_${email}`);

      // Broadcast full list of online users to ALL connected clients immediately
      const onlineList = getOnlineUsers();
      io.emit('online_users', onlineList);

      // Also broadcast individual presence event
      socket.broadcast.emit('user_online', currentUserData);
    });

    // Request active online users
    socket.on('get_online_users', (callback) => {
      const onlineList = getOnlineUsers();
      if (typeof callback === 'function') {
        callback(onlineList);
      } else {
        socket.emit('online_users', onlineList);
      }
    });

    // Heartbeat / ping to keep presence active
    socket.on('presence_heartbeat', (userData) => {
      if (userData && (userData.id || userData.email)) {
        const email = (userData.email || '').toLowerCase().trim();
        const id = userData.id || email;
        currentUserData = { id, email, name: userData.name || '', role: userData.role || 'user' };
        activeSockets.set(socket.id, currentUserData);
      }
    });

    // 2. Join conversation room
    socket.on('join_conversation', ({ conversationId, userId }) => {
      if (!conversationId) return;
      socket.join(`conv_${conversationId}`);
    });

    // 3. Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      if (!conversationId) return;
      socket.leave(`conv_${conversationId}`);
    });

    // 4. Send Message event
    socket.on('send_message', async (data, callback) => {
      try {
        const msg = await dataService.createMessage(data);

        // Emit to all sockets inside the conversation room
        io.to(`conv_${msg.conversationId}`).emit('new_message', msg);

        // If message is a Meeting invite, send instant meeting alert
        if (msg.meeting) {
          io.to(`conv_${msg.conversationId}`).emit('meeting_started', {
            meeting: msg.meeting,
            conversationId: msg.conversationId,
            senderName: msg.senderName,
            senderEmail: msg.senderEmail
          });
          io.to(`user_${msg.recipientId}`).emit('meeting_popup', {
            meeting: msg.meeting,
            conversationId: msg.conversationId,
            senderName: msg.senderName
          });
          io.to(`user_${msg.recipientEmail}`).emit('meeting_popup', {
            meeting: msg.meeting,
            conversationId: msg.conversationId,
            senderName: msg.senderName
          });
        }

        // Send conversation update to recipient's personal room
        io.to(`user_${msg.recipientId}`).emit('conversation_updated', {
          conversationId: msg.conversationId,
          lastMessage: msg,
          recipientId: msg.recipientId
        });
        io.to(`user_${msg.recipientEmail}`).emit('conversation_updated', {
          conversationId: msg.conversationId,
          lastMessage: msg,
          recipientId: msg.recipientId
        });

        // Send conversation update to sender's personal room
        io.to(`user_${msg.senderId}`).emit('conversation_updated', {
          conversationId: msg.conversationId,
          lastMessage: msg,
          senderId: msg.senderId
        });
        io.to(`user_${msg.senderEmail}`).emit('conversation_updated', {
          conversationId: msg.conversationId,
          lastMessage: msg,
          senderId: msg.senderId
        });

        if (typeof callback === 'function') {
          callback({ success: true, message: msg });
        }
      } catch (err) {
        console.error('[Socket] send_message error:', err.message);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    });

    // 5. Mark as read
    socket.on('mark_as_read', async ({ conversationId, userId }, callback) => {
      try {
        await dataService.markConversationAsRead(conversationId, userId);
        // Broadcast read receipt to room so checkmarks update in real-time
        io.to(`conv_${conversationId}`).emit('messages_read', {
          conversationId,
          readerId: userId,
          readAt: new Date().toISOString()
        });
        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // 6. Typing indicators
    socket.on('typing_start', ({ conversationId, userId, userEmail, userName }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userEmail,
        userName,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ conversationId, userId, userEmail, userName }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userEmail,
        userName,
        isTyping: false
      });
    });

    // 7. WebRTC & Private Video Meeting Rooms
    socket.on('join_meeting', async ({ meetingId, user }, callback) => {
      try {
        if (!meetingId || !user) {
          if (typeof callback === 'function') callback({ success: false, error: 'Invalid meeting parameters' });
          return;
        }

        const verification = await dataService.verifyMeetingAccess(meetingId, user);
        if (!verification.allowed) {
          socket.emit('meeting_access_denied', { error: verification.reason || 'Access Denied: You are not authorized to join this meeting.' });
          if (typeof callback === 'function') callback({ success: false, error: verification.reason });
          return;
        }

        const email = (user.email || '').toLowerCase().trim();
        const id = user.id || email;
        const name = user.name || email;

        const meetingRoom = `meet_${meetingId}`;
        socket.join(meetingRoom);

        // Store meeting metadata on socket
        socket.meetingId = meetingId;
        socket.meetingUser = { id, email, name, role: user.role || 'user' };

        // Fetch existing peers in this room (excluding self)
        const roomSockets = await io.in(meetingRoom).fetchSockets();
        const existingPeers = roomSockets
          .filter(s => s.id !== socket.id && s.meetingUser)
          .map(s => ({
            socketId: s.id,
            user: s.meetingUser
          }));

        // Broadcast to existing room peers that a new user joined
        socket.to(meetingRoom).emit('user_joined_meeting', {
          socketId: socket.id,
          user: socket.meetingUser
        });

        if (typeof callback === 'function') {
          callback({
            success: true,
            meeting: verification.meeting,
            existingPeers
          });
        }
      } catch (err) {
        console.error('[Socket] join_meeting error:', err.message);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('webrtc_signal', ({ meetingId, targetSocketId, signal, senderUser }) => {
      if (!meetingId || !targetSocketId || !signal) return;
      if (socket.meetingId !== meetingId) return;

      io.to(targetSocketId).emit('webrtc_signal', {
        senderSocketId: socket.id,
        signal,
        senderUser: senderUser || socket.meetingUser
      });
    });

    socket.on('leave_meeting', ({ meetingId }) => {
      if (!meetingId) return;
      const meetingRoom = `meet_${meetingId}`;
      socket.leave(meetingRoom);
      socket.to(meetingRoom).emit('user_left_meeting', {
        socketId: socket.id,
        user: socket.meetingUser
      });
      socket.meetingId = null;
      socket.meetingUser = null;
    });

    // 8. Disconnect handling (when user closes tab or website)
    socket.on('disconnect', () => {
      if (socket.meetingId) {
        const meetingRoom = `meet_${socket.meetingId}`;
        socket.to(meetingRoom).emit('user_left_meeting', {
          socketId: socket.id,
          user: socket.meetingUser
        });
      }

      const removed = activeSockets.get(socket.id);
      activeSockets.delete(socket.id);

      if (removed) {
        const stillOnline = getOnlineUsers().some(u =>
          (removed.email && u.email === removed.email) ||
          (removed.id && u.id === removed.id)
        );

        if (!stillOnline) {
          // Broadcast that this user is now OFFLINE
          io.emit('user_offline', {
            id: removed.id,
            email: removed.email
          });
        }
      }

      // Broadcast the updated online list to all remaining clients
      io.emit('online_users', getOnlineUsers());
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO, getOnlineUsers };

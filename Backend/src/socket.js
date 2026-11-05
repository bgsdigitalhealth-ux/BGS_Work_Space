const { Server } = require('socket.io');
const dataService = require('./seed/dataService');

let io = null;
// Active online sockets and users:
// onlineUsers: Map<userId, { socketIds: Set<string>, user: { id, email, name, role } }>
const onlineUsers = new Map();

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
    let currentUserId = null;
    let currentUserEmail = null;

    // 1. User registers their socket connection
    socket.on('register_user', (userData) => {
      if (!userData || (!userData.id && !userData.email)) return;
      currentUserId = userData.id || userData.email;
      currentUserEmail = (userData.email || '').toLowerCase().trim();

      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, {
          socketIds: new Set(),
          user: {
            id: currentUserId,
            email: currentUserEmail,
            name: userData.name || '',
            role: userData.role || 'user'
          }
        });
      }
      onlineUsers.get(currentUserId).socketIds.add(socket.id);

      // Join private user rooms for targeted notifications
      socket.join(`user_${currentUserId}`);
      if (currentUserEmail) {
        socket.join(`user_${currentUserEmail}`);
      }

      // Send the current list of online users directly to this socket
      const allOnline = Array.from(onlineUsers.values()).map(e => e.user);
      socket.emit('online_users', allOnline);

      // Broadcast to everyone else that this user is online
      socket.broadcast.emit('user_online', {
        id: currentUserId,
        email: currentUserEmail,
        name: userData.name || '',
        role: userData.role || 'user'
      });
    });

    // Request active online users
    socket.on('get_online_users', (callback) => {
      const allOnline = Array.from(onlineUsers.values()).map(e => e.user);
      if (typeof callback === 'function') {
        callback(allOnline);
      } else {
        socket.emit('online_users', allOnline);
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

    // 7. Disconnect handling
    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const entry = onlineUsers.get(currentUserId);
        entry.socketIds.delete(socket.id);
        if (entry.socketIds.size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit('user_offline', {
            id: currentUserId,
            email: currentUserEmail
          });
        }
      }
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };

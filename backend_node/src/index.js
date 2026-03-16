require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const apiRoutes = require('./routes/api');
const Message = require('./models/Message');
const User = require('./models/User');
const Chat = require('./models/Chat');

const app = express();
const server = http.createServer(app);

// ── CORS Configuration ─────────────────────────────────────────────────────────
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://securetalk-chat.onrender.com'];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim()).concat(defaultOrigins)
  : defaultOrigins;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
};

// ── Socket.IO ───────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// ── Middleware ───────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Explicit fallback headers just in case for Render
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// Health check (outside /api)
app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));

// ── Socket.IO Real-Time Logic ───────────────────────────────────────────────────
const userSockets = new Map(); // userId -> Set<socketId>

io.on('connection', (socket) => {
  console.log(`[Socket.IO] New connection: ${socket.id}`);

  socket.on('authenticate', async ({ userId }) => {
    if (!userId) return;
    socket.userId = userId;

    // Track multiple sockets per user (multi-device support)
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socket.id);
    socket.join(`user:${userId}`);

    // Update status
    try {
      await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });
      io.emit('presence', { userId, status: 'online' });

      // Cache user status in Redis
      if (redisClient.isReady) {
        await redisClient.set(`user:status:${userId}`, 'online', { EX: 3600 });
      }
    } catch (err) {
      console.error('[Socket.IO] Auth status update error:', err.message);
    }

    console.log(`[Socket.IO] User authenticated: ${userId}`);
  });

  socket.on('joinChat', (chatId) => {
    socket.join(`chat:${chatId}`);
    console.log(`[Socket.IO] Socket ${socket.id} joined chat: ${chatId}`);
  });

  socket.on('leaveChat', (chatId) => {
    socket.leave(`chat:${chatId}`);
  });

  socket.on('sendMessage', async (payload) => {
    try {
      const { chatId, senderId, encryptedMessage, encryptedKeys, mediaUrl, messageType } = payload;

      const newMessage = new Message({
        chatId,
        senderId,
        encryptedMessage,
        encryptedKeys,
        mediaUrl,
        messageType,
        timestamp: new Date(),
      });

      const savedMessage = await newMessage.save();

      // Update chat's last message and timestamp
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: encryptedMessage,
        updatedAt: new Date(),
      });

      // Broadcast to all members in the chat room
      io.to(`chat:${chatId}`).emit('receiveMessage', savedMessage);

      // Cache last message in Redis for quick access
      if (redisClient.isReady) {
        await redisClient.set(`chat:lastMsg:${chatId}`, JSON.stringify(savedMessage), { EX: 600 });
      }
    } catch (err) {
      console.error('[Socket.IO] Message failure:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('activity', (payload) => {
    // payload: { chatId, userId, typing, recording }
    socket.to(`chat:${payload.chatId}`).emit('activity', payload);
  });

  socket.on('reaction', async (payload) => {
    // payload: { chatId, messageId, reaction: { userId, emoji } }
    try {
      await Message.findByIdAndUpdate(payload.messageId, {
        $push: { reactions: payload.reaction },
      });
      io.to(`chat:${payload.chatId}`).emit('reaction', payload);
    } catch (err) {
      console.error('[Socket.IO] Reaction failure:', err.message);
    }
  });

  socket.on('markRead', async ({ chatId, userId }) => {
    try {
      await Message.updateMany(
        { chatId, senderId: { $ne: userId }, status: { $ne: 'read' } },
        { status: 'read' }
      );
      io.to(`chat:${chatId}`).emit('messagesRead', { chatId, readBy: userId });
    } catch (err) {
      console.error('[Socket.IO] Mark read failure:', err.message);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      const userId = socket.userId;
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          // Only set offline if no more sockets for this user
          try {
            await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
            io.emit('presence', { userId, status: 'offline' });
            if (redisClient.isReady) {
              await redisClient.set(`user:status:${userId}`, 'offline', { EX: 3600 });
            }
          } catch (err) {
            console.error('[Socket.IO] Disconnect status error:', err.message);
          }
        }
      }
      console.log(`[Socket.IO] User disconnected: ${userId}`);
    }
  });
});

// ── Error Handling ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start Server ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    server.listen(PORT, () => {
      console.log(`\n[Server] 🚀 SecureChat Node.js Backend running on port ${PORT}`);
      console.log(`[Server] 📡 Socket.IO ready for real-time connections`);
      console.log(`[Server] 🔐 CORS origins: ${allowedOrigins.join(', ')}\n`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
};

startServer();

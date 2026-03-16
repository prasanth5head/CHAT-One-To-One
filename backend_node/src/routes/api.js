const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const chatController = require('../controllers/chatController');
const messageController = require('../controllers/messageController');
const userController = require('../controllers/userController');
const mediaController = require('../controllers/mediaController');
const authMiddleware = require('../middleware/authMiddleware');

// ── Health ──────────────────────────────────────────────────────────────────────
router.get('/health', (req, res) =>
  res.json({
    status: 'UP',
    message: 'SecureChat Backend Running',
    stack: 'Node.js + Express + Socket.IO + MongoDB + Redis',
    timestamp: new Date().toISOString(),
  })
);

// ── Authentication ──────────────────────────────────────────────────────────────
router.post('/auth/google', authController.authenticate);
router.post('/auth/test', authController.authenticateTest);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);

// ── Users ───────────────────────────────────────────────────────────────────────
router.get('/users/search', authMiddleware, userController.searchUsers);
router.get('/users/nicknames', authMiddleware, userController.getNicknames);
router.post('/users/nickname', authMiddleware, userController.setNickname);
router.get('/users/:id', authMiddleware, userController.getUserById);
router.put('/users/profile', authMiddleware, userController.updateProfile);

// ── Chats ───────────────────────────────────────────────────────────────────────
router.get('/chats', authMiddleware, chatController.getUserChats);
router.post('/chats/:userId', authMiddleware, chatController.createOrGetChat);
router.put('/chats/:chatId/wallpaper', authMiddleware, chatController.updateWallpaper);
router.delete('/chats/:chatId', authMiddleware, chatController.deleteChat);

// ── Groups ──────────────────────────────────────────────────────────────────────
router.post('/groups/create', authMiddleware, chatController.createGroup);
router.post('/groups/:groupId/add', authMiddleware, chatController.addGroupMember);

// ── Messages ────────────────────────────────────────────────────────────────────
router.get('/messages/:chatId', authMiddleware, messageController.getMessages);
router.delete('/messages/:messageId', authMiddleware, messageController.deleteMessage);
router.post('/messages/:chatId/read', authMiddleware, messageController.markAsRead);

// ── Media ───────────────────────────────────────────────────────────────────────
router.post('/media/upload', authMiddleware, mediaController.uploadMedia);

module.exports = router;

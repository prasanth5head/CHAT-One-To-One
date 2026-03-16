const Message = require('../models/Message');
const Chat = require('../models/Chat');
const { redisClient } = require('../config/redis');

// ── Get Messages for a Chat ─────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  try {
    // Try Redis cache for recent messages
    if (parseInt(page) === 1) {
      const cached = await redisClient.get(`messages:${chatId}:page1`);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const messages = await Message.find({ chatId, isDeleted: { $ne: true } })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Cache first page for 15 seconds
    if (parseInt(page) === 1) {
      await redisClient.set(`messages:${chatId}:page1`, JSON.stringify(messages), { EX: 15 });
    }

    res.json(messages);
  } catch (error) {
    console.error('[Message] Get messages error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Delete Message (Soft Delete) ────────────────────────────────────────────────
exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Verify sender is deleting their own message
    if (String(message.senderId) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    // Invalidate cache
    await redisClient.del(`messages:${message.chatId}:page1`);

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('[Message] Delete error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Mark Messages as Read ───────────────────────────────────────────────────────
exports.markAsRead = async (req, res) => {
  const { chatId } = req.params;
  const currentUserId = req.user.id;
  try {
    const result = await Message.updateMany(
      { chatId, senderId: { $ne: currentUserId }, status: { $ne: 'read' } },
      { status: 'read' }
    );

    // Invalidate cache
    await redisClient.del(`messages:${chatId}:page1`);

    res.json({ message: 'Messages marked as read', count: result.modifiedCount });
  } catch (error) {
    console.error('[Message] Mark read error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

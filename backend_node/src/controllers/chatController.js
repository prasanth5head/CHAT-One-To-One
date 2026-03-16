const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');
const { redisClient } = require('../config/redis');

// ── Create or Get Direct Chat ───────────────────────────────────────────────────
exports.createOrGetChat = async (req, res) => {
  const currentUserId = req.user.id;
  let targetUserId = req.params.userId;

  try {
    // Resolve email to user ID if needed (for "Summon" logic)
    if (targetUserId.includes('@')) {
      let targetUser = await User.findOne({ email: targetUserId.toLowerCase() });
      if (targetUser) {
        targetUserId = targetUser._id;
      } else if (targetUserId.endsWith('@test.com')) {
        // Auto-provision test account
        const newUser = new User({
          email: targetUserId.toLowerCase(),
          name: targetUserId.split('@')[0],
          publicKey: '',
          status: 'offline',
        });
        const savedUser = await newUser.save();
        targetUserId = savedUser._id;
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Check for existing direct chat between these users
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, targetUserId], $size: 2 },
    });

    if (!chat) {
      chat = new Chat({
        participants: [currentUserId, targetUserId],
        isGroup: false,
      });
      await chat.save();
    }

    res.json(chat);
  } catch (error) {
    console.error('[Chat] Create/get error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get All User Chats ──────────────────────────────────────────────────────────
exports.getUserChats = async (req, res) => {
  try {
    // Try Redis cache first
    const cacheKey = `user:chats:${req.user.id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const chats = await Chat.find({
      participants: req.user.id,
    }).sort({ updatedAt: -1 });

    // Cache for 30 seconds
    await redisClient.set(cacheKey, JSON.stringify(chats), { EX: 30 });

    res.json(chats);
  } catch (error) {
    console.error('[Chat] Get chats error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Update Chat Wallpaper ───────────────────────────────────────────────────────
exports.updateWallpaper = async (req, res) => {
  const { chatId } = req.params;
  const { wallpaperUrl } = req.body;
  try {
    const chat = await Chat.findByIdAndUpdate(
      chatId,
      { wallpaperUrl },
      { new: true }
    );
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Invalidate cache
    for (const pid of chat.participants) {
      await redisClient.del(`user:chats:${pid}`);
    }

    res.json(chat);
  } catch (err) {
    console.error('[Chat] Update wallpaper error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Delete Chat ─────────────────────────────────────────────────────────────────
exports.deleteChat = async (req, res) => {
  const { chatId } = req.params;
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Verify user is a participant
    if (!chat.participants.map(String).includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this chat' });
    }

    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    // Invalidate cache for all participants
    for (const pid of chat.participants) {
      await redisClient.del(`user:chats:${pid}`);
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('[Chat] Delete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Create Group Chat ───────────────────────────────────────────────────────────
exports.createGroup = async (req, res) => {
  const { groupName, members, createdBy } = req.body;

  if (!groupName || !members || members.length < 2) {
    return res.status(400).json({ message: 'Group name and at least 2 members required' });
  }

  try {
    const chat = new Chat({
      participants: members,
      isGroup: true,
      groupName,
      createdBy: createdBy || req.user.id,
    });
    await chat.save();

    // Invalidate cache for all members
    for (const mid of members) {
      await redisClient.del(`user:chats:${mid}`);
    }

    res.status(201).json(chat);
  } catch (err) {
    console.error('[Chat] Create group error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Add Member to Group ─────────────────────────────────────────────────────────
exports.addGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const chat = await Chat.findById(groupId);
    if (!chat || !chat.isGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (chat.participants.map(String).includes(userId)) {
      return res.status(400).json({ message: 'User already in group' });
    }

    chat.participants.push(userId);
    await chat.save();

    // Invalidate cache
    for (const pid of chat.participants) {
      await redisClient.del(`user:chats:${pid}`);
    }

    res.json(chat);
  } catch (err) {
    console.error('[Chat] Add member error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

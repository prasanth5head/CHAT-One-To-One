const User = require('../models/User');
const { redisClient } = require('../config/redis');

// ── Search Users ────────────────────────────────────────────────────────────────
exports.searchUsers = async (req, res) => {
  const { email } = req.query;
  const currentUserId = req.user.id;

  if (!email || email.length < 2) {
    return res.status(400).json({ message: 'Search query must be at least 2 characters' });
  }

  try {
    const users = await User.find({
      $or: [
        { email: { $regex: email, $options: 'i' } },
        { name: { $regex: email, $options: 'i' } },
        { displayName: { $regex: email, $options: 'i' } },
      ],
      _id: { $ne: currentUserId },
    })
      .select('name email avatar displayName status publicKey')
      .limit(10);

    res.json(users);
  } catch (err) {
    console.error('[User] Search error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Update Profile ──────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  const currentUserId = req.user.id;
  const { displayName, avatar, bio, status, chatWallpaperUrl } = req.body;

  try {
    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (displayName !== undefined) user.displayName = displayName;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (status !== undefined) user.status = status;
    if (chatWallpaperUrl !== undefined) user.chatWallpaperUrl = chatWallpaperUrl;

    await user.save();

    // Invalidate cached user data
    await redisClient.del(`user:${currentUserId}`);

    res.json(user);
  } catch (err) {
    console.error('[User] Update profile error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get User by ID ──────────────────────────────────────────────────────────────
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Try cache first
    const cached = await redisClient.get(`user:${userId}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const user = await User.findById(userId)
      .select('name email avatar displayName status publicKey bio lastSeen');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cache for 60 seconds
    await redisClient.set(`user:${userId}`, JSON.stringify(user), { EX: 60 });

    res.json(user);
  } catch (err) {
    console.error('[User] Get by ID error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get Nicknames ───────────────────────────────────────────────────────────────
exports.getNicknames = async (req, res) => {
  // Nicknames are stored client-side for now; return empty array
  // Can be extended with a Nickname model if needed
  res.json([]);
};

// ── Set Nickname ────────────────────────────────────────────────────────────────
exports.setNickname = async (req, res) => {
  // Placeholder — nicknames stored client-side
  res.json({ message: 'Nickname updated' });
};

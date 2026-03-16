const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const bcrypt = require('bcryptjs');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId, email) => {
  return jwt.sign(
    { sub: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ── Google OAuth Authentication ─────────────────────────────────────────────────
exports.authenticate = async (req, res) => {
  const { token, publicKey } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    let email, name, picture;

    // Strategy 1: Verify Google ID Token
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } catch (idTokenErr) {
      // Strategy 2: Fallback to Access Token (Userinfo endpoint)
      try {
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = googleRes.data;
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (accessTokenErr) {
        return res.status(401).json({ message: 'Invalid Google token' });
      }
    }

    if (!email) {
      return res.status(401).json({ message: 'Could not extract email from Google token' });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.avatar = picture || user.avatar;
      user.name = name || user.name;
      if (publicKey) user.publicKey = publicKey;
      user.status = 'online';
      user.lastSeen = new Date();
    } else {
      user = new User({
        email,
        name: name || email.split('@')[0],
        avatar: picture,
        publicKey: publicKey || '',
        status: 'online',
      });
    }

    await user.save();
    const jwtToken = generateToken(user._id, user.email);

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('[Auth] Google auth error:', error.message);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// ── Test Account Authentication ─────────────────────────────────────────────────
exports.authenticateTest = async (req, res) => {
  const { email, password, publicKey } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (!email.endsWith('@test.com')) {
    return res.status(401).json({ message: 'Only @test.com accounts allowed for testing' });
  }

  if (password !== 'test123') {
    return res.status(401).json({ message: 'Invalid test password' });
  }

  try {
    let user = await User.findOne({ email });

    if (user) {
      if (publicKey) user.publicKey = publicKey;
      user.status = 'online';
      user.lastSeen = new Date();
    } else {
      user = new User({
        email,
        name: email.split('@')[0],
        publicKey: publicKey || '',
        status: 'online',
      });
    }

    await user.save();
    const jwtToken = generateToken(user._id, user.email);

    res.json({ token: jwtToken, user });
  } catch (error) {
    console.error('[Auth] Test auth error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Get Current User ────────────────────────────────────────────────────────────
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Auth] Get current user error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

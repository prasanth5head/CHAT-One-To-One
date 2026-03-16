const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false }, // For test/traditional accounts, hidden by default
  avatar: { type: String },
  bio: { type: String, maxlength: 500 },
  status: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  displayName: { type: String, trim: true },
  chatWallpaperUrl: { type: String },
  publicKey: { type: String, default: '' },
  lastSeen: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index for fast email searches
userSchema.index({ email: 1 });
userSchema.index({ name: 'text', displayName: 'text' });

module.exports = mongoose.model('User', userSchema);

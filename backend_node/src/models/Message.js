const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  encryptedMessage: { type: String, required: true },
  encryptedKeys: { type: Map, of: String }, // userId -> encrypted AES key
  mediaUrl: { type: String },
  fileUrl: { type: String },
  audioUrl: { type: String },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'voice'],
    default: 'text',
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  reactions: [{
    userId: { type: String },
    emoji: { type: String },
  }],
  isDeleted: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      ret.timestamp = ret.createdAt;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index for fetching messages in a chat sorted by time
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ chatId: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);

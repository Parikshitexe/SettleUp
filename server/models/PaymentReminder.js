// server/models/PaymentReminder.js
const mongoose = require('mongoose');

const paymentReminderSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  reminderType: {
    type: String,
    enum: ['one_time', 'daily', 'weekly'],
    default: 'one_time'
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date
  },
  lastReminderSent: {
    type: Date
  },
  nextReminderDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: {
    type: Date
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
paymentReminderSchema.index({ group: 1, to: 1, isActive: 1 });
paymentReminderSchema.index({ from: 1, isActive: 1 });
paymentReminderSchema.index({ nextReminderDate: 1, isActive: 1 });

module.exports = mongoose.model('PaymentReminder', paymentReminderSchema);
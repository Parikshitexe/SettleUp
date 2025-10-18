// server/models/Group.js - UPDATED VERSION
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a group name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  budgetLimit: {
    type: Number,
    default: null, // No limit by default
    min: 0.01
  },
  budgetSetBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Who set the budget
  },
  budgetSetAt: {
    type: Date // When was budget last set/updated
  },
  budgetExceedNotified: {
    type: Boolean,
    default: false // Track if members were notified about exceeding
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Group', groupSchema);
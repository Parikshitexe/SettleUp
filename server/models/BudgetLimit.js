// server/models/BudgetLimit.js
const mongoose = require('mongoose');

const budgetLimitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthYear: {
    type: String, // Format: "2024-12" (YYYY-MM)
    required: true
  },
  limit: {
    type: Number,
    required: true,
    min: 0.01
  },
  spent: {
    type: Number,
    default: 0,
    min: 0
  },
  exceedNotified: {
    type: Boolean,
    default: false // Track if user was already notified about exceeding
  },
  isActive: {
    type: Boolean,
    default: true
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

// Compound index: user + monthYear (for efficient queries)
budgetLimitSchema.index({ user: 1, monthYear: 1 }, { unique: true });

module.exports = mongoose.model('BudgetLimit', budgetLimitSchema);
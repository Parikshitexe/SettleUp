// server/routes/paymentReminders.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const PaymentReminder = require('../models/PaymentReminder');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const NotificationService = require('../utils/notificationService');
const User = require('../models/User');

// @route   GET /api/payment-reminders
// @desc    Get all payment reminders for logged-in user (sent and received)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type = 'all' } = req.query; // 'all', 'sent', 'received', 'pending'

    let query = { isActive: true };

    if (type === 'sent') {
      query.from = req.user.id;
    } else if (type === 'received') {
      query.to = req.user.id;
    } else if (type === 'pending') {
      query.to = req.user.id;
      query.acknowledged = false;
    }

    const reminders = await PaymentReminder.find(query)
      .populate('from', 'name email profilePicture')
      .populate('to', 'name email profilePicture')
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json(reminders);
  } catch (error) {
    console.error('Get payment reminders error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/payment-reminders/group/:groupId
// @desc    Get payment reminders for a specific group
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const reminders = await PaymentReminder.find({
      group: req.params.groupId,
      isActive: true
    })
      .populate('from', 'name email profilePicture')
      .populate('to', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    res.json(reminders);
  } catch (error) {
    console.error('Get group reminders error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/payment-reminders
// @desc    Create a payment reminder
// @access  Private
router.post('/', [
  auth,
  body('groupId', 'Group ID is required').notEmpty(),
  body('to', 'Recipient user ID is required').notEmpty(),
  body('amount', 'Amount must be greater than 0').isFloat({ min: 0.01 }),
  body('reminderType', 'Invalid reminder type').isIn(['one_time', 'daily', 'weekly']),
  body('dueDate', 'Due date must be in future').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { groupId, to, amount, reminderType, description, dueDate } = req.body;
    const from = req.user.id;

    // Validate group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is group member
    const isFromMember = group.members.some(m => m.toString() === from);
    const isToMember = group.members.some(m => m.toString() === to);

    if (!isFromMember || !isToMember) {
      return res.status(400).json({ msg: 'Both users must be group members' });
    }

    // Can't send to self
    if (from === to) {
      return res.status(400).json({ msg: 'Cannot send reminder to yourself' });
    }

    // Calculate next reminder date
    let nextReminderDate = new Date();
    if (reminderType === 'daily') {
      nextReminderDate.setDate(nextReminderDate.getDate() + 1);
    } else if (reminderType === 'weekly') {
      nextReminderDate.setDate(nextReminderDate.getDate() + 7);
    }

    const reminder = new PaymentReminder({
      group: groupId,
      from,
      to,
      amount: parseFloat(amount),
      reminderType,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      nextReminderDate,
      lastReminderSent: new Date()
    });

    await reminder.save();

    // Create notification
    const fromUser = await PaymentReminder.findById(reminder._id).populate('from', 'name');
    const toUser = await PaymentReminder.findById(reminder._id).populate('to');

    await Notification.create({
      recipient: to,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      message: `${(await Group.findById(from).populate('from', 'name')).members} reminded you to pay ₹${amount.toFixed(2)}`,
      relatedUser: from,
      relatedGroup: groupId,
      actionUrl: `/groups/${groupId}`,
      read: false
    });

    const populatedReminder = await PaymentReminder.findById(reminder._id)
      .populate('from', 'name email profilePicture')
      .populate('to', 'name email profilePicture')
      .populate('group', 'name');

    res.json(populatedReminder);
  } catch (error) {
    console.error('Create payment reminder error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/payment-reminders/:id/acknowledge
// @desc    Acknowledge/snooze a payment reminder
// @access  Private
router.put('/:id/acknowledge', auth, async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }

    if (reminder.to.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    reminder.acknowledged = true;
    reminder.acknowledgedAt = new Date();
    reminder.acknowledgedBy = req.user.id;

    await reminder.save();

    res.json(reminder);
  } catch (error) {
    console.error('Acknowledge reminder error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/payment-reminders/:id/snooze
// @desc    Snooze a payment reminder (1 day)
// @access  Private
router.put('/:id/snooze', auth, async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }

    if (reminder.to.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Snooze for 1 day
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 1);
    reminder.nextReminderDate = snoozeDate;

    await reminder.save();

    res.json({ msg: 'Reminder snoozed for 1 day' });
  } catch (error) {
    console.error('Snooze reminder error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/payment-reminders/:id/deactivate
// @desc    Deactivate a payment reminder
// @access  Private
router.put('/:id/deactivate', auth, async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }

    // Either sender or receiver can deactivate
    if (reminder.from.toString() !== req.user.id && reminder.to.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    reminder.isActive = false;
    await reminder.save();

    res.json({ msg: 'Reminder deactivated' });
  } catch (error) {
    console.error('Deactivate reminder error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/payment-reminders/:id
// @desc    Delete a payment reminder
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const reminder = await PaymentReminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }

    // Only sender can delete
    if (reminder.from.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await reminder.deleteOne();

    res.json({ msg: 'Reminder deleted' });
  } catch (error) {
    console.error('Delete reminder error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
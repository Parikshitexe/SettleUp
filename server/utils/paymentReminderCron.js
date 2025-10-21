// server/utils/paymentReminderCron.js
const PaymentReminder = require('../models/PaymentReminder');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Run this every 1 hour to check and send scheduled reminders
const processPaymentReminders = async () => {
  try {
    const now = new Date();

    // Find all active reminders where nextReminderDate has passed
    const remindersDue = await PaymentReminder.find({
      isActive: true,
      nextReminderDate: { $lte: now }
    })
      .populate('from', 'name')
      .populate('to', 'name')
      .populate('group', 'name');

    

    for (const reminder of remindersDue) {
      try {
        // Get user details
        const toUser = await User.findById(reminder.to);
        const fromUser = await User.findById(reminder.from);

        // Create notification
        await Notification.create({
          recipient: reminder.to,
          type: 'payment_reminder',
          title: 'Payment Reminder',
          message: `${fromUser.name} reminded you to pay ₹${reminder.amount.toFixed(2)} in ${reminder.group.name}`,
          relatedUser: reminder.from,
          relatedGroup: reminder.group,
          actionUrl: `/groups/${reminder.group._id}`,
          read: false
        });

        // Update reminder
        reminder.lastReminderSent = now;

        // Calculate next reminder date based on type
        if (reminder.reminderType === 'one_time') {
          reminder.isActive = false;
        } else if (reminder.reminderType === 'daily') {
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + 1);
          reminder.nextReminderDate = nextDate;
        } else if (reminder.reminderType === 'weekly') {
          const nextDate = new Date(now);
          nextDate.setDate(nextDate.getDate() + 7);
          reminder.nextReminderDate = nextDate;
        }

        await reminder.save();

        console.log(`✓ Reminder sent to ${toUser.email} for ₹${reminder.amount}`);
      } catch (error) {
        console.error(`Error processing reminder ${reminder._id}:`, error.message);
      }
    }

    console.log('Payment reminder processing complete');
  } catch (error) {
    console.error('Payment reminder cron error:', error.message);
  }
};

module.exports = { processPaymentReminders };
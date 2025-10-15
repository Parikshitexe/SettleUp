// server/utils/notificationService.js
const Notification = require('../models/Notification');

const NotificationService = {
  /**
   * Create and save a notification
   */
  async createNotification(data) {
    try {
      const notification = new Notification({
        recipient: data.recipient,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedUser: data.relatedUser || null,
        relatedGroup: data.relatedGroup || null,
        relatedExpense: data.relatedExpense || null,
        relatedSettlement: data.relatedSettlement || null,
        actionUrl: data.actionUrl || null
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Friend request notification
   */
  async notifyFriendRequest(fromUser, toUserId, fromUserName) {
    return this.createNotification({
      recipient: toUserId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${fromUserName} sent you a friend request`,
      relatedUser: fromUser,
      actionUrl: '/friends'
    });
  },

  /**
   * Friend request accepted notification
   */
  async notifyFriendAccepted(toUserId, acceptedByName) {
    return this.createNotification({
      recipient: toUserId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `${acceptedByName} accepted your friend request`,
      actionUrl: '/friends'
    });
  },

  /**
   * Expense added notification
   */
  async notifyExpenseAdded(groupMembers, groupId, expenseDescription, paidByName, amount) {
    const notifications = [];

    for (const memberId of groupMembers) {
      notifications.push(
        this.createNotification({
          recipient: memberId,
          type: 'expense_added',
          title: 'New Expense',
          message: `${paidByName} added expense: ${expenseDescription} (₹${amount.toFixed(2)})`,
          relatedGroup: groupId,
          actionUrl: `/groups/${groupId}`
        })
      );
    }

    return Promise.all(notifications);
  },

  /**
   * Settlement recorded notification
   */
  async notifySettlement(paidToId, paidByName, amount, groupId) {
    return this.createNotification({
      recipient: paidToId,
      type: 'settlement_recorded',
      title: 'Payment Received',
      message: `${paidByName} paid you ₹${amount.toFixed(2)}`,
      relatedGroup: groupId,
      actionUrl: `/groups/${groupId}`
    });
  },

  /**
   * Group created notification
   */
  async notifyGroupCreated(groupMembers, groupId, groupName, creatorName) {
    const notifications = [];

    for (const memberId of groupMembers) {
      notifications.push(
        this.createNotification({
          recipient: memberId,
          type: 'group_created',
          title: 'Added to Group',
          message: `${creatorName} added you to group: ${groupName}`,
          relatedGroup: groupId,
          actionUrl: `/groups/${groupId}`
        })
      );
    }

    return Promise.all(notifications);
  },

  /**
   * Member added to group notification
   */
  async notifyMemberAdded(groupMembers, groupId, groupName, newMemberName) {
    const notifications = [];

    for (const memberId of groupMembers) {
      notifications.push(
        this.createNotification({
          recipient: memberId,
          type: 'member_added',
          title: 'New Member Added',
          message: `${newMemberName} was added to group: ${groupName}`,
          relatedGroup: groupId,
          actionUrl: `/groups/${groupId}`
        })
      );
    }

    return Promise.all(notifications);
  },

  /**
   * Payment reminder notification
   */
  async notifyPaymentReminder(debtorId, creditorName, amount, groupName) {
    return this.createNotification({
      recipient: debtorId,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      message: `You owe ${creditorName} ₹${amount.toFixed(2)} in ${groupName}`,
      actionUrl: '/friends'
    });
  }
};

module.exports = NotificationService;
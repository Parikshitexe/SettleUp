// server/utils/budgetService.js
const Group = require('../models/Group');
const BudgetLimit = require('../models/BudgetLimit');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');

const BudgetService = {
  // Get current month in YYYY-MM format
  getCurrentMonth: () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  // Check and notify group budget exceeded
  async checkGroupBudget(groupId) {
    try {
      const group = await Group.findById(groupId).populate('members', '_id name email');

      if (!group || !group.budgetLimit) {
        return { exceeded: false };
      }

      // Calculate total expenses
      const expenses = await Expense.find({ groupId });
      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      const exceeded = totalSpent > group.budgetLimit;
      const percentageUsed = (totalSpent / group.budgetLimit) * 100;

      // If exceeded and not yet notified, send notifications
      if (exceeded && !group.budgetExceedNotified) {
        console.log(`Group budget exceeded for group ${groupId}`);

        // Notify all members
        for (const member of group.members) {
          try {
            await Notification.create({
              recipient: member._id,
              type: 'budget_exceeded',
              title: 'Group Budget Exceeded',
              message: `Group "${group.name}" has exceeded its budget limit of ₹${group.budgetLimit.toFixed(2)}. Current spending: ₹${totalSpent.toFixed(2)} (${percentageUsed.toFixed(1)}%)`,
              relatedGroup: groupId,
              actionUrl: `/groups/${groupId}`,
              read: false
            });
          } catch (error) {
            console.error(`Error notifying member ${member._id}:`, error.message);
          }
        }

        // Mark as notified
        group.budgetExceedNotified = true;
        await group.save();

        return {
          exceeded: true,
          totalSpent,
          limit: group.budgetLimit,
          percentageUsed,
          notified: true
        };
      }

      return {
        exceeded,
        totalSpent,
        limit: group.budgetLimit,
        percentageUsed,
        notified: false
      };
    } catch (error) {
      console.error('Error checking group budget:', error.message);
      throw error;
    }
  },

  // Check and notify personal budget exceeded
  async checkPersonalBudget(userId) {
    try {
      const monthYear = this.getCurrentMonth();

      let budget = await BudgetLimit.findOne({
        user: userId,
        monthYear
      });

      if (!budget) {
        return { exceeded: false };
      }

      // Calculate total expenses for this user this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const expenses = await Expense.find({
        paidBy: userId,
        date: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      });

      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      budget.spent = totalSpent;
      await budget.save();

      const exceeded = totalSpent > budget.limit;
      const percentageUsed = (totalSpent / budget.limit) * 100;

      // If exceeded and not yet notified, send notification
      if (exceeded && !budget.exceedNotified) {
        console.log(`Personal budget exceeded for user ${userId}`);

        await Notification.create({
          recipient: userId,
          type: 'personal_budget_exceeded',
          title: 'Personal Budget Exceeded',
          message: `You have exceeded your personal monthly budget of ₹${budget.limit.toFixed(2)}. Current spending: ₹${totalSpent.toFixed(2)} (${percentageUsed.toFixed(1)}%)`,
          actionUrl: '/profile',
          read: false
        });

        // Mark as notified
        budget.exceedNotified = true;
        await budget.save();

        return {
          exceeded: true,
          totalSpent,
          limit: budget.limit,
          percentageUsed,
          notified: true
        };
      }

      return {
        exceeded,
        totalSpent,
        limit: budget.limit,
        percentageUsed,
        notified: false
      };
    } catch (error) {
      console.error('Error checking personal budget:', error.message);
      throw error;
    }
  }
};

module.exports = BudgetService;
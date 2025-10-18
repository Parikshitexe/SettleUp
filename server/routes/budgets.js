// server/routes/budgets.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const BudgetLimit = require('../models/BudgetLimit');
const Expense = require('../models/Expense');
const User = require('../models/User');

// Helper: Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// ==================== GROUP BUDGET ====================

// @route   PUT /api/budgets/group/:groupId
// @desc    Set or update group budget limit
// @access  Private (any group member)
router.put('/group/:groupId', [
  auth,
  body('limit', 'Budget limit must be greater than 0').isFloat({ min: 0.01 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { limit } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is group member
    const isMember = group.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Update budget
    group.budgetLimit = parseFloat(limit);
    group.budgetSetBy = req.user.id;
    group.budgetSetAt = new Date();
    group.budgetExceedNotified = false; // Reset notification flag

    await group.save();

    res.json({
      msg: 'Group budget updated successfully',
      budget: {
        limit: group.budgetLimit,
        setBy: group.budgetSetBy,
        setAt: group.budgetSetAt
      }
    });
  } catch (error) {
    console.error('Set group budget error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/budgets/group/:groupId
// @desc    Get group budget with progress
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId).populate('budgetSetBy', 'name');

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is group member
    const isMember = group.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (!group.budgetLimit) {
      return res.json({
        hasBudget: false,
        msg: 'No budget limit set for this group'
      });
    }

    // Calculate total expenses for this group
    const expenses = await Expense.find({ groupId: req.params.groupId });
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const percentageUsed = (totalSpent / group.budgetLimit) * 100;
    const exceeded = totalSpent > group.budgetLimit;

    res.json({
      hasBudget: true,
      limit: group.budgetLimit,
      spent: parseFloat(totalSpent.toFixed(2)),
      remaining: parseFloat((group.budgetLimit - totalSpent).toFixed(2)),
      percentageUsed: parseFloat(percentageUsed.toFixed(2)),
      exceeded,
      setBy: group.budgetSetBy,
      setAt: group.budgetSetAt,
      exceedNotified: group.budgetExceedNotified
    });
  } catch (error) {
    console.error('Get group budget error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/budgets/group/:groupId
// @desc    Remove group budget limit
// @access  Private (group member)
router.delete('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(m => m.toString() === req.user.id);
    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    group.budgetLimit = null;
    group.budgetSetBy = null;
    group.budgetExceedNotified = false;

    await group.save();

    res.json({ msg: 'Group budget removed' });
  } catch (error) {
    console.error('Delete group budget error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ==================== PERSONAL BUDGET ====================

// @route   PUT /api/budgets/personal
// @desc    Set or update personal monthly budget
// @access  Private
router.put('/personal', [
  auth,
  body('limit', 'Budget limit must be greater than 0').isFloat({ min: 0.01 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { limit } = req.body;
    const monthYear = getCurrentMonth();

    let budget = await BudgetLimit.findOne({
      user: req.user.id,
      monthYear
    });

    if (!budget) {
      budget = new BudgetLimit({
        user: req.user.id,
        monthYear,
        limit: parseFloat(limit)
      });
    } else {
      budget.limit = parseFloat(limit);
      budget.exceedNotified = false; // Reset notification flag
    }

    await budget.save();

    res.json({
      msg: 'Personal budget set successfully',
      budget: {
        limit: budget.limit,
        monthYear: budget.monthYear
      }
    });
  } catch (error) {
    console.error('Set personal budget error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/budgets/personal
// @desc    Get personal budget with progress
// @access  Private
router.get('/personal', auth, async (req, res) => {
  try {
    const monthYear = getCurrentMonth();

    let budget = await BudgetLimit.findOne({
      user: req.user.id,
      monthYear
    });

    if (!budget) {
      return res.json({
        hasBudget: false,
        monthYear,
        msg: 'No personal budget set for this month'
      });
    }

    // Calculate total expenses for this user across all groups for this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const expenses = await Expense.find({
      paidBy: req.user.id,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const percentageUsed = (totalSpent / budget.limit) * 100;
    const exceeded = totalSpent > budget.limit;

    res.json({
      hasBudget: true,
      limit: budget.limit,
      spent: parseFloat(totalSpent.toFixed(2)),
      remaining: parseFloat((budget.limit - totalSpent).toFixed(2)),
      percentageUsed: parseFloat(percentageUsed.toFixed(2)),
      exceeded,
      monthYear,
      exceedNotified: budget.exceedNotified
    });
  } catch (error) {
    console.error('Get personal budget error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/budgets/personal
// @desc    Remove personal budget for current month
// @access  Private
router.delete('/personal', auth, async (req, res) => {
  try {
    const monthYear = getCurrentMonth();

    await BudgetLimit.findOneAndDelete({
      user: req.user.id,
      monthYear
    });

    res.json({ msg: 'Personal budget removed' });
  } catch (error) {
    console.error('Delete personal budget error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
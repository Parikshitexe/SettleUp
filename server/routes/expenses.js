const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// @route   GET /api/expenses/group/:groupId
// @desc    Get all expenses for a group
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    // Check if user is member of group
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(
      member => member.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized to view expenses' });
    }

    // Get expenses
    const expenses = await Expense.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('splitDetails.userId', 'name email')
      .sort({ date: -1 })
      .lean();

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('splitDetails.userId', 'name email')
      .lean();

    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }

    // Check if user is member of the group
    const group = await Group.findById(expense.groupId);
    
    const isMember = group.members.some(
      member => member.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', [
  auth,
  body('groupId', 'Group ID is required').notEmpty(),
  body('description', 'Description is required').trim().notEmpty(),
  body('amount', 'Amount must be greater than 0').isFloat({ min: 0.01 }),
  body('paidBy', 'Paid by user ID is required').notEmpty(),
  body('splitType', 'Split type is required').isIn(['equal', 'unequal', 'percentage'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { groupId, description, amount, paidBy, splitType, category, date } = req.body;

    // Verify group exists and user is member
    const group = await Group.findById(groupId).populate('members', '_id');
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(
      member => member._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized to add expenses to this group' });
    }

    // Verify paidBy user is a member
    const isPaidByMember = group.members.some(
      member => member._id.toString() === paidBy
    );

    if (!isPaidByMember) {
      return res.status(400).json({ msg: 'Paid by user is not a member of this group' });
    }

    // Calculate split details based on split type
    let splitDetails = [];

    if (splitType === 'equal') {
      // Equal split among all members
      const splitAmount = parseFloat((amount / group.members.length).toFixed(2));
      const remainder = parseFloat((amount - (splitAmount * group.members.length)).toFixed(2));

      group.members.forEach((member, index) => {
        splitDetails.push({
          userId: member._id,
          amount: index === 0 ? splitAmount + remainder : splitAmount // Add remainder to first person
        });
      });
    } else if (splitType === 'unequal') {
      // Custom amounts provided by user
      const { splitDetails: customSplits } = req.body;

      if (!customSplits || !Array.isArray(customSplits) || customSplits.length === 0) {
        return res.status(400).json({ msg: 'Split details are required for unequal split' });
      }

      // Verify all members are included
      const splitUserIds = customSplits.map(s => s.userId.toString());
      const allMembersIncluded = group.members.every(
        member => splitUserIds.includes(member._id.toString())
      );

      if (!allMembersIncluded) {
        return res.status(400).json({ msg: 'All group members must be included in split' });
      }

      // Verify total equals amount
      const total = customSplits.reduce((sum, split) => sum + parseFloat(split.amount), 0);
      if (Math.abs(total - amount) > 0.01) {
        return res.status(400).json({ 
          msg: `Split amounts (${total}) must equal total amount (${amount})` 
        });
      }

      splitDetails = customSplits;
    } else if (splitType === 'percentage') {
      // Percentage-based split
      const { splitDetails: percentageSplits } = req.body;

      if (!percentageSplits || !Array.isArray(percentageSplits) || percentageSplits.length === 0) {
        return res.status(400).json({ msg: 'Split details with percentages are required' });
      }

      // Calculate amounts from percentages
      splitDetails = percentageSplits.map(split => ({
        userId: split.userId,
        amount: parseFloat(((amount * split.percentage) / 100).toFixed(2))
      }));
    }

    // Create expense
    const expense = new Expense({
      groupId,
      description,
      amount,
      paidBy,
      splitType,
      splitDetails,
      category: category || 'Other',
      date: date || Date.now(),
      createdBy: req.user.id
    });

    await expense.save();

    // Populate and return
    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email')
      .populate('createdBy', 'name email')
      .populate('splitDetails.userId', 'name email')
      .lean();

    res.json(populatedExpense);
  } catch (error) {
    console.error('Create expense error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }

    // Check if user is the creator or group admin
    const group = await Group.findById(expense.groupId);
    
    const isCreator = expense.createdBy.toString() === req.user.id;
    const isGroupAdmin = group.createdBy.toString() === req.user.id;

    if (!isCreator && !isGroupAdmin) {
      return res.status(401).json({ msg: 'Not authorized to delete this expense' });
    }

    await expense.deleteOne();

    res.json({ msg: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
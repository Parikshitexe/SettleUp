const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// @route   GET /api/settlements/group/:groupId
// @desc    Get settlement history for a group
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(
      member => member.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized to view settlements' });
    }

    const settlements = await Settlement.find({ groupId: req.params.groupId })
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .lean();

    res.json(settlements);
  } catch (error) {
    console.error('Get settlements error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/settlements
// @desc    Record a new settlement
// @access  Private
router.post('/', [
  auth,
  body('groupId', 'Group ID is required').notEmpty(),
  body('paidBy', 'Paid by user ID is required').notEmpty(),
  body('paidTo', 'Paid to user ID is required').notEmpty(),
  body('amount', 'Amount must be greater than 0').isFloat({ min: 0.01 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { groupId, paidBy, paidTo, amount, note, date } = req.body;

    const group = await Group.findById(groupId).populate('members', '_id');
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(
      member => member._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized to record settlements in this group' });
    }

    const isPaidByMember = group.members.some(
      member => member._id.toString() === paidBy
    );
    const isPaidToMember = group.members.some(
      member => member._id.toString() === paidTo
    );

    if (!isPaidByMember || !isPaidToMember) {
      return res.status(400).json({ msg: 'Both users must be members of this group' });
    }

    if (paidBy === paidTo) {
      return res.status(400).json({ msg: 'Cannot settle with yourself' });
    }

    const settlement = new Settlement({
      groupId,
      paidBy,
      paidTo,
      amount: parseFloat(amount),
      note: note || '',
      date: date || Date.now(),
      createdBy: req.user.id
    });

    await settlement.save();

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    res.json(populatedSettlement);
  } catch (error) {
    console.error('Create settlement error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/settlements/:id
// @desc    Delete a settlement
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({ msg: 'Settlement not found' });
    }

    const group = await Group.findById(settlement.groupId);
    
    const isCreator = settlement.createdBy.toString() === req.user.id;
    const isGroupAdmin = group.createdBy.toString() === req.user.id;

    if (!isCreator && !isGroupAdmin) {
      return res.status(401).json({ msg: 'Not authorized to delete this settlement' });
    }

    await settlement.deleteOne();

    res.json({ msg: 'Settlement deleted successfully' });
  } catch (error) {
    console.error('Delete settlement error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Settlement not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
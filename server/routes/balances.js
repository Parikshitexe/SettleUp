const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const auth = require('../middleware/auth');

// @route   GET /api/balances/group/:groupId
// @desc    Get balances for a group
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
  try {
    // Verify group exists and user is member
    const group = await Group.findById(req.params.groupId).populate('members', '_id name email');
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    const isMember = group.members.some(
      member => member._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get all expenses for this group
    const expenses = await Expense.find({ groupId: req.params.groupId });

    // Calculate balances
    const balances = {};
    
    // Initialize balances for all members
    group.members.forEach(member => {
      balances[member._id.toString()] = {
        userId: member._id,
        name: member.name,
        email: member.email,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0
      };
    });

    // Process each expense
    expenses.forEach(expense => {
      const paidById = expense.paidBy.toString();
      
      // Add to totalPaid for person who paid
      if (balances[paidById]) {
        balances[paidById].totalPaid += expense.amount;
      }

      // Add to totalOwed for each person's share
      expense.splitDetails.forEach(split => {
        const userId = split.userId.toString();
        if (balances[userId]) {
          balances[userId].totalOwed += split.amount;
        }
      });
    });

    // Calculate net balances
    Object.keys(balances).forEach(userId => {
      balances[userId].netBalance = 
        parseFloat((balances[userId].totalPaid - balances[userId].totalOwed).toFixed(2));
    });

    // Create simplified debt structure
    const balanceArray = Object.values(balances);
    
    // Separate into creditors (owed money) and debtors (owe money)
    const creditors = balanceArray.filter(b => b.netBalance > 0);
    const debtors = balanceArray.filter(b => b.netBalance < 0);

    // Calculate who owes whom
    const transactions = [];
    
    creditors.forEach(creditor => {
      debtors.forEach(debtor => {
        if (creditor.netBalance > 0 && debtor.netBalance < 0) {
          const amount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));
          
          if (amount > 0.01) { // Only include transactions > 1 cent
            transactions.push({
              from: {
                userId: debtor.userId,
                name: debtor.name
              },
              to: {
                userId: creditor.userId,
                name: creditor.name
              },
              amount: parseFloat(amount.toFixed(2))
            });

            creditor.netBalance -= amount;
            debtor.netBalance += amount;
          }
        }
      });
    });

    res.json({
      groupId: req.params.groupId,
      balances: balanceArray,
      transactions
    });
  } catch (error) {
    console.error('Get balances error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
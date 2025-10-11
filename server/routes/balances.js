const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Settlement = require('../models/Settlement');
const auth = require('../middleware/auth');

// @route   GET /api/balances/group/:groupId
// @desc    Get balances for a group (including settlements)
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
    
    // Get all settlements for this group
    const settlements = await Settlement.find({ groupId: req.params.groupId });

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

    // Process expenses
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

    // Calculate net balance BEFORE settlements
    Object.keys(balances).forEach(userId => {
      const b = balances[userId];
      b.netBalance = b.totalPaid - b.totalOwed;
    });

    // Process settlements - adjust net balances
// When A settles with B (pays B money):
// - A has paid back their debt, so their balance INCREASES (less negative or more positive)
// - B has received money they were owed, so their balance DECREASES (less positive)
settlements.forEach(settlement => {
  const paidById = settlement.paidBy.toString();
  const paidToId = settlement.paidTo.toString();

  if (balances[paidById]) {
    // Payer's balance improves (they owe less)
    balances[paidById].netBalance += settlement.amount;
  }

  if (balances[paidToId]) {
    // Receiver's balance decreases (they are owed less)
    balances[paidToId].netBalance -= settlement.amount;
  }
});

    // Round to 2 decimals
    Object.keys(balances).forEach(userId => {
      balances[userId].netBalance = parseFloat(balances[userId].netBalance.toFixed(2));
      balances[userId].totalPaid = parseFloat(balances[userId].totalPaid.toFixed(2));
      balances[userId].totalOwed = parseFloat(balances[userId].totalOwed.toFixed(2));
    });

    // Create simplified debt structure
    const balanceArray = Object.values(balances);
    
    // Separate into creditors (owed money) and debtors (owe money)
    const creditors = balanceArray.filter(b => b.netBalance > 0.01);
    const debtors = balanceArray.filter(b => b.netBalance < -0.01);

    // Calculate who owes whom (simplified)
    const transactions = [];
    
    // Create working copies
    const creditorsCopy = creditors.map(c => ({ ...c, remaining: c.netBalance }));
    const debtorsCopy = debtors.map(d => ({ ...d, remaining: Math.abs(d.netBalance) }));

    creditorsCopy.forEach(creditor => {
      debtorsCopy.forEach(debtor => {
        if (creditor.remaining > 0.01 && debtor.remaining > 0.01) {
          const amount = Math.min(creditor.remaining, debtor.remaining);
          
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

          creditor.remaining -= amount;
          debtor.remaining -= amount;
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
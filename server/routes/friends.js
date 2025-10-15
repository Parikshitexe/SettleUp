// server/routes/friends.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const NotificationService = require('../utils/notificationService');


// @route   GET /api/friends
// @desc    Get all friends of logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'name email profilePicture')
      .lean();

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user.friends || []);
  } catch (error) {
    console.error('Get friends error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/friends/balances
// @desc    Get balances with all friends across all groups
// @access  Private
router.get('/balances', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all groups user is part of
    const groups = await Group.find({ members: userId }).lean();
    const groupIds = groups.map(g => g._id);

    // Get all expenses from these groups
    const expenses = await Expense.find({ groupId: { $in: groupIds } }).lean();

    // Get all settlements from these groups
    const settlements = await Settlement.find({ groupId: { $in: groupIds } }).lean();

    // Calculate balances with each person
    const balances = {};

    // Process expenses
    expenses.forEach(expense => {
      const paidById = expense.paidBy.toString();

      expense.splitDetails.forEach(split => {
        const splitUserId = split.userId.toString();

        // Skip if it's the same person
        if (paidById === splitUserId) return;

        // Initialize balance object if needed
        if (!balances[paidById]) {
          balances[paidById] = {};
        }
        if (!balances[splitUserId]) {
          balances[splitUserId] = {};
        }

        // If current user paid
        if (paidById === userId) {
          // Other person owes current user
          if (!balances[userId][splitUserId]) {
            balances[userId][splitUserId] = 0;
          }
          balances[userId][splitUserId] += split.amount;
        }

        // If other person paid
        if (splitUserId === userId) {
          // Current user owes other person
          if (!balances[paidById][userId]) {
            balances[paidById][userId] = 0;
          }
          balances[paidById][userId] += split.amount;
        }

        // Between two other people
        if (paidById !== userId && splitUserId !== userId) {
          if (!balances[paidById][splitUserId]) {
            balances[paidById][splitUserId] = 0;
          }
          balances[paidById][splitUserId] += split.amount;
        }
      });
    });

    // Process settlements
    settlements.forEach(settlement => {
      const paidById = settlement.paidBy.toString();
      const paidToId = settlement.paidTo.toString();

      if (!balances[paidById]) balances[paidById] = {};
      if (!balances[paidToId]) balances[paidToId] = {};

      // Reduce the debt
      if (balances[paidById][paidToId]) {
        balances[paidById][paidToId] -= settlement.amount;
      }

      if (balances[paidToId][paidById]) {
        balances[paidToId][paidById] += settlement.amount;
      }
    });

    // Calculate net balances with current user
    const friendBalances = {};

    if (balances[userId]) {
      Object.keys(balances[userId]).forEach(friendId => {
        if (friendId !== userId) {
          const userOwed = balances[userId][friendId] || 0;
          const userOwes = balances[friendId] && balances[friendId][userId] ? balances[friendId][userId] : 0;
          const netBalance = userOwed - userOwes;

          if (Math.abs(netBalance) > 0.01) {
            friendBalances[friendId] = parseFloat(netBalance.toFixed(2));
          }
        }
      });
    }

    // Also check reverse direction
    Object.keys(balances).forEach(otherUserId => {
      if (otherUserId !== userId && balances[otherUserId][userId]) {
        const userOwes = balances[otherUserId][userId] || 0;
        const userOwed = balances[userId] && balances[userId][otherUserId] ? balances[userId][otherUserId] : 0;
        const netBalance = userOwed - userOwes;

        if (Math.abs(netBalance) > 0.01) {
          friendBalances[otherUserId] = parseFloat(netBalance.toFixed(2));
        }
      }
    });

    // Get user details for friends with balances
    const friendIds = Object.keys(friendBalances);
    const friends = await User.find({ _id: { $in: friendIds } })
      .select('name email profilePicture')
      .lean();

    // Combine balance data with user info
    const result = friends.map(friend => ({
      userId: friend._id,
      name: friend.name,
      email: friend.email,
      profilePicture: friend.profilePicture,
      balance: friendBalances[friend._id.toString()]
    }));

    // Sort by absolute balance (highest first)
    result.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    res.json(result);
  } catch (error) {
    console.error('Get friend balances error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/friends/requests
// @desc    Get all friend requests (sent and received)
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    const received = await FriendRequest.find({
      to: req.user.id,
      status: 'pending'
    })
      .populate('from', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    const sent = await FriendRequest.find({
      from: req.user.id,
      status: 'pending'
    })
      .populate('to', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ received, sent });
  } catch (error) {
    console.error('Get friend requests error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/friends/request/:userId
// @desc    Send a friend request
// @access  Private
router.post('/request/:userId', auth, async (req, res) => {
    try {
      const fromUserId = req.user.id;
      const toUserId = req.params.userId;
  
      // Can't send request to yourself
      if (fromUserId === toUserId) {
        return res.status(400).json({ msg: 'Cannot send friend request to yourself' });
      }
  
      // Check if target user exists
      const targetUser = await User.findById(toUserId);
      if (!targetUser) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      // Check if already friends
      const currentUser = await User.findById(fromUserId);
      if (currentUser.friends.includes(toUserId)) {
        return res.status(400).json({ msg: 'Already friends with this user' });
      }
  
      // Check if request already exists
      const existingRequest = await FriendRequest.findOne({
        $or: [
          { from: fromUserId, to: toUserId },
          { from: toUserId, to: fromUserId }
        ],
        status: 'pending'
      });
  
      if (existingRequest) {
        return res.status(400).json({ msg: 'Friend request already exists' });
      }
  
      // Create new friend request
      const friendRequest = new FriendRequest({
        from: fromUserId,
        to: toUserId
      });
  
      await friendRequest.save();
  
      // NEW: Create notification
      await NotificationService.notifyFriendRequest(
        fromUserId,
        toUserId,
        currentUser.name
      );
  
      const populatedRequest = await FriendRequest.findById(friendRequest._id)
        .populate('from', 'name email profilePicture')
        .populate('to', 'name email profilePicture')
        .lean();
  
      res.json(populatedRequest);
    } catch (error) {
      console.error('Send friend request error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  });

// @route   PUT /api/friends/request/:requestId/accept
// @desc    Accept a friend request
// @access  Private
router.put('/request/:requestId/accept', auth, async (req, res) => {
    try {
      const friendRequest = await FriendRequest.findById(req.params.requestId);
  
      if (!friendRequest) {
        return res.status(404).json({ msg: 'Friend request not found' });
      }
  
      // Verify the request is for current user
      if (friendRequest.to.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
  
      if (friendRequest.status !== 'pending') {
        return res.status(400).json({ msg: 'Request already processed' });
      }
  
      // Update request status
      friendRequest.status = 'accepted';
      await friendRequest.save();
  
      // Add each user to other's friends list
      await User.findByIdAndUpdate(friendRequest.from, {
        $addToSet: { friends: friendRequest.to }
      });
  
      const acceptedByUser = await User.findByIdAndUpdate(friendRequest.to, {
        $addToSet: { friends: friendRequest.from }
      }, { new: true });
  
      // NEW: Create notification
      await NotificationService.notifyFriendAccepted(
        friendRequest.from,
        acceptedByUser.name
      );
  
      res.json({ msg: 'Friend request accepted' });
    } catch (error) {
      console.error('Accept friend request error:', error.message);
      res.status(500).json({ msg: 'Server error' });
    }
  });

// @route   DELETE /api/friends/request/:requestId
// @desc    Cancel a sent friend request
// @access  Private
router.delete('/request/:requestId', auth, async (req, res) => {
  try {
    const friendRequest = await FriendRequest.findById(req.params.requestId);

    if (!friendRequest) {
      return res.status(404).json({ msg: 'Friend request not found' });
    }

    // Verify the request is from current user
    if (friendRequest.from.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await friendRequest.deleteOne();

    res.json({ msg: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel friend request error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/friends/:friendId
// @desc    Remove a friend
// @access  Private
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    // Remove friend from current user's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    // Remove current user from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    res.json({ msg: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
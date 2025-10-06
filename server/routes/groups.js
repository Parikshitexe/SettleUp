const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/groups
// @desc    Get all groups for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ 
      members: req.user.id 
    })
    .populate('members', 'name email')
    .populate('createdBy', 'name email')
    .lean()
    .sort({ createdAt: -1 });
    
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/groups/:id
// @desc    Get single group by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(
      member => member._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized to view this group' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', [
  auth,
  body('name', 'Group name is required').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, memberEmails } = req.body;

    // Start with creator as member
    let members = [req.user.id];
    
    // Find additional members by email
    if (memberEmails && memberEmails.length > 0) {
      const users = await User.find({ 
        email: { $in: memberEmails } 
      });
      
      const foundEmails = users.map(u => u.email);
      
      // Add found users to members (avoid duplicates)
      users.forEach(user => {
        if (!members.includes(user._id.toString())) {
          members.push(user._id);
        }
      });

      // Check for emails not found
      const notFound = memberEmails.filter(email => !foundEmails.includes(email));
      if (notFound.length > 0) {
        return res.status(400).json({ 
          msg: `Users not found with emails: ${notFound.join(', ')}` 
        });
      }
    }

    const group = new Group({
      name,
      description,
      createdBy: req.user.id,
      members
    });

    await group.save();

    // Populate and return
    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    res.json(populatedGroup);
  } catch (error) {
    console.error('Create group error:', error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/groups/:id
// @desc    Update group (name, description)
// @access  Private
router.put('/:id', [
  auth,
  body('name', 'Group name is required').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Only creator can update group details
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to update this group' });
    }

    const { name, description } = req.body;

    group.name = name;
    group.description = description || group.description;

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    res.json(populatedGroup);
  } catch (error) {
    console.error('Update group error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/groups/:id/members
// @desc    Add members to group
// @access  Private
router.post('/:id/members', [
  auth,
  body('memberEmails', 'Member emails are required').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Check if user is a member
    const isMember = group.members.some(
      member => member.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { memberEmails } = req.body;

    // Find users by email
    const users = await User.find({ 
      email: { $in: memberEmails } 
    });
    
    const foundEmails = users.map(u => u.email);

    // Check for emails not found
    const notFound = memberEmails.filter(email => !foundEmails.includes(email));
    if (notFound.length > 0) {
      return res.status(400).json({ 
        msg: `Users not found: ${notFound.join(', ')}` 
      });
    }

    // Add new members (avoid duplicates)
    let addedCount = 0;
    users.forEach(user => {
      if (!group.members.includes(user._id)) {
        group.members.push(user._id);
        addedCount++;
      }
    });

    if (addedCount === 0) {
      return res.status(400).json({ msg: 'All users are already members' });
    }

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    res.json(populatedGroup);
  } catch (error) {
    console.error('Add members error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/groups/:id/members/:memberId
// @desc    Remove member from group
// @access  Private
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Only creator or the member themselves can remove
    if (group.createdBy.toString() !== req.user.id && 
        req.params.memberId !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Can't remove creator
    if (req.params.memberId === group.createdBy.toString()) {
      return res.status(400).json({ msg: 'Cannot remove group creator' });
    }

    // Check if member exists in group
    const memberIndex = group.members.findIndex(
      member => member.toString() === req.params.memberId
    );

    if (memberIndex === -1) {
      return res.status(400).json({ msg: 'User is not a member of this group' });
    }

    group.members.splice(memberIndex, 1);
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
        .lean();

    res.json(populatedGroup);
  } catch (error) {
    console.error('Remove member error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/groups/:id
// @desc    Delete group
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }

    // Only creator can delete
    if (group.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized to delete this group' });
    }

    await group.deleteOne();

    res.json({ msg: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
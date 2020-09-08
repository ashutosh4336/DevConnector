const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route       GET api/v1/users
// @desc        Get all User
// @access      Public
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    return res
      .status(200)
      .json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, data: 'Something went Wrong' });
  }
});

// @route       GET api/v1/users/:id
// @desc        Get all User
// @access      Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User Not Found' });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ sucess: false, msg: 'User Not Found' });
    }
    return res
      .status(500)
      .json({ success: false, data: 'Something went Wrong' });
  }
});

module.exports = router;

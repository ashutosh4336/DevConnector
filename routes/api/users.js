const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route       GET api/v1/users
// @desc        Test
// @access      Public
router.get('/', async (req, res) => {
  try {
    return res.status(200).json({ success: true, msg: 'User Route' });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, data: 'Something went Wrong' });
  }
});

module.exports = router;

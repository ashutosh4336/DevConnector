const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const gravatar = require('gravatar');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route       GET api/v1/auth
// @desc        Test Route
// @access      Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await (await User.findById(req.user)).select('-password');
    if (!user) {
      return res.status(400).json({ success: false, data: 'User not Found' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, data: 'Something went Wrong' });
  }
});

// @route       POST api/v1/auth
// @desc        Register User
// @access      Public
router.post(
  '/',
  [
    check('name', 'Name is Required').not().isEmpty(),
    check('email', 'Please Include a  Valid Email').isEmail(),
    check(
      'password',
      'Please enter a Password with 6 or More Characters'
    ).isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, password } = req.body;

      // Get user Gravatar

      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      const user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      // Return JSON WebToken

      const token = user.getSignedJwtToken();

      res.status(200).json({
        success: true,
        data: { name: user.name, email: user.email, avatar: user.avatar },
        token,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ success: false, msg: err.message });
    }
  }
);

module.exports = router;

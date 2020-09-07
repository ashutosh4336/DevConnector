const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const gravatar = require('gravatar');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route       GET api/v1/auth
// @desc        Get LoggedIn User Deatils
// @access      Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
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

// @route       POST api/v1/auth/signup
// @desc        Register User
// @access      Public
router.post(
  '/signup',
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

// @route       POST api/v1/auth/login
// @desc        Login User
// @access      Public
router.post(
  '/login',
  [
    check('email', 'Please Include a  Valid Email').isEmail(),
    check('password', 'Password is Required').exists(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;
      console.log(email, password);
      // Get user Gravatar
      let user = await User.findOne({ email }).select('+password');
      // console.log(user);

      if (!user) {
        return res
          .status(400)
          .json({ success: false, errors: [{ msg: 'Invalid Credentials' }] });
      }

      //   check if password matches
      const isMatch = await user.matchPassword(password);
      // console.log(isMatch);
      if (!isMatch)
        return res.status(400).json({ code: 400, msg: `Invalid Credentials` });

      // Return JSON WebToken

      const token = user.getSignedJwtToken();

      res.status(200).json({
        success: true,
        msg: 'User Successful Loggedin',
        token,
      });
    } catch (err) {
      console.log(err.message);
      res.status(500).json({ success: false, msg: err.message });
    }
  }
);

module.exports = router;

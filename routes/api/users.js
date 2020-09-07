const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route       POST api/v1/users
// @desc        Login User
// @access      Public
router.post(
  '/',
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
      let user = await User.findOne({ email });
      console.log(user);

      if (!user) {
        return res
          .status(400)
          .json({ success: false, errors: [{ msg: 'Invalid Credentials' }] });
      }

      //   check if password matches
      const isMatch = await user.matchPassword(password);
      console.log(isMatch);
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

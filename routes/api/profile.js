const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route       GET api/v1/profile/me
// @desc        Get current user's Profile
// @access      Public
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user }).populate('user', [
      'name',
      'avatar',
    ]);
    if (!profile)
      return res
        .status(400)
        .json({ success: false, msg: 'There is no Profile' });
    return res.status(200).json({ success: true, data: profile });
  } catch (err) {
    console.log(err.message);
    return res
      .status(500)
      .json({ success: false, data: 'Something Went Wrong' });
  }
});

// @route       GET api/v1/profile/
// @desc        Create or Update user Profile
// @access      Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is Required').not().isEmpty(),
      check('skills', 'Skills is Required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
      } = req.body;

      // Build Profile Object
      const profileObject = {};

      profileObject.user = req.user;
      if (company) profileObject.company = company;
      if (website) profileObject.website = website;
      if (location) profileObject.location = location;
      if (bio) profileObject.bio = bio;
      if (status) profileObject.status = status;
      if (githubusername) profileObject.githubusername = githubusername;
      if (skills) {
        profileObject.skills = skills.split(',').map((skill) => skill.trim());
      }
      // Build Social Object
      profileObject.social = {};

      if (twitter) profileObject.social.twitter = twitter;
      if (youtube) profileObject.social.youtube = youtube;
      if (facebook) profileObject.social.facebook = facebook;
      if (instagram) profileObject.social.instagram = instagram;
      if (linkedin) profileObject.social.linkedin = linkedin;

      let profileOfUser = await Profile.findOne({ user: req.user });

      if (profileOfUser) {
        profileOfUser = await Profile.findOneAndUpdate(
          { user: req.user },
          { $set: profileObject },
          { new: true, runValidators: true }
        );
        return res.status(200).json({ success: true, data: profileOfUser });
      }

      // Create
      profileOfUser = new Profile(profileObject);

      const createdProfile = await profileOfUser.save();

      // console.log(profileObject.skills);
      return res.status(200).json({ success: true, data: createdProfile });
    } catch (err) {
      console.error(err.message);
      return res
        .status(500)
        .json({ success: false, msg: 'Something Went Wrong' });
    }
  }
);

// @route       GET api/v1/profile/
// @desc        Get All user Profile
// @access      Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json({ sucess: true, count: profiles.length, data: profiles });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

// @route       GET api/v1/profile/user/:id
// @desc        Get Single user Profile
// @access      Public

router.get('/user/:id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(404).json({ sucess: false, msg: 'User Not Found' });
    }

    return res.json({ sucess: true, data: profile });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ sucess: false, msg: 'User Not Found' });
    }
    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

module.exports = router;

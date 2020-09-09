const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const request = require('request');
const config = require('config');
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

      const user = await User.findById(req.user);
      if (!user) {
        return res.status(400).json({ sucess: false, msg: 'User Not Found' });
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
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ sucess: false, msg: 'User Not Found' });
    }
    const profile = await Profile.findOne({
      user: req.params.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res
        .status(404)
        .json({ sucess: false, msg: 'There is no Profile fo the user' });
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

// @route       DELETE api/v1/profile/user/:id
// @desc        delete Single user, profile and Posts
// @access      Public

router.delete('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ sucess: false, msg: 'User Not Found' });
    }

    await Profile.findOneAndRemove({
      user: req.params.id,
    });
    await User.findByIdAndRemove(req.params.id);

    // TODO: delete Post releated to user

    return res.json({ sucess: true, msg: 'User Removed' });
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

// @route       PUT api/v1/profile/experience
// @desc        Update Profile with Experience
// @access      Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is Required').not().isEmpty(),
      check('company', 'Company is Required').not().isEmpty(),
      check('from', 'From Date is Required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      } = req.body;

      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
      };
      console.log(newExp);

      const profile = await Profile.findOne({ user: req.user });

      if (!profile) {
        return res.status(400).json({ sucess: false, msg: 'User Not Found' });
      }
      // console.log('profile ==>', profile);
      profile.experience.unshift(newExp);

      await profile.save();

      return res.status(200).json({ sucess: true, data: profile });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ sucess: false, msg: 'User Not Found' });
      }
      return res
        .status(500)
        .json({ sucess: false, data: 'Something went wrong' });
    }
  }
);

// @route       DELETE api/v1/profile/experience/:id
// @desc        Delete Experience
// @access      Private
router.delete('/experience/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user });
    // GET REmove index
    const removeIndex = profile.experience
      .map((el) => el.id)
      .indexOf(req.params.id);

    // console.log(removeIndex);
    profile.experience.splice(removeIndex, 1);

    await profile.save();

    return res.status(200).json({ sucess: true, data: profile });
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

// @route       PUT api/v1/profile/education
// @desc        Update Profile with Education
// @access      Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is Required').not().isEmpty(),
      check('degree', 'Degree is Required').not().isEmpty(),
      check('from', 'From Date is Required').not().isEmpty(),
      check('fieldofstudy', 'Fieldofstudy Date is Required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { school, degree, from, to, fieldofstudy, current } = req.body;

      const newEdu = {
        school,
        degree,
        from,
        fieldofstudy,
        to,
        current,
      };
      console.log(newEdu);

      const profile = await Profile.findOne({ user: req.user });

      if (!profile) {
        return res.status(400).json({ sucess: false, msg: 'User Not Found' });
      }
      // console.log('profile ==>', profile);
      profile.education.unshift(newEdu);

      await profile.save();

      return res.status(200).json({ sucess: true, data: profile });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ sucess: false, msg: 'User Not Found' });
      }
      return res
        .status(500)
        .json({ sucess: false, data: 'Something went wrong' });
    }
  }
);

// @route       DELETE api/v1/profile/experience/:id
// @desc        Delete Experience
// @access      Private
router.delete('/education/:id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user });
    // GET REmove index
    const removeIndex = profile.education
      .map((el) => el.id)
      .indexOf(req.params.id);

    // console.log(removeIndex);
    profile.education.splice(removeIndex, 1);

    // console.log(profile);

    await profile.save();

    return res.status(200).json({ sucess: true, data: profile });
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

// @route       GET api/v1/profile/github/:username
// @desc        Get User Repos from GitHub
// @access      Public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `http://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret${config.get('githubClientSecret')}`,
      method: `GET`,
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (err, response, body) => {
      if (err) console.error(err);

      if (response.statusCode !== 200)
        return res.status(404).json({ msg: `No User Found` });

      res.status(200).json(JSON.parse(body));
    });
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

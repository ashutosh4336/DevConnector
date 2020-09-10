const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');

// @route       POST api/v1/posts
// @desc        Create a POst
// @access      Public
router.post(
  '/',
  [auth, [check('text', 'Text is Required').not().isEmpty()]],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user);

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user,
      });

      const post = await newPost.save();

      return res.status(201).json({ success: true, data: post });
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

// @route       GET api/v1/posts
// @desc        Get all Post
// @access      Private

router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });

    return res.status(200).json({ sucess: true, data: posts });
  } catch (err) {
    console.error(err.message);

    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

// @route       GET api/v1/posts/:id
// @desc        Get single Post
// @access      Private

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(200).json({ sucess: false, msg: 'Invalid Request' });
    }

    return res.status(200).json({ sucess: true, data: post });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ sucess: false, msg: 'Post Not Found' });
    }
    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

// @route       DELETE api/v1/posts/:id
// @desc        Delete single Post
// @access      Private

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ sucess: false, msg: 'Invalid Request' });
    }

    if (post.user.toString() !== req.user) {
      return res.status(401).json({ sucess: false, msg: 'Not Authorized' });
    }

    await post.remove();

    return res.status(200).json({ sucess: true, msg: 'Post Removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ sucess: false, msg: 'Post Not Found' });
    }
    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

// @route       PUT api/v1/posts/like/:id
// @desc        Like a Post
// @access      Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const user = await User.findById(req.user);

    if (!post)
      return res.status(404).json({ sucess: false, msg: 'Post Not Found' });

    // check-if post is liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user).length > 0
    ) {
      return res
        .status(401)
        .json({ sucess: false, msg: 'Post has already been liked' });
    }

    post.likes.unshift({ user: req.user });

    await post.save();

    return res.status(200).json({ sucess: true, data: post.likes });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ sucess: false, msg: 'Post Not Found' });
    }
    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

// @route       PUT api/v1/posts/unlike/:id
// @desc        Unlike a Post
// @access      Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const user = await User.findById(req.user);

    if (!post)
      return res.status(404).json({ sucess: false, msg: 'Post Not Found' });

    // check-if post is already liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user).length ===
      0
    ) {
      return res
        .status(401)
        .json({ sucess: false, msg: "You've not Liked the Post Yet" });
    }

    // Remove Index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user);

    console.log(removeIndex);

    post.likes.splice(removeIndex, 1);
    await post.save();
    return res.status(200).json({ sucess: true, data: post.likes });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ sucess: false, msg: 'Post Not Found' });
    }
    return res
      .status(500)
      .json({ sucess: false, data: 'Something went wrong' });
  }
});

// @route       POST api/v1/posts/comment/:id
// @desc        Comment on a Post
// @access      Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Comment content is Required').not().isEmpty()]],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user);

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ success: false, data: 'No Post Found' });
      }

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user,
      };

      post.comments.unshift(newComment);

      await post.save();

      return res.status(201).json({ success: true, data: post });
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

// @route       Delete api/v1/posts/comment/:id/:comment_id
// @desc        Delete a Comment from Post
// @access      Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);

    const post = await Post.findById(req.params.id);

    const commentsOfPost = post.comments.find(
      (el) => el.id === req.params.comment_id
    );

    if (!commentsOfPost)
      return res
        .status(404)
        .json({ success: false, data: "Commnet Doesn't Exist" });

    // checkuser
    if (commentsOfPost.user.toString() !== req.user)
      return res
        .status(404)
        .json({ success: false, data: 'User is not Authorized' });

    if (!post) {
      return res.status(404).json({ success: false, data: 'No Post Found' });
    }

    // Remove Index
    const removeIndex = post.comments
      .map((el) => el.user.toString())
      .indexOf(req.user);

    // console.log(removeIndex);

    post.comments.splice(removeIndex, 1);
    await post.save();

    return res.status(201).json({ success: true, data: post });
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

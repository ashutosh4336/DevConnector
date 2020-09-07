const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // Get Token
  const token = req.header('x-auth-token');

  // check if no token
  if (!token) {
    return res
      .status(401)
      .json({ msg: 'Not Authorized to access the Resource 1' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.get('JWT_SECRET'));
    req.user = decoded.id;
    // console.log(req.user, decoded);
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ msg: 'Not Authorized to access the Resource 2' });
  }
};

const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

module.exports.authenticateUser = async function (req, res, next) {
  // Check for the token in the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token part

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by email and exclude the password
    const user = await userModel.findOne({ email: decoded.email }).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach the user to the request object for downstream access
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token or token expired' });
  }
};
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'IDFd+Q5HhhAxM32Q0y6HQnHKaqhiIQXeuMJoU5R+91M=';

// 生成 JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 验证 JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  JWT_SECRET
};

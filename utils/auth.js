const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// 生成 JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// 验证 JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// 从请求头中提取 token
const extractToken = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

// 验证用户权限中间件
const authenticate = async (event) => {
  const token = extractToken(event);
  if (!token) {
    throw new Error('未提供认证令牌');
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error('无效的认证令牌');
  }

  return decoded;
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  extractToken
};

const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '令牌格式无效' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.adminId = decoded.adminId;
      next();
    } catch (jwtError) {
      console.error('JWT验证失败:', jwtError);
      return res.status(401).json({ message: '令牌无效或已过期' });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({ message: '服务器认证错误' });
  }
};

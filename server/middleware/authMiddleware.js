const Admin = require('../models/Admin');
const { verifyToken } = require('../utils/token');

const requireAdmin = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Administrator authentication required.' });
    }

    const payload = verifyToken(token);
    const admin = await Admin.findOne({ _id: payload.sub, isActive: true }).select('-password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Administrator account is unavailable.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired administrator session.' });
  }
};

module.exports = { requireAdmin };

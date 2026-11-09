const Admin = require('../models/Admin');
const { createToken } = require('../utils/token');

const login = async (req, res) => {
  try {
    const usernameOrEmail = String(req.body.usernameOrEmail || '').trim();
    const password = String(req.body.password || '');

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, message: 'Enter your username/email and password.' });
    }

    const admin = await Admin.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail.toLowerCase() },
      ],
      isActive: true,
    }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid login details.' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = createToken(admin);
    return res.status(200).json({
      success: true,
      token,
      expiresIn: 28800,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCurrentAdmin = (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
};

module.exports = { login, getCurrentAdmin };

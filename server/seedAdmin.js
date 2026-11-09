require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  const { MONGO_URI, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set MONGO_URI, ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
  }
  if (ADMIN_PASSWORD.length < 12) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');
  }

  await mongoose.connect(MONGO_URI);
  const existing = await Admin.findOne({
    $or: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL.toLowerCase() }],
  });

  if (existing) {
    throw new Error('An administrator with that username or email already exists. No account was changed.');
  }

  await Admin.create({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  console.log('Administrator account created. Remove ADMIN_PASSWORD from .env after setup.');
};

seedAdmin()
  .catch((error) => {
    console.error('Administrator setup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });

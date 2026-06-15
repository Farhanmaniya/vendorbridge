const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User.model');
const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'admin@vendorbridge.com' });
  if (existing) {
    console.log('Admin already exists');
    process.exit();
  }

  await User.create({
    name: 'Admin',
    email: 'admin@vendorbridge.com',
    password: 'admin123',
    role: 'admin',
  });

  console.log('Admin user created');
  process.exit();
};

seed();
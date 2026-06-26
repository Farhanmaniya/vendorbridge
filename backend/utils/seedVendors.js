const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User.model');
const Vendor = require('../models/Vendor.model');
const connectDB = require('../config/db');

const vendorsData = [
  {
    email: 'vendor1@vendorbridge.com',
    name: 'TechLabs Contact',
    companyName: 'Apex IT Labs',
    contactPerson: 'Alex Rivera',
    phone: '+91 98765 00001',
    category: 'IT',
    address: { street: '101 Silicon Valley Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' },
    bankDetails: { street: 'HDFC Corporate Branch, MG Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', country: 'India' }
  },
  {
    email: 'vendor2@vendorbridge.com',
    name: 'OfficeHub Sales',
    companyName: 'OfficeHub Supplies',
    contactPerson: 'Samantha Miller',
    phone: '+91 98765 00002',
    category: 'Office Supplies',
    address: { street: '42 Station Plaza', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' },
    bankDetails: { street: 'ICICI Bank, Fort Branch', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', country: 'India' }
  },
  {
    email: 'vendor3@vendorbridge.com',
    name: 'Rapid Express Logistics',
    companyName: 'Rapid Freight & Logistics',
    contactPerson: 'David Chen',
    phone: '+91 98765 00003',
    category: 'Logistics',
    address: { street: 'Cargo Center Sector 3', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' },
    bankDetails: { street: 'SBI Harbor Branch', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', country: 'India' }
  },
  {
    email: 'vendor4@vendorbridge.com',
    name: 'ForgeMfg Admin',
    companyName: 'Precision Forge Manufacturing',
    contactPerson: 'Vikram Singh',
    phone: '+91 98765 00004',
    category: 'Manufacturing',
    address: { street: 'Industrial Estate Block D', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India' },
    bankDetails: { street: 'Bank of Baroda, MIDC Branch', city: 'Pune', state: 'Maharashtra', pincode: '411001', country: 'India' }
  }
];

const seedVendors = async () => {
  try {
    await connectDB();

    // Fetch admin user to use as creator
    const admin = await User.findOne({ email: 'admin@vendorbridge.com' });
    if (!admin) {
      console.error("Admin user (admin@vendorbridge.com) not found. Run seedAdmin first.");
      process.exit(1);
    }

    console.log('Seeding vendor accounts...');

    for (const v of vendorsData) {
      const userExists = await User.findOne({ email: v.email });
      if (userExists) {
        console.log(`User ${v.email} already exists. Skipping.`);
        continue;
      }

      // 1. Create User
      const user = await User.create({
        name: v.name,
        email: v.email,
        password: 'vendor123',
        role: 'vendor',
        mustChangePassword: false,
        isActive: true
      });

      // 2. Create Vendor Profile
      const vendor = await Vendor.create({
        userId: user._id,
        companyName: v.companyName,
        contactPerson: v.contactPerson,
        phone: v.phone,
        category: v.category,
        status: 'active',
        address: v.address,
        bankDetails: v.bankDetails,
        createdBy: admin._id
      });

      // 3. Link Vendor Profile back to User
      user.vendorProfile = vendor._id;
      await user.save({ validateBeforeSave: false });

      console.log(`Successfully created vendor: ${v.companyName} (${v.email})`);
    }

    console.log('Seeding completed successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding vendors:', error.message);
    process.exit(1);
  }
};

seedVendors();

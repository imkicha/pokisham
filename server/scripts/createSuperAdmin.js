const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@pokisham.com' });

    if (existingSuperAdmin) {
      console.log('Super Admin already exists!');
      console.log('Email:', existingSuperAdmin.email);
      console.log('Role:', existingSuperAdmin.role);

      // Ensure role & verification
      existingSuperAdmin.role = 'superadmin';
      existingSuperAdmin.isVerified = true;
      await existingSuperAdmin.save();

      console.log('✓ Existing user updated to verified Super Admin role');
    } else {
      // Create new super admin
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@pokisham.com',
        password: 'admin123', // Will be hashed automatically
        phone: '9999999999',
        role: 'superadmin',
        isVerified: true       // <-- IMPORTANT!
      });

      console.log('✓ Super Admin created successfully!');
      console.log('Email:', superAdmin.email);
      console.log('Password: admin123');
      console.log('Role:', superAdmin.role);
    }

    console.log('\n--- Login Credentials ---');
    console.log('Email: superadmin@pokisham.com');
    console.log('Password: admin123');
    console.log('------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();

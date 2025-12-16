const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const ADMINS = [
  {
    name: 'Super Admin',
    email: 'superadmin@pokisham.com',
    password: 'admin123',
    phone: '9999999999',
    role: 'superadmin',
    isVerified: true,
  },
  {
    name: 'Admin',
    email: 'admin@pokisham.com',
    password: 'admin123',
    phone: '8888888888',
    role: 'admin',
    isVerified: true,
  },
];

const createAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    for (const adminData of ADMINS) {
      const existingUser = await User.findOne({ email: adminData.email });

      if (existingUser) {
        existingUser.role = adminData.role;
        existingUser.isVerified = true;
        await existingUser.save();

        console.log(`✓ Updated existing ${adminData.role}`);
        console.log(`  Email: ${existingUser.email}`);
      } else {
        const user = await User.create(adminData);

        console.log(`✓ Created ${adminData.role}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: ${adminData.password}`);
      }

      console.log('-----------------------------');
    }

    console.log('\n--- LOGIN CREDENTIALS ---');
    console.log('Super Admin → superadmin@pokisham.com / admin123');
    console.log('Admin       → admin@pokisham.com / admin123');
    console.log('-------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmins();

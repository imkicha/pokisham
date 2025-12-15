const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const verifyUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const email = 'kishorenishaanth.work@gmail.com';

    const user = await User.findOneAndUpdate(
      { email },
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      console.log('❌ User not found with email:', email);
      process.exit(1);
    }

    console.log('✅ USER VERIFIED SUCCESSFULLY!\n');
    console.log('═══════════════════════════════════════');
    console.log('Email:     ', user.email);
    console.log('Name:      ', user.name);
    console.log('Role:      ', user.role);
    console.log('Verified:  ', user.isVerified);
    console.log('═══════════════════════════════════════\n');
    console.log('You can now login at: http://localhost:3000/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyUser();

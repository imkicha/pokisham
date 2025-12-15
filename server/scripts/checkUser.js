const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const email = 'kishorenishaanth.work@gmail.com';
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ USER NOT FOUND');
      console.log('Email:', email);
      console.log('\n═══════════════════════════════════════');
      console.log('This user does not exist in the database.');
      console.log('═══════════════════════════════════════\n');
      console.log('To create this account, you can:');
      console.log('1. Register: http://localhost:3000/register');
      console.log('2. Apply as seller: http://localhost:3000/become-seller\n');
    } else {
      console.log('✅ USER FOUND!');
      console.log('\n═══════════════════════════════════════');
      console.log('USER DETAILS:');
      console.log('═══════════════════════════════════════');
      console.log('Email:     ', user.email);
      console.log('Name:      ', user.name);
      console.log('Role:      ', user.role);
      console.log('Phone:     ', user.phone || 'N/A');
      console.log('Verified:  ', user.isVerified);
      console.log('Created:   ', user.createdAt?.toLocaleDateString() || 'N/A');

      if (user.tenantId) {
        console.log('\nTenant ID: ', user.tenantId);
        console.log('(Tenant details require separate query)');
      }

      console.log('\n═══════════════════════════════════════');
      console.log('⚠️  PASSWORD INFORMATION');
      console.log('═══════════════════════════════════════');
      console.log('Password is hashed and cannot be displayed.');
      console.log('\nIf you forgot the password:');
      console.log('1. Use Forgot Password: http://localhost:3000/forgot-password');
      console.log('2. Or reset manually (run resetPassword.js script)\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
};

checkUser();

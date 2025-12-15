const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
require('dotenv').config();

const checkTenant = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const tenant = await Tenant.findOne({ email: 'kishorenishaanth.work@gmail.com' });

    if (!tenant) {
      console.log('❌ Tenant record not found');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════');
    console.log('TENANT STATUS');
    console.log('═══════════════════════════════════════');
    console.log('Business:  ', tenant.businessName);
    console.log('Owner:     ', tenant.ownerName);
    console.log('Email:     ', tenant.email);
    console.log('Status:    ', tenant.status);
    console.log('Commission:', tenant.commissionRate + '%');
    console.log('═══════════════════════════════════════\n');

    if (tenant.status === 'pending') {
      console.log('⚠️  STATUS: PENDING');
      console.log('This tenant needs Super Admin approval before they can login.\n');
      console.log('Super Admin should:');
      console.log('1. Login: http://localhost:3000/login');
      console.log('   Email: superadmin@pokisham.com');
      console.log('   Password: admin123');
      console.log('2. Go to: /superadmin/tenants');
      console.log('3. Approve this tenant\n');
    } else if (tenant.status === 'approved') {
      console.log('✅ STATUS: APPROVED');
      console.log('This tenant can now login!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkTenant();

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Tenant = require('./models/Tenant');

const seedDemoUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fix: Drop the old non-sparse phone index that causes duplicate null errors
    try {
      await mongoose.connection.db.collection('users').dropIndex('phone_1');
      console.log('Dropped old phone_1 index (non-sparse). Mongoose will recreate it as sparse.');
    } catch (e) {
      // Index doesn't exist or already sparse — that's fine
    }

    // Ensure indexes are synced with schema (creates sparse unique index)
    await User.syncIndexes();
    console.log('Indexes synced');

    // 1. Demo SuperAdmin
    const existingSuperAdmin = await User.findOne({ email: 'demosuperadmin@pokisham.com' });
    if (existingSuperAdmin) {
      console.log('Demo SuperAdmin already exists — skipping');
    } else {
      await User.create({
        name: 'Demo SuperAdmin',
        email: 'demosuperadmin@pokisham.com',
        password: 'Demo@1234',
        role: 'superadmin',
        isVerified: true,
      });
      console.log('Demo SuperAdmin created');
    }

    // 2. Demo Admin
    const existingAdmin = await User.findOne({ email: 'demoadmin@pokisham.com' });
    if (existingAdmin) {
      console.log('Demo Admin already exists — skipping');
    } else {
      await User.create({
        name: 'Demo Admin',
        email: 'demoadmin@pokisham.com',
        password: 'Demo@1234',
        role: 'admin',
        isVerified: true,
      });
      console.log('Demo Admin created');
    }

    // 3. Demo Tenant
    const existingTenantUser = await User.findOne({ email: 'demotenant@pokisham.com' });
    if (existingTenantUser) {
      console.log('Demo Tenant already exists — skipping');
    } else {
      // Create user first (Tenant model requires userId)
      const tenantUser = await User.create({
        name: 'Demo Tenant',
        email: 'demotenant@pokisham.com',
        password: 'Demo@1234',
        role: 'tenant',
        isVerified: true,
      });

      const tenant = await Tenant.create({
        businessName: 'Demo Tenant Store',
        ownerName: 'Demo Tenant',
        email: 'demotenant@pokisham.com',
        phone: '9999999999',
        isActive: true,
        userId: tenantUser._id,
      });

      tenantUser.tenantId = tenant._id;
      await tenantUser.save();
      console.log('Demo Tenant created');
    }

    // 4. Demo User
    const existingUser = await User.findOne({ email: 'demouser@pokisham.com' });
    if (existingUser) {
      console.log('Demo User already exists — skipping');
    } else {
      await User.create({
        name: 'Demo User',
        email: 'demouser@pokisham.com',
        password: 'Demo@1234',
        role: 'user',
        isVerified: true,
      });
      console.log('Demo User created');
    }

    console.log('\n--- Demo Accounts (Password: Demo@1234) ---');
    console.log('SuperAdmin: demosuperadmin@pokisham.com');
    console.log('Admin:      demoadmin@pokisham.com');
    console.log('Tenant:     demotenant@pokisham.com');
    console.log('User:       demouser@pokisham.com');
    console.log('---------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo users:', error.message);
    process.exit(1);
  }
};

seedDemoUsers();

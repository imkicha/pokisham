const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config({ path: '../.env' });

const createCategory = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ MongoDB connected');

    const categoryData = {
      name: 'Frame',
      description: 'frame',
    };

    // Prevent duplicates
    const existingCategory = await Category.findOne({
      name: categoryData.name,
    });

    if (existingCategory) {
      console.log('⚠️ Category already exists:', existingCategory.name);
    } else {
      await Category.create(categoryData);
      console.log('✓ Category created successfully!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating category:', error.message);
    process.exit(1);
  }
};

createCategory();

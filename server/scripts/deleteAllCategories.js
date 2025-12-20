/**
 * Script to delete all categories from the database
 * Run from server directory: node scripts/deleteAllCategories.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');

const deleteAllCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Count existing categories
    const count = await Category.countDocuments();
    console.log(`Found ${count} categories`);

    if (count === 0) {
      console.log('No categories to delete');
      process.exit(0);
    }

    // Delete all categories
    const result = await Category.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} categories`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

deleteAllCategories();

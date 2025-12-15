const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');

dotenv.config();

const categories = [
  {
    name: 'Gifts',
    description: 'Thoughtful gifts for every occasion',
    slug: 'gifts',
    isActive: true,
  },
  {
    name: 'Custom Frames',
    description: 'Personalized frames for your precious memories',
    slug: 'custom-frames',
    isActive: true,
  },
  {
    name: 'Pottery',
    description: 'Handcrafted pottery items made with love',
    slug: 'pottery',
    isActive: true,
  },
  {
    name: 'Kolu Bommai',
    description: 'Traditional festival dolls and decorations',
    slug: 'kolu-bommai',
    isActive: true,
  },
];

const sampleProducts = [
  {
    name: 'Handcrafted Clay Diya Set',
    description: 'Beautiful set of 12 handcrafted clay diyas perfect for festivals. Made by local artisans with eco-friendly materials.',
    price: 299,
    discountPrice: 249,
    material: 'Clay',
    stock: 100,
    sku: 'POT-001',
    tags: ['diya', 'festival', 'handmade', 'eco-friendly'],
    isFeatured: true,
    isTrending: true,
    giftWrapAvailable: true,
  },
  {
    name: 'Golu Bommai - Dasavatar Set',
    description: 'Complete set of 10 avatars of Lord Vishnu. Perfect for Navratri Golu display. Hand-painted with intricate details.',
    price: 1499,
    discountPrice: 1299,
    material: 'Clay & Wood',
    stock: 50,
    sku: 'KOLU-001',
    tags: ['golu', 'navratri', 'festival', 'traditional'],
    isFeatured: true,
    giftWrapAvailable: true,
  },
  {
    name: 'Personalized Photo Frame - Wooden',
    description: 'Custom wooden photo frame with engraving. Perfect gift for special occasions. Available in multiple sizes.',
    price: 599,
    material: 'Teak Wood',
    hasVariants: true,
    variants: [
      { size: '8x10 inches', price: 599, stock: 30, sku: 'FRAME-001-L' },
      { size: '6x8 inches', price: 499, stock: 40, sku: 'FRAME-001-M' },
      { size: '4x6 inches', price: 399, stock: 50, sku: 'FRAME-001-S' },
    ],
    tags: ['frame', 'personalized', 'gift', 'wooden'],
    isTrending: true,
    giftWrapAvailable: true,
  },
  {
    name: 'Traditional Kolam Stencil Set',
    description: 'Set of 20 traditional kolam patterns. Easy to use stencils for creating beautiful rangoli designs.',
    price: 399,
    discountPrice: 349,
    material: 'Plastic',
    stock: 75,
    sku: 'GIFT-001',
    tags: ['kolam', 'rangoli', 'traditional', 'art'],
    giftWrapAvailable: true,
  },
  {
    name: 'Handmade Terracotta Planter',
    description: 'Beautiful handmade terracotta planter with traditional South Indian motifs. Perfect for indoor plants.',
    price: 449,
    material: 'Terracotta',
    stock: 60,
    sku: 'POT-002',
    tags: ['planter', 'terracotta', 'handmade', 'garden'],
    isFeatured: true,
    giftWrapAvailable: false,
  },
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Category.deleteMany();
    await Product.deleteMany();

    console.log('Existing data cleared');

    // Insert categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`${createdCategories.length} categories created`);

    // Map sample products to categories
    const productsWithCategories = sampleProducts.map((product, index) => ({
      ...product,
      category: createdCategories[index % 4]._id,
      images: [
        {
          url: 'https://via.placeholder.com/400',
          publicId: 'placeholder',
        },
      ],
    }));

    // Insert products
    const createdProducts = await Product.insertMany(productsWithCategories);
    console.log(`${createdProducts.length} products created`);

    console.log('\nData Import Success!');
    console.log('=====================================');
    console.log('Categories created:', createdCategories.length);
    console.log('Products created:', createdProducts.length);
    console.log('=====================================');
    console.log('\nYou can now:');
    console.log('1. Create an admin user by registering through the app');
    console.log('2. Update user role to "admin" in MongoDB');
    console.log('3. Login and manage products/categories');
    console.log('\nTo create admin user via MongoDB:');
    console.log('db.users.updateOne({ email: "admin@pokisham.com" }, { $set: { role: "admin" } })');

    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();

    await Category.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('All data destroyed!');
    process.exit(0);
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}

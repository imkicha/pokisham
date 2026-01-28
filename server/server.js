const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDatabase = require('./config/database');
const errorHandler = require('./middleware/error');
const {
  setSecurityHeaders,
  preventHPP,
  additionalSecurityHeaders,
  validateRequestSize,
  logSuspiciousActivity,
  apiLimiter,
} = require('./middleware/security');

// Load env vars
dotenv.config();

// Connect to database
connectDatabase();

const app = express();

// Trust proxy - important for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS with security - MUST be first before other middleware
app.use(
  cors({
    origin: [
      "http://136.185.19.6",
      "http://136.185.19.6:3000",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
  })
);

// Security headers (after CORS)
app.use(setSecurityHeaders());
app.use(additionalSecurityHeaders);

// Body parser middleware with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validate request size
app.use(validateRequestSize);

// Cookie parser
app.use(cookieParser());

// Prevent HTTP Parameter Pollution
app.use(preventHPP());

// Log suspicious activity
app.use(logSuspiciousActivity);

// Apply general rate limiting to all routes
app.use('/api/', apiLimiter);


// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/combo-offers', require('./routes/comboOfferRoutes'));
app.use('/api/treasure-config', require('./routes/treasureConfigRoutes'));
app.use('/api/popup', require('./routes/popupRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

// Dynamic Sitemap for SEO (includes product pages)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const Category = require('./models/Category');

    const products = await Product.find({ isActive: true }).select('_id updatedAt').lean();
    const categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();

    const baseUrl = 'https://www.pokisham.com';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/become-seller</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`;

    // Add category pages
    for (const category of categories) {
      const lastMod = category.updatedAt ? new Date(category.updatedAt).toISOString().split('T')[0] : '';
      xml += `
  <url>
    <loc>${baseUrl}/products?category=${category.slug}</loc>
    ${lastMod ? `<lastmod>${lastMod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Add product pages
    for (const product of products) {
      const lastMod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : '';
      xml += `
  <url>
    <loc>${baseUrl}/product/${product._id}</loc>
    ${lastMod ? `<lastmod>${lastMod}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pokisham API is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Pokisham API',
    version: '1.0.0',
  });
});

// Error handler (must be after routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Pokisham Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

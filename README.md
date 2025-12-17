# 🎁 Pokisham - E-Commerce Platform

A modern, secure, and mobile-responsive e-commerce web application for selling handcrafted Gifts, Custom Frames, Pottery Items, and Kolu Bommai collections with a beautiful South-Indian inspired design theme.

[![Security: Helmet](https://img.shields.io/badge/Security-Helmet-green)](https://helmetjs.github.io/)
[![Authentication: JWT](https://img.shields.io/badge/Auth-JWT-blue)](https://jwt.io/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)
[![Frontend: React](https://img.shields.io/badge/Frontend-React-blue)](https://reactjs.org/)

![Pokisham Banner](client/public/treasure-open-removebg-preview.png)

## Features

### User Features
- 🛍️ **Shopping Experience**
  - Browse products by categories (Gifts, Custom Frames, Pottery, Kolu Bommai)
  - Advanced search and filtering
  - Product details with image galleries
  - Add products to cart and wishlist
  - Gift wrapping option

- 🔐 **Authentication & Security**
  - User authentication with OTP verification
  - Secure cookie-based session management
  - JWT token authentication
  - Password reset functionality
  - Multiple address management

- 💳 **Payment & Orders**
  - Secure checkout with Razorpay integration
  - Order tracking with real-time status updates
  - Order history and invoice download
  - Multiple payment methods

- 🎁 **Treasure Hunt Feature**
  - Interactive treasure chest appears every 3 minutes
  - Special offers and discounts
  - Engaging animations and effects
  - Mobile-responsive design

### Admin Features
- 📊 **Dashboard Analytics**
  - Real-time sales statistics
  - Revenue tracking
  - Popular products analysis
  - Customer insights

- 🏪 **Product Management**
  - Add/Edit/Delete products
  - Image upload with Cloudinary integration
  - Inventory management
  - Category management
  - Low stock alerts

- 📦 **Order Management**
  - View all orders
  - Update order status
  - Track shipments
  - Manage returns/cancellations

- 👥 **User Management**
  - View all users
  - Role management (Admin, SuperAdmin, Tenant)
  - Customer analytics

### 🔒 Security Features
- ✅ Secure cookie-based authentication (HttpOnly, Secure, SameSite)
- ✅ Rate limiting on sensitive endpoints (prevents brute force attacks)
- ✅ XSS protection with DOMPurify
- ✅ NoSQL injection prevention
- ✅ CORS configuration
- ✅ Comprehensive security headers (Helmet.js)
- ✅ Input sanitization and validation
- ✅ Suspicious activity logging
- ✅ CSRF protection
- ✅ Request size limits
- ✅ HTTP Parameter Pollution prevention

**[📖 Read Full Security Documentation](SECURITY.md)**

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object Data Modeling (ODM)
- **JWT** - Token-based authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Cloud-based image storage
- **Razorpay** - Payment gateway integration
- **Nodemailer** - Email service (OTP, notifications)
- **Helmet** - Security headers middleware
- **Express Rate Limit** - Rate limiting middleware
- **Express Mongo Sanitize** - NoSQL injection prevention
- **HPP** - HTTP Parameter Pollution prevention
- **Validator** - Input validation library

### Frontend
- **React 19.2.0** - Modern UI library
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - Promise-based HTTP client
- **React Hot Toast** - Toast notifications
- **React Icons** - Icon library
- **js-cookie** - Cookie management
- **DOMPurify** - XSS protection library

## Project Structure

```
Pokisham/
├── client/                      # Frontend React application
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── apple-touch-icon.png
│   │   ├── treasure-closed-removebg-preview.png
│   │   ├── treasure-open-removebg-preview.png
│   │   └── treasure-offer.png
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js         # Axios configuration with interceptors
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── Treasure.js  # Treasure hunt feature
│   │   │   ├── layout/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   └── admin/
│   │   ├── context/
│   │   │   ├── AuthContext.js   # Authentication context
│   │   │   └── CartContext.js   # Shopping cart context
│   │   ├── pages/
│   │   │   ├── WelcomePage.js   # Welcome screen with treasure
│   │   │   ├── HomePage.js      # Main home page
│   │   │   ├── user/
│   │   │   ├── auth/
│   │   │   └── admin/
│   │   ├── utils/
│   │   │   └── security.js      # Security utility functions
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                      # Backend Node.js application
│   ├── config/
│   │   ├── database.js          # MongoDB configuration
│   │   └── cloudinary.js        # Cloudinary configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── wishlistController.js
│   │   └── orderController.js
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints with rate limiting
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   └── orderRoutes.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── error.js             # Error handling middleware
│   │   └── security.js          # Security middleware (NEW!)
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── sendEmail.js
│   │   └── otp.js
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Express app entry point
│
├── SECURITY.md                  # Security documentation
└── README.md                    # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account
- Gmail account (for OTP emails)

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pokisham

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL
CLIENT_URL=http://localhost:3000
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

5. Start the development server:
```bash
npm start
```

The app will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/profile` - Update profile (Protected)
- `POST /api/auth/address` - Add address (Protected)
- `PUT /api/auth/address/:addressId` - Update address (Protected)
- `DELETE /api/auth/address/:addressId` - Delete address (Protected)

### Products
- `GET /api/products` - Get all products (with filters & pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/products/:id/images` - Upload images (Admin)
- `DELETE /api/products/:id/images/:imageId` - Delete image (Admin)
- `POST /api/products/:id/reviews` - Add review (Protected)
- `GET /api/products/:id/related` - Get related products

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user cart (Protected)
- `POST /api/cart` - Add to cart (Protected)
- `PUT /api/cart/:itemId` - Update cart item (Protected)
- `DELETE /api/cart/:itemId` - Remove from cart (Protected)
- `DELETE /api/cart` - Clear cart (Protected)

### Wishlist
- `GET /api/wishlist` - Get wishlist (Protected)
- `POST /api/wishlist/:productId` - Add to wishlist (Protected)
- `DELETE /api/wishlist/:productId` - Remove from wishlist (Protected)
- `DELETE /api/wishlist` - Clear wishlist (Protected)

### Orders
- `POST /api/orders/razorpay` - Create Razorpay order (Protected)
- `POST /api/orders/verify-payment` - Verify payment (Protected)
- `POST /api/orders` - Create order (Protected)
- `GET /api/orders/myorders` - Get user orders (Protected)
- `GET /api/orders/:id` - Get order by ID (Protected)
- `GET /api/orders` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)
- `PUT /api/orders/:id/cancel` - Cancel order (Protected)
- `GET /api/orders/admin/stats` - Get dashboard stats (Admin)

## Database Schema

### User
- name, email, phone, password, role
- addresses (array)
- avatar, isVerified
- OTP details

### Product
- name, description, price, discountPrice
- category (ref), images (array)
- material, size, variants
- stock, sku, tags
- ratings, reviews, giftWrapAvailable
- isFeatured, isTrending, isActive

### Category
- name, description, image
- slug, isActive

### Cart
- user (ref)
- items (array with product, quantity, variant, giftWrap)

### Wishlist
- user (ref)
- products (array)

### Order
- user (ref), orderNumber
- orderItems (array)
- shippingAddress, paymentMethod, paymentInfo
- prices (items, tax, shipping, giftWrap, discount, total)
- orderStatus, statusHistory
- deliveredAt, cancelledAt

## Design Theme

### Color Palette
- **Primary**: Pink shades (#ec5578)
- **Secondary**: Orange/Gold shades (#ed8e1f)
- **Accent**: Purple shades (#8678ff)

### Typography
- **Display Font**: Playfair Display (headings)
- **Body Font**: Inter (body text)

### South Indian Design Elements
- Subtle pattern backgrounds
- Traditional color combinations
- Cultural motifs in decorative elements
- Festive themes (Kolu season highlights)

## 🎁 Treasure Hunt Feature

An engaging gamification feature that rewards users with special offers:

### How It Works
1. **Automatic Appearance**: Treasure chest appears 3 minutes after login
2. **Movement**: Chest moves to random positions every 10 seconds
3. **Interactive**: Click to open and reveal special offers
4. **Reward**: Redirects to products page with discount applied
5. **Recurring**: Reappears every 3 minutes

### Technical Implementation
- **Component**: `client/src/components/common/Treasure.js`
- **Images**:
  - `treasure-closed-removebg-preview.png` - Closed state
  - `treasure-open-removebg-preview.png` - Opened state
  - `treasure-offer.png` - Offer display
- **Animations**: Bounce, pulse, confetti, sparkles
- **Responsive**: Optimized for mobile and desktop
- **State Management**: Uses sessionStorage and localStorage

### Customization
```javascript
// Change appearance interval (currently 3 minutes)
const threeMinutes = 3 * 60 * 1000;

// Change movement interval (currently 10 seconds)
setInterval(() => setRandomPosition(), 10000);
```

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
cd client
npm test
```

### Security Testing
```bash
# Run npm audit
npm audit

# Test rate limiting
# Try logging in with wrong credentials 6+ times

# Test XSS protection
# Try submitting forms with <script> tags
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env`
- For MongoDB Atlas, check IP whitelist

### CORS Errors
- Update `ALLOWED_ORIGINS` in server `.env`
- Check CORS configuration in `server/server.js`

### Rate Limiting
- Wait for rate limit window to expire
- Adjust limits in `server/middleware/security.js`

### Image Upload Fails
- Verify Cloudinary credentials
- Check file size (max 10MB)
- Ensure file type is allowed

## 📚 API Rate Limits

| Endpoint Type | Requests | Time Window |
|--------------|----------|-------------|
| Login/Register | 5 | 15 minutes |
| OTP Requests | 3 | 10 minutes |
| Password Reset | 3 | 1 hour |
| General API | 100 | 15 minutes |
| Brute Force Protection | 3 failed attempts | 5 minutes |

## 🚢 Deployment

### Production Checklist
Before deploying to production, ensure you complete these critical steps:

- [ ] Change `JWT_SECRET` to a strong random string (32+ characters)
- [ ] Update `MONGODB_URI` to production database (MongoDB Atlas)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL certificates
- [ ] Set `COOKIE_SECURE=true`
- [ ] Set `ENABLE_HSTS=true`
- [ ] Update `ALLOWED_ORIGINS` to production domains
- [ ] Configure MongoDB authentication and encryption
- [ ] Set up automated backups
- [ ] Run security audit: `npm audit`
- [ ] Test all payment flows in production mode
- [ ] Configure monitoring and logging
- [ ] Set up error tracking (Sentry, etc.)

### Backend Deployment (Railway/Render/Heroku)

**Railway (Recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Add environment variables via Railway dashboard
railway variables set JWT_SECRET=your_production_secret
railway variables set MONGODB_URI=your_atlas_uri
# ... add all other variables

# Deploy
railway up
```

**Environment Variables to Set:**
- All variables from `.env.example`
- Ensure production URLs and secrets

### Frontend Deployment (Vercel/Netlify)

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from client directory
cd client
vercel --prod

# Set environment variables
vercel env add REACT_APP_API_URL production
vercel env add REACT_APP_RAZORPAY_KEY_ID production
```

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `build`
- Node Version: 20.x

### Post-Deployment Verification

1. **Test Authentication Flow**
   - Register → Verify OTP → Login → Logout

2. **Test Payment Integration**
   - Add to cart → Checkout → Payment

3. **Verify Security Headers**
   ```bash
   curl -I https://your-domain.com
   # Check for security headers
   ```

4. **Monitor Performance**
   - Set up monitoring (New Relic, Datadog)
   - Configure error tracking (Sentry)
   - Enable logging aggregation

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Test thoroughly before submitting PR
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support & Contact

- 📧 **Email**: hello@pokisham.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/pokisham/issues)
- 📚 **Documentation**: [SECURITY.md](SECURITY.md)
- 💬 **Discussions**: For questions and community support

## 🙏 Acknowledgments

- React team for excellent documentation
- Express.js community
- MongoDB team
- All open-source contributors
- Security researchers and the OWASP community

---

**Made with ❤️ for handcrafted treasures**

*Pokisham - Discover Unique Handcrafted Gifts*

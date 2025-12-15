# Pokisham - E-Commerce Platform

A modern, mobile-responsive e-commerce web application for selling Gifts, Custom Frames, Pottery Items, and Kolu Bommai collections with a beautiful South-Indian inspired design theme.

## Features

### User Features
- Browse products by categories (Gifts, Custom Frames, Pottery, Kolu Bommai)
- Product search and filtering
- Add products to cart and wishlist
- User authentication with OTP verification
- Multiple address management
- Secure checkout with Razorpay payment integration
- Order tracking with real-time status updates
- Product reviews and ratings
- Gift wrapping option
- Mobile-responsive design

### Admin Features
- Dashboard with analytics (orders, revenue, popular products)
- Product management (Add/Edit/Delete)
- Image upload with Cloudinary integration
- Order management with status updates
- Category management
- Customer view
- Low stock alerts

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Image storage
- **Razorpay** - Payment gateway
- **Nodemailer** - Email service

### Frontend
- **React.js** - UI library
- **TailwindCSS** - CSS framework
- **React Router** - Routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Icons** - Icon library

## Project Structure

```
Pokisham/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   │   ├── database.js
│   │   └── cloudinary.js
│   ├── controllers/       # Route controllers
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── wishlistController.js
│   │   └── orderController.js
│   ├── models/            # Database models
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   └── Order.js
│   ├── routes/            # API routes
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   └── orderRoutes.js
│   ├── middleware/        # Middleware
│   │   ├── auth.js
│   │   └── error.js
│   ├── utils/             # Utility functions
│   │   ├── generateToken.js
│   │   └── otp.js
│   ├── .env.example       # Environment variables example
│   ├── package.json
│   └── server.js          # Entry point
│
└── client/                # Frontend
    ├── public/
    ├── src/
    │   ├── api/           # API configuration
    │   │   └── axios.js
    │   ├── components/    # React components
    │   │   ├── layout/
    │   │   │   ├── Header.js
    │   │   │   └── Footer.js
    │   │   ├── product/
    │   │   │   └── ProductCard.js
    │   │   ├── common/
    │   │   ├── cart/
    │   │   └── admin/
    │   ├── context/       # React Context
    │   │   ├── AuthContext.js
    │   │   └── CartContext.js
    │   ├── pages/         # Page components
    │   │   ├── user/
    │   │   │   └── HomePage.js
    │   │   ├── auth/
    │   │   └── admin/
    │   ├── utils/         # Utility functions
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── .env.example
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
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

## Features to Implement (Future)

1. **Additional Pages**:
   - Login, Register, OTP Verification pages
   - Product listing and detail pages
   - Cart and checkout pages
   - Order tracking pages
   - User profile and order history
   - Admin dashboard and management pages

2. **Advanced Features**:
   - Custom frame builder (upload photo + choose frame)
   - AI-based gift suggestions
   - Seasonal combos and offers
   - Advanced analytics with charts
   - Multi-warehouse inventory
   - Customer reviews with images
   - Coupon and discount system

3. **Performance Optimizations**:
   - Image lazy loading
   - Code splitting
   - CDN integration
   - Caching strategies

4. **Testing**:
   - Unit tests
   - Integration tests
   - E2E tests
   - Performance tests

## Deployment

### Backend
- Deploy to Heroku, Render, or Railway
- Set environment variables
- Connect to MongoDB Atlas

### Frontend
- Deploy to Vercel or Netlify
- Update API URL
- Set Razorpay key

## Contributing

This is a private project. For any queries, contact the development team.

## License

Proprietary - All rights reserved

## Support

For support, email: hello@pokisham.com

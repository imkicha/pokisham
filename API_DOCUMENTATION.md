# Pokisham API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "userId": "64abc123..."
}
```

### Verify OTP
**POST** `/auth/verify-otp`

Verify user account with OTP.

**Body:**
```json
{
  "userId": "64abc123...",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "token": "eyJhbGci...",
  "user": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "user"
  }
}
```

### Login
**POST** `/auth/login`

Login to existing account.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Get Current User
**GET** `/auth/me` 🔒

Get logged-in user details.

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "64abc123...",
    "name": "John Doe",
    "email": "john@example.com",
    "addresses": [...]
  }
}
```

---

## Product Endpoints

### Get All Products
**GET** `/products`

Get all products with optional filters.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Filter by category ID
- `search` - Search by name/description
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `material` - Filter by material
- `isFeatured` - Filter featured products (true/false)
- `isTrending` - Filter trending products (true/false)
- `sort` - Sort by (price_asc, price_desc, latest)

**Example:**
```
GET /products?category=64abc&minPrice=100&maxPrice=1000&sort=price_asc
```

**Response:**
```json
{
  "success": true,
  "count": 12,
  "total": 48,
  "page": 1,
  "pages": 4,
  "products": [
    {
      "_id": "64abc...",
      "name": "Handcrafted Clay Pot",
      "price": 499,
      "discountPrice": 399,
      "images": [...],
      "category": {...},
      "ratings": 4.5,
      "numReviews": 25
    }
  ]
}
```

### Get Single Product
**GET** `/products/:id`

Get detailed product information.

**Response:**
```json
{
  "success": true,
  "product": {
    "_id": "64abc...",
    "name": "Handcrafted Clay Pot",
    "description": "Beautiful handcrafted pottery...",
    "price": 499,
    "discountPrice": 399,
    "images": [...],
    "category": {...},
    "stock": 50,
    "reviews": [...],
    "ratings": 4.5,
    "giftWrapAvailable": true
  }
}
```

### Create Product 🔒👑
**POST** `/products`

Create a new product (Admin only).

**Body:**
```json
{
  "name": "Handcrafted Clay Pot",
  "description": "Beautiful handcrafted pottery...",
  "price": 499,
  "category": "64abc...",
  "stock": 50,
  "material": "Clay",
  "sku": "POT-001",
  "giftWrapAvailable": true,
  "isFeatured": false,
  "isTrending": true
}
```

### Upload Product Images 🔒👑
**POST** `/products/:id/images`

Upload product images (Admin only).

**Content-Type:** `multipart/form-data`

**Body:**
```
images: [File, File, ...]
```

### Add Product Review 🔒
**POST** `/products/:id/reviews`

Add a review to a product.

**Body:**
```json
{
  "rating": 5,
  "comment": "Excellent product!"
}
```

---

## Cart Endpoints

### Get Cart 🔒
**GET** `/cart`

Get user's cart.

**Response:**
```json
{
  "success": true,
  "cart": {
    "_id": "64abc...",
    "user": "64abc...",
    "items": [
      {
        "product": {...},
        "quantity": 2,
        "giftWrap": true,
        "variant": { "size": "Medium" }
      }
    ]
  }
}
```

### Add to Cart 🔒
**POST** `/cart`

Add item to cart.

**Body:**
```json
{
  "productId": "64abc...",
  "quantity": 2,
  "giftWrap": true,
  "variant": { "size": "Medium" }
}
```

### Update Cart Item 🔒
**PUT** `/cart/:itemId`

Update cart item quantity or gift wrap.

**Body:**
```json
{
  "quantity": 3,
  "giftWrap": false
}
```

### Remove from Cart 🔒
**DELETE** `/cart/:itemId`

Remove item from cart.

---

## Order Endpoints

### Create Razorpay Order 🔒
**POST** `/orders/razorpay`

Create a Razorpay order for payment.

**Body:**
```json
{
  "amount": 1299
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_...",
    "amount": 129900,
    "currency": "INR"
  }
}
```

### Verify Payment 🔒
**POST** `/orders/verify-payment`

Verify Razorpay payment signature.

**Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

### Create Order 🔒
**POST** `/orders`

Create a new order.

**Body:**
```json
{
  "orderItems": [
    {
      "product": "64abc...",
      "name": "Product Name",
      "quantity": 2,
      "image": "https://...",
      "price": 499,
      "giftWrap": true
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "phone": "+919876543210",
    "addressLine1": "123 Main St",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "pincode": "600001"
  },
  "paymentMethod": "UPI",
  "paymentInfo": {
    "razorpayOrderId": "order_...",
    "razorpayPaymentId": "pay_...",
    "razorpaySignature": "...",
    "status": "completed"
  },
  "itemsPrice": 998,
  "taxPrice": 50,
  "shippingPrice": 0,
  "giftWrapPrice": 40,
  "totalPrice": 1088
}
```

### Get My Orders 🔒
**GET** `/orders/myorders`

Get all orders for logged-in user.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "orders": [
    {
      "_id": "64abc...",
      "orderNumber": "PK24110100001",
      "orderItems": [...],
      "totalPrice": 1299,
      "orderStatus": "Delivered",
      "createdAt": "2024-11-01T10:30:00Z"
    }
  ]
}
```

### Get Order by ID 🔒
**GET** `/orders/:id`

Get single order details.

### Cancel Order 🔒
**PUT** `/orders/:id/cancel`

Cancel an order.

**Body:**
```json
{
  "reason": "Changed my mind"
}
```

---

## Admin Endpoints

### Get Dashboard Stats 🔒👑
**GET** `/orders/admin/stats`

Get admin dashboard statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "pendingOrders": 5,
    "deliveredOrders": 120,
    "totalRevenue": 125000,
    "lowStockProducts": [...],
    "popularProducts": [...],
    "recentOrders": [...]
  }
}
```

### Get All Orders 🔒👑
**GET** `/orders`

Get all orders with filters.

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by order status
- `paymentMethod` - Filter by payment method

### Update Order Status 🔒👑
**PUT** `/orders/:id/status`

Update order status.

**Body:**
```json
{
  "status": "Shipped",
  "message": "Order has been shipped via Blue Dart"
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Symbols

- 🔒 - Protected route (requires authentication)
- 👑 - Admin only route

## Order Status Flow

1. Pending
2. Processing
3. Packed
4. Shipped
5. Out for Delivery
6. Delivered
7. Cancelled (can be set at any time before delivery)

## Payment Methods

- UPI
- Card
- NetBanking
- COD (Cash on Delivery)

## Testing

Use these test Razorpay cards:
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1112

CVV: Any 3 digits
Expiry: Any future date

---

For more details, see the main README.md file.

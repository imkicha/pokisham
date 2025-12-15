# Quick Start Guide - Pokisham E-Commerce Platform

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (running locally or use MongoDB Atlas)
- npm or yarn

## Step 1: Clone and Navigate

```bash
cd /home/pyspark/kishore/Pokisham
```

## Step 2: Setup MongoDB

### Option A: Local MongoDB
1. Install MongoDB from https://www.mongodb.com/try/download/community
2. Start MongoDB service:
   ```bash
   sudo systemctl start mongod
   ```

### Option B: MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Whitelist your IP

## Step 3: Setup Backend

```bash
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your credentials
nano .env
```

### Minimum Required .env Configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (Use your MongoDB connection string)
MONGODB_URI=mongodb://localhost:27017/pokisham

# JWT (Change this to a secure random string)
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Email (For OTP - use Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Cloudinary (Create free account at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Create account at razorpay.com)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Frontend
CLIENT_URL=http://localhost:3000
```

### Start the backend server:

```bash
npm run dev
```

Backend will run on http://localhost:5000

## Step 4: Setup Frontend

Open a new terminal:

```bash
cd /home/pyspark/kishore/Pokisham/client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file
nano .env
```

### .env Configuration:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Start the frontend:

```bash
npm start
```

Frontend will run on http://localhost:3000

## Step 5: Create Initial Data

### Create Admin User

1. Register a new user through the app
2. Verify with OTP
3. Manually update the user role in MongoDB:

```bash
mongosh

use pokisham

db.users.updateOne(
  { email: "admin@pokisham.com" },
  { $set: { role: "admin" } }
)
```

### Create Categories

Login as admin and go to Admin Dashboard > Categories > Add New:
- Gifts
- Custom Frames
- Pottery
- Kolu Bommai

### Add Products

Login as admin and go to Admin Dashboard > Products > Add New

## Step 6: Test the Application

1. **Homepage**: http://localhost:3000
2. **Register**: Create a new user account
3. **Verify OTP**: Check email for OTP
4. **Browse Products**: Navigate through categories
5. **Add to Cart**: Add products to cart
6. **Checkout**: Complete a test order
7. **Admin Dashboard**: Login with admin credentials

## Common Setup Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in .env
- For Atlas, whitelist your IP

### Email OTP Not Sending
- Use Gmail App Password (not regular password)
- Enable "Less secure app access" in Gmail settings
- Or use Mailtrap for testing

### Port Already in Use
```bash
# Kill process on port 5000
sudo kill -9 $(sudo lsof -t -i:5000)

# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)
```

### Cloudinary Upload Errors
- Verify credentials in .env
- Check folder permissions
- Ensure account is active

## Getting Gmail App Password

1. Go to Google Account settings
2. Security > 2-Step Verification (enable if not enabled)
3. App passwords > Select app: Mail, Device: Other
4. Copy the 16-character password
5. Use this in EMAIL_PASS

## Getting Cloudinary Credentials

1. Sign up at https://cloudinary.com
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add to .env

## Getting Razorpay Credentials

1. Sign up at https://razorpay.com
2. Get Test API Keys from Dashboard
3. Add to .env (both server and client)

## Default Test Credentials

After creating admin user:
- **Email**: admin@pokisham.com
- **Password**: Your chosen password

## Project URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Next Steps

1. Add categories through admin panel
2. Add products with images
3. Test user flow (register, browse, cart, checkout)
4. Customize design and colors
5. Add more features from the roadmap

## Need Help?

- Check README.md for detailed documentation
- Review API endpoints in README.md
- Check server logs for errors
- Verify all environment variables are set correctly

## Production Deployment

For production deployment guide, see README.md section on "Deployment"

Happy Coding! 🚀

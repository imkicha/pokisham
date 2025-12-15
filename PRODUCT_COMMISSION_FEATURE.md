# Product Commission Analytics Feature

## Overview
This feature allows the Super Admin to view commission earnings breakdown by individual products from delivered orders.

## Features

### 1. Backend API Endpoint
**Route:** `GET /api/products/admin/commission-stats`
**Access:** Super Admin only
**Controller:** `getProductCommissionStats` in `productController.js`

**What it does:**
- Fetches all delivered orders
- Calculates commission per product based on:
  - Item total = price × quantity
  - Item commission = (item total / order total) × order platform commission
- Aggregates data per product:
  - Total units sold
  - Total revenue generated
  - Total commission earned
  - Number of orders
  - List of tenants who sold the product

**Response:**
```json
{
  "success": true,
  "overallStats": {
    "totalProducts": 15,
    "totalRevenue": 125000,
    "totalCommission": 12500,
    "totalUnitsSold": 450
  },
  "products": [
    {
      "productId": "...",
      "productName": "Product Name",
      "productImage": "https://...",
      "totalSold": 25,
      "totalRevenue": 15000,
      "totalCommission": 1500,
      "orderCount": 18,
      "tenants": ["Tenant A", "Tenant B"]
    }
  ]
}
```

### 2. Frontend Page
**Path:** `/superadmin/product-commissions`
**Component:** `SuperAdminProductCommissions.js`

**Features:**
- **Overall Statistics Cards:**
  - Products Sold (unique products)
  - Units Sold (total quantity)
  - Total Revenue
  - Commission Earned with average rate

- **Product Table:**
  - Product image and name
  - Units sold
  - Number of orders
  - Total revenue
  - Commission earned with percentage
  - Tenants who sold the product

- **Filters:**
  - Search by product name
  - Sort by: Revenue, Commission, Units Sold

- **Responsive Design:**
  - Mobile-friendly table
  - Collapsible columns on smaller screens

### 3. Navigation

**From Super Admin Dashboard:**
- New "Advanced Analytics" section with link to Product Commission Analytics

**From Commissions Page:**
- "Product Commissions" button in header to navigate to product-level analytics

## Technical Implementation

### Files Modified/Created

**Backend:**
1. `server/controllers/productController.js` - Added `getProductCommissionStats` function
2. `server/routes/productRoutes.js` - Added route for commission stats endpoint

**Frontend:**
1. `client/src/pages/superadmin/SuperAdminProductCommissions.js` - New page (created)
2. `client/src/pages/superadmin/SuperAdminCommissions.js` - Added navigation link
3. `client/src/pages/superadmin/SuperAdminDashboard.js` - Added analytics section
4. `client/src/App.js` - Added route for new page

### Authorization
- Route protected with `isSuperAdmin` middleware
- Only users with role='superadmin' can access

### Data Calculation Logic

**Commission per product item:**
```javascript
const itemTotal = item.price * item.quantity;
const itemCommission = order.platformCommission
  ? (itemTotal / order.totalPrice) * order.platformCommission
  : 0;
```

This ensures commission is fairly distributed across all items in an order based on their contribution to the total order value.

## How to Use

### As Super Admin:

1. **Navigate to Product Commissions:**
   - Go to Super Admin Dashboard
   - Click "View Product Commission Analytics" in the Advanced Analytics section
   - OR: Go to Commissions page → Click "Product Commissions" button

2. **View Statistics:**
   - See overall metrics at the top (products sold, revenue, commission)
   - Browse product table to see individual product performance

3. **Search Products:**
   - Use search box to find specific products by name

4. **Sort Data:**
   - Sort by Revenue to see top-earning products
   - Sort by Commission to see which products generate most commission
   - Sort by Units Sold to see best-sellers

5. **Analyze Performance:**
   - Check commission percentage per product
   - See which tenants are selling which products
   - Identify top-performing products

## Benefits

1. **Product-Level Insights:**
   - See which products drive the most revenue
   - Identify high-commission products
   - Understand product popularity

2. **Business Intelligence:**
   - Make data-driven decisions about product catalog
   - Optimize commission rates per product category
   - Identify opportunities for promotion

3. **Tenant Analysis:**
   - See which products are sold by multiple tenants
   - Understand tenant specializations
   - Identify product competition

## Notes

- Commission is calculated only from **delivered orders**
- Data updates in real-time as orders are marked delivered
- Revenue shown is gross sales before commission deduction
- Products sold by multiple tenants show all tenant names
- Commission rate may vary by tenant (calculated per order)

## Example Use Cases

1. **Top Revenue Products:**
   - Sort by Revenue to see which products bring in the most sales
   - Consider increasing stock or promotion for these products

2. **Commission Analysis:**
   - Sort by Commission to see which products earn the most platform fees
   - Balance between revenue and commission earnings

3. **Sales Volume:**
   - Sort by Units Sold to identify best-selling products
   - Plan inventory based on demand

4. **Multi-Tenant Products:**
   - See products sold by multiple tenants
   - Identify popular product categories across platform

# Order Routing Workflow - Complete Guide

## Overview
This document explains the complete order routing workflow where customers place orders, Super Admin manually assigns them to specific tenants, and tenants process and fulfill the orders.

---

## Workflow Steps

### 1. Customer Places Order
- Customer browses products and adds items to cart
- Customer completes checkout and payment
- Order is created with `routedToTenant: false`
- Order appears in Super Admin dashboard

### 2. Super Admin Assigns Order to Tenant
**Location:** [http://localhost:3000/superadmin/orders](http://localhost:3000/superadmin/orders)

**Steps:**
1. Super Admin logs in
2. Goes to "All Orders" page
3. Sees all orders in the system
4. For unassigned orders, clicks the **Send** icon (📤)
5. A modal appears showing approved tenants
6. Selects the appropriate tenant from dropdown
7. Clicks "Assign Order"
8. Order is now assigned to the tenant

**Backend API:**
```
POST /api/orders/:id/assign-tenant
Body: { tenantId: "tenant_id_here" }
```

**What happens:**
- Order's `tenantId` is set to the selected tenant
- `routedToTenant` is set to `true`
- Order status is reset to `Pending`
- Status history is updated with assignment message
- Console logs assignment for notification implementation (TODO)

### 3. Tenant Receives and Processes Order
**Location:** [http://localhost:3000/tenant/dashboard](http://localhost:3000/tenant/dashboard)

**Steps:**
1. Tenant logs in
2. Sees assigned orders on dashboard
3. Goes to "My Orders" to view all assigned orders
4. Clicks on an order to view details
5. Can update order status through the workflow

**Tenant Dashboard:**
- Shows recent assigned orders
- Displays order statistics
- Quick access to order management

**My Orders Page:**
- Lists all orders assigned to this tenant
- Filter and search functionality
- View order details

### 4. Tenant Updates Order Status
**Location:** Order detail page for each order

**Status Flow:**
```
Pending → Accepted → Processing → Out for Delivery → Delivered
```

**Steps:**
1. Tenant opens order detail page
2. Reviews customer information and order items
3. Clicks "Mark as [Next Status]" button
4. Confirms the status update
5. Order status is updated
6. Status history is recorded

**Backend API:**
```
PUT /api/orders/:id/tenant-status
Body: { orderStatus: "new_status" }
```

**Validations:**
- Only the assigned tenant can update the order
- Admins and Super Admins can also update any order
- Delivered and Cancelled orders cannot be updated further

---

## Technical Implementation

### Backend Routes (orderRoutes.js)
```javascript
// Tenant gets their assigned orders
router.get('/my-orders', protect, getTenantOrders);

// Super Admin assigns order to tenant
router.post('/:id/assign-tenant', protect, isSuperAdmin, assignOrderToTenant);

// Tenant updates order status
router.put('/:id/tenant-status', protect, updateTenantOrderStatus);
```

### Backend Controller (tenantOrderController.js)

#### assignOrderToTenant
- Validates tenant exists and is approved
- Checks order isn't already assigned
- Sets tenantId and routedToTenant flag
- Adds to status history
- Logs assignment (placeholder for notifications)

#### getTenantOrders
- Retrieves all orders for the logged-in tenant
- Filters by tenantId and routedToTenant = true
- Returns with populated user data

#### updateTenantOrderStatus
- Validates tenant ownership
- Updates order status
- Records in status history
- Sets deliveredAt/cancelledAt timestamps

### Frontend Components

#### SuperAdminOrders.js
- Lists all platform orders
- Shows assignment status
- Modal for tenant selection
- Filters by status and tenant
- Search functionality

**Key Features:**
- Only shows "Assign" button for unassigned orders
- Dropdown shows only approved tenants
- Real-time status updates after assignment

#### TenantDashboard.js
- Shows tenant-specific statistics
- Displays recent assigned orders
- Uses `/orders/my-orders` endpoint
- Auto-filters by tenantId (handled by backend)

#### TenantOrderDetail.js
- Shows complete order information
- Customer details and shipping address
- Order items with images
- Payment information
- Status update controls

**Key Features:**
- Validates tenant ownership
- Progressive status workflow
- Disabled after delivery/cancellation
- Visual feedback for each status

---

## API Endpoints Summary

### For Tenants
```
GET  /api/orders/my-orders           - Get all assigned orders
GET  /api/orders/:id                 - Get order details
PUT  /api/orders/:id/tenant-status   - Update order status
```

### For Super Admin
```
GET  /api/orders                     - Get all platform orders
POST /api/orders/:id/assign-tenant   - Assign order to tenant
GET  /api/tenants                    - Get all tenants (for dropdown)
```

---

## Order Model Fields

### Key Fields for Routing:
- `tenantId` - ID of assigned tenant (ObjectId reference)
- `routedToTenant` - Boolean flag indicating if assigned
- `orderStatus` - Current status (Pending, Accepted, Processing, etc.)
- `statusHistory` - Array of status changes with timestamps

### Status History Entry:
```javascript
{
  status: 'Assigned',
  message: 'Order assigned to tenant: Business Name',
  timestamp: Date.now()
}
```

---

## Security & Permissions

### Super Admin
✓ View all orders
✓ Assign orders to any approved tenant
✓ Update any order status
✗ Cannot be restricted by tenant

### Tenant
✓ View only their assigned orders
✓ Update status of their own orders
✗ Cannot view other tenants' orders
✗ Cannot assign orders

### Validation
- Tenant ownership verified on all operations
- Order assignment requires tenant to be approved
- Cannot reassign already-assigned orders
- Status updates validate allowed transitions

---

## Future Enhancements (TODO)

1. **Notifications:**
   - Email notification to tenant when order is assigned
   - SMS notification for order updates
   - Customer notifications on status changes

2. **Auto-Assignment:**
   - Automatic tenant selection based on product ownership
   - Load balancing across multiple tenants
   - Geographic proximity matching

3. **Analytics:**
   - Order fulfillment metrics per tenant
   - Average processing time
   - Customer satisfaction ratings

4. **Multi-Tenant Orders:**
   - Split orders with items from multiple tenants
   - Coordinate delivery across tenants
   - Unified tracking for customers

---

## Testing the Workflow

### Prerequisites:
1. Super Admin account created and logged in
2. At least one tenant approved
3. Products created and available
4. Customer account created

### Test Steps:

1. **Create Test Order:**
   ```
   - Login as customer
   - Add products to cart
   - Complete checkout
   - Verify order created
   ```

2. **Assign Order:**
   ```
   - Login as Super Admin
   - Go to /superadmin/orders
   - Find unassigned order (has send icon)
   - Click send icon
   - Select tenant from modal
   - Click "Assign Order"
   - Verify success message
   ```

3. **Process Order:**
   ```
   - Login as tenant
   - Go to /tenant/dashboard
   - See assigned order in recent orders
   - Click "View All Orders"
   - Click on the order
   - Update status step by step
   - Verify status changes are saved
   ```

4. **Verify Completion:**
   ```
   - Check order in Super Admin view
   - Verify tenant assignment
   - Check status history
   - Confirm deliveredAt timestamp
   ```

---

## Troubleshooting

### Order Not Showing for Tenant
- Verify order has `routedToTenant: true`
- Check tenantId matches logged-in tenant
- Ensure tenant is approved
- Check server logs for errors

### Cannot Assign Order
- Verify Super Admin permissions
- Check tenant status is "approved"
- Confirm order isn't already assigned
- Check network console for API errors

### Status Update Fails
- Verify tenant owns the order
- Check current status allows transition
- Ensure order isn't Delivered/Cancelled
- Review server validation errors

---

## File Locations

### Backend:
- `server/controllers/tenantOrderController.js` - Order routing logic
- `server/routes/orderRoutes.js` - API routes
- `server/middleware/auth.js` - Permission checking
- `server/models/Order.js` - Order schema

### Frontend:
- `client/src/pages/superadmin/SuperAdminOrders.js` - Assignment UI
- `client/src/pages/tenant/TenantDashboard.js` - Tenant overview
- `client/src/pages/tenant/TenantOrders.js` - Orders list
- `client/src/pages/tenant/TenantOrderDetail.js` - Order management

---

## Conclusion

The order routing workflow provides Super Admin with full control over order assignment while allowing tenants to independently manage and fulfill their assigned orders. The system maintains clear audit trails through status history and ensures proper authorization at every step.

For questions or issues, refer to the main MULTI_TENANT_GUIDE.md or COMPLETE_SETUP_GUIDE.md files.

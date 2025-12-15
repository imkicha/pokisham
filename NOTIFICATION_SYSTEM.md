# Notification System Documentation

## Overview
Complete notification system with real-time updates, order assignment notifications, and notification bell with badge counter.

## Features Implemented

### 1. Backend Notification System

#### Notification Model
**File:** `server/models/Notification.js`

**Fields:**
- `recipient` - User who receives the notification
- `type` - Type of notification (order_assigned, order_status, tenant_approved, etc.)
- `title` - Notification title
- `message` - Notification message
- `link` - Link to relevant page
- `relatedOrder` - Reference to related order
- `relatedTenant` - Reference to related tenant
- `isRead` - Read status
- `readAt` - Timestamp when marked as read
- `createdAt` / `updatedAt` - Automatic timestamps

#### Notification Controller
**File:** `server/controllers/notificationController.js`

**Endpoints:**
- `GET /api/notifications` - Get user notifications (paginated)
- `GET /api/notifications/unread-count` - Get unread notification count
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

**Helper Function:**
- `createNotification(data)` - Create new notification

#### Routes
**File:** `server/routes/notificationRoutes.js`
- All routes protected with authentication
- Registered in `server.js` as `/api/notifications`

### 2. Order Assignment Notifications

**File:** `server/controllers/tenantOrderController.js`

**When orders are assigned:**
1. **Single Tenant Assignment:**
   - Order is assigned to specific tenant
   - Notification sent with order details
   - Message: "You have been assigned order #XXXXX worth ₹X,XXX"

2. **Broadcast to All Tenants (Select All):**
   - Uses `notifyOnly: true` flag
   - Sends notification to all approved tenants
   - Does NOT assign order yet
   - Message: "Order #XXXXX worth ₹X,XXX is available. First to accept gets the order!"

### 3. Frontend Notification Bell

#### Component
**File:** `client/src/components/common/NotificationBell.js`

**Features:**
- Bell icon with unread count badge
- Dropdown showing last 10 notifications
- Auto-refresh every 30 seconds
- Mark as read on click
- Mark all as read button
- Click notification to navigate to relevant page
- Different icons for different notification types

**Badge:**
- Shows unread count
- Red circular badge
- Shows "99+" for counts over 99
- Positioned at top-right of bell icon

#### Integration
**File:** `client/src/components/layout/Header.js`
- Added between Cart and User Menu icons
- Visible only for authenticated users

### 4. Select All Tenants Feature

**File:** `client/src/pages/superadmin/SuperAdminOrders.js`

**Assign Modal Updates:**
- Added "📢 Assign to All Tenants" option in dropdown
- Shows warning when "all" is selected
- Confirmation dialog before broadcasting
- Sends notification to ALL approved tenants
- Uses `notifyOnly: true` to broadcast without assigning

**How It Works:**
1. Super Admin selects "Assign to All Tenants"
2. System confirms action with tenant count
3. Broadcasts notification to all approved tenants
4. Order remains unassigned until tenant accepts
5. First tenant to accept/claim gets the order

## Usage Guide

### As Super Admin:

**1. Assign Order to Single Tenant:**
```
1. Go to Super Admin → All Orders
2. Click assign icon (paper plane) next to unassigned order
3. Select specific tenant from dropdown
4. Click "Assign Order"
5. Tenant receives notification instantly
```

**2. Broadcast Order to All Tenants:**
```
1. Go to Super Admin → All Orders
2. Click assign icon next to unassigned order
3. Select "📢 Assign to All Tenants"
4. Read warning message
5. Click "Assign Order"
6. Confirm in dialog
7. All approved tenants receive notification
```

### As Tenant:

**1. Receive Notifications:**
```
- Bell icon appears in header (after cart)
- Red badge shows unread count
- Auto-updates every 30 seconds
```

**2. View Notifications:**
```
1. Click bell icon
2. Dropdown shows last 10 notifications
3. Unread notifications have blue background
4. Click notification to go to order
5. Notification marks as read automatically
```

**3. Manage Notifications:**
```
- Click "Mark all read" to clear all unread
- Click notification to view and mark as read
- Click "View all notifications" for full list
```

## Notification Types

| Type | Icon | Description |
|------|------|-------------|
| order_assigned | 📦 | Order assigned to tenant |
| order_status | 🔄 | Order status changed |
| tenant_approved | ✅ | Tenant application approved |
| tenant_rejected | ❌ | Tenant application rejected |
| general | 📢 | General notification |

## Technical Details

### Polling vs Real-time
- Currently uses polling (30-second intervals)
- Fetches unread count automatically
- Future: Can be upgraded to WebSockets for real-time

### Performance
- Notifications paginated (20 per page)
- Indexed on recipient + isRead + createdAt
- Dropdown shows only 10 most recent
- Efficient queries with MongoDB indexes

### Security
- All routes protected with authentication
- Users can only see their own notifications
- Cannot access other users' notifications
- Validation on notification creation

## API Examples

### Get Notifications
```javascript
GET /api/notifications?page=1&limit=20

Response:
{
  "success": true,
  "notifications": [...],
  "unreadCount": 5,
  "total": 25,
  "page": 1,
  "pages": 2
}
```

### Get Unread Count
```javascript
GET /api/notifications/unread-count

Response:
{
  "success": true,
  "unreadCount": 5
}
```

### Mark as Read
```javascript
PUT /api/notifications/:id/read

Response:
{
  "success": true,
  "notification": {...}
}
```

### Mark All as Read
```javascript
PUT /api/notifications/mark-all-read

Response:
{
  "success": true,
  "message": "All notifications marked as read",
  "modifiedCount": 5
}
```

### Create Notification (Internal)
```javascript
await createNotification({
  recipient: userId,
  type: 'order_assigned',
  title: 'New Order Assigned',
  message: 'You have been assigned order #ABC123',
  link: '/tenant/orders/123',
  relatedOrder: orderId,
  relatedTenant: tenantId
});
```

## Future Enhancements

1. **WebSocket Integration:**
   - Real-time notifications without polling
   - Instant updates when notification created

2. **Email/SMS Notifications:**
   - Send email when notification created
   - SMS for critical notifications

3. **Notification Preferences:**
   - User can choose which notifications to receive
   - Email vs in-app preferences

4. **Sound Alerts:**
   - Play sound when new notification arrives
   - Browser notification API

5. **Notification History:**
   - Full notifications page (/notifications)
   - Filter by type, date, read status
   - Archive old notifications

6. **Rich Notifications:**
   - Include images
   - Action buttons (Accept/Reject in notification)
   - Quick actions without navigating

## Troubleshooting

### Bell Icon Not Showing
- Ensure user is authenticated
- Check NotificationBell component is imported in Header
- Verify date-fns package is installed

### Notifications Not Appearing
- Check server logs for notification creation
- Verify user has tenantId (for tenant notifications)
- Check notification endpoint is working: `GET /api/notifications/unread-count`

### Badge Count Wrong
- Check if notifications are being created correctly
- Verify isRead field is updating
- Clear browser cache and refresh

### Select All Not Working
- Ensure tenants have status="approved"
- Check browser console for errors
- Verify backend supports notifyOnly flag

## Dependencies

**Backend:**
- mongoose (existing)

**Frontend:**
- date-fns (new - for date formatting)
- react-icons (existing)
- react-router-dom (existing)

## Files Created/Modified

**Backend:**
- ✅ `server/models/Notification.js` (created)
- ✅ `server/controllers/notificationController.js` (created)
- ✅ `server/routes/notificationRoutes.js` (created)
- ✅ `server/controllers/tenantOrderController.js` (modified)
- ✅ `server/server.js` (modified)

**Frontend:**
- ✅ `client/src/components/common/NotificationBell.js` (created)
- ✅ `client/src/components/layout/Header.js` (modified)
- ✅ `client/src/pages/superadmin/SuperAdminOrders.js` (modified)

## Summary

The notification system is fully functional with:
- ✅ Backend notification model and API
- ✅ Real-time notification bell with badge
- ✅ Order assignment notifications
- ✅ Select All tenants feature
- ✅ Mark as read functionality
- ✅ Auto-refresh every 30 seconds
- ✅ Click to navigate to related content

All features are production-ready and tested!

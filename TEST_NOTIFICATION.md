# Testing Notification System

## Quick Test Steps

### 1. Check if Bell Icon is Visible
- Log in as any user
- Look at the header (top of page)
- Between the Cart icon and User menu, you should see a Bell icon 🔔
- If you don't see it, the component might not be rendering

### 2. Test API Manually (using Browser Console)

Open browser console (F12) and run:

```javascript
// Test if notification endpoint is accessible
fetch('http://localhost:5000/api/notifications/unread-count', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(res => res.json())
.then(data => console.log('Unread count:', data))
.catch(err => console.error('Error:', err));
```

### 3. Create Test Notification (Super Admin only)

To create a test notification, you need to:
1. Log in as Super Admin
2. Go to "All Orders"
3. Assign an order to a tenant
4. The tenant should receive a notification

### 4. Manual Test using MongoDB

If you have access to MongoDB, you can create a test notification directly:

```javascript
db.notifications.insertOne({
  recipient: ObjectId("YOUR_USER_ID_HERE"),
  type: "general",
  title: "Test Notification",
  message: "This is a test notification to verify the system works",
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 5. Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "notifications"
4. Refresh the page
5. Look for:
   - GET request to `/api/notifications/unread-count`
   - Check if it returns 200 OK or an error

### Common Issues

#### Bell Icon Not Showing
**Cause:** Component not imported or React not rendering
**Fix:**
- Refresh the page
- Clear browser cache
- Check browser console for React errors

#### API Returning 401 Unauthorized
**Cause:** Not logged in or token expired
**Fix:**
- Log out and log back in
- Check if token exists: `localStorage.getItem('token')`

#### API Returning 404 Not Found
**Cause:** Route not registered
**Fix:**
- Restart the server
- Check server logs for route registration

#### No Notifications Appearing
**Cause:** No notifications have been created yet
**Fix:**
- Assign an order as Super Admin
- Or create a test notification in MongoDB

### Expected Behavior

**When working correctly:**
1. Bell icon visible in header (for authenticated users)
2. Badge shows "0" or count of unread notifications
3. Clicking bell opens dropdown
4. Dropdown shows notifications or "No notifications" message
5. Auto-refreshes every 30 seconds

### Debug Commands

```bash
# Check if server is running
curl http://localhost:5000/health

# Check notification route (replace TOKEN with your actual token)
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/notifications/unread-count

# Check MongoDB for notifications
mongo
use pokisham
db.notifications.find().pretty()
```

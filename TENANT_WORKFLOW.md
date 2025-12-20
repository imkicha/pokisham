# 🏪 Tenant Workflow Guide - Category & Product Management

## Overview

This guide explains the workflow for tenants to manage their categories and products in the Pokisham platform. **Important**: Tenants must create at least one category before they can add products.

## 📋 Table of Contents

- [Workflow Summary](#workflow-summary)
- [Step-by-Step Guide](#step-by-step-guide)
- [API Endpoints](#api-endpoints)
- [Category Management](#category-management)
- [Product Management](#product-management)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Workflow Summary

```
1. Tenant Login
   ↓
2. Go to Create Product Page
   ↓
3. System checks for available categories
   ↓
4a. If no categories → Show "Create Category" button in modal
   ↓
4b. If categories exist → Show category dropdown
   ↓
5. Create product with selected/new category
   ↓
6. Manage Products & Categories
```

**Key Features:**
- ✅ No forced category creation upfront
- ✅ Inline category creation during product creation
- ✅ Use existing categories (tenant's own + global)
- ✅ Flexible workflow with helpful prompts

## 📝 Step-by-Step Guide

### Step 1: Tenant Login

Tenants must log in with their credentials to access the management system.

```javascript
POST /api/auth/login
{
  "email": "tenant@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "tenant@example.com",
    "role": "tenant",
    "tenantId": "tenant_id_here"
  }
}
```

### Step 2: Create Categories (Required First Step)

Before creating any products, tenants **must** create at least one category.

```javascript
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Handcrafted Gifts",
  "description": "Beautiful handmade gifts for all occasions",
  "image": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created successfully",
  "category": {
    "_id": "category_id",
    "name": "Handcrafted Gifts",
    "slug": "handcrafted-gifts",
    "description": "Beautiful handmade gifts for all occasions",
    "tenantId": "tenant_id_here",
    "createdBy": "user_id",
    "isActive": true
  }
}
```

### Step 3: Verify Categories Created

Check if you have categories and can create products:

```javascript
GET /api/categories/tenant/can-create-products
Authorization: Bearer <token>
```

**Response (Has Categories):**
```json
{
  "success": true,
  "canCreate": true,
  "categoriesCount": 3,
  "message": "You have 3 categories and can create products"
}
```

**Response (No Categories):**
```json
{
  "success": true,
  "canCreate": false,
  "categoriesCount": 0,
  "message": "Please create at least one category before adding products"
}
```

### Step 4: Create Products

You can create products with or without creating categories first. The system will guide you:

```javascript
POST /api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "name": "Handmade Clay Pot",
  "description": "Beautiful traditional clay pot",
  "price": 999,
  "category": "category_id_here",  // Optional if no categories exist
  "stock": 50,
  "material": "Clay",
  "images": [File objects]
}
```

**Response Scenarios:**

**1. No Categories Available:**
```json
{
  "success": false,
  "message": "No categories available. Please create a category first or select from available categories.",
  "action": "no_categories",
  "hasGlobalCategories": false,
  "hasTenantCategories": false
}
```
*Frontend should show a "Create Category" button*

**2. Categories Exist but None Selected:**
```json
{
  "success": false,
  "message": "Please select a category for your product",
  "action": "select_category",
  "availableCategories": [
    {
      "_id": "cat1",
      "name": "Pottery",
      "type": "tenant"
    },
    {
      "_id": "cat2",
      "name": "Gifts",
      "type": "global"
    }
  ]
}
```
*Frontend should show category dropdown with these options*

**3. Success Response:**
```json
{
  "success": true,
  "product": {
    "_id": "product_id",
    "name": "Handmade Clay Pot",
    "category": "category_id",
    "tenantId": "tenant_id_here",
    "price": 999,
    "stock": 50
  }
}
```

### Step 5: Manage Categories & Products

View, update, and delete your categories and products as needed.

## 🔌 API Endpoints

### Category Endpoints

#### Get All Categories (Tenant View)
```http
GET /api/categories
Authorization: Bearer <tenant_token>
```
Returns tenant's own categories + global categories.

#### Get Tenant's Categories with Product Count
```http
GET /api/categories/tenant/my-categories
Authorization: Bearer <tenant_token>
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "categories": [
    {
      "_id": "cat1",
      "name": "Pottery",
      "slug": "pottery",
      "tenantId": "tenant_id",
      "productCount": 12
    }
  ],
  "canCreateProducts": true
}
```

#### Check if Can Create Products
```http
GET /api/categories/tenant/can-create-products
Authorization: Bearer <tenant_token>
```

#### Create Category
```http
POST /api/categories
Authorization: Bearer <tenant_token>
Content-Type: application/json

{
  "name": "Category Name",
  "description": "Category description",
  "image": "image_url"
}
```

#### Update Category
```http
PUT /api/categories/:id
Authorization: Bearer <tenant_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Authorization**: Tenants can only update their own categories.

#### Delete Category
```http
DELETE /api/categories/:id
Authorization: Bearer <tenant_token>
```

**Authorization**: Tenants can only delete their own categories.
**Validation**: Cannot delete if products are using this category.

### Product Endpoints

#### Create Product (with Category Validation)
```http
POST /api/products
Authorization: Bearer <tenant_token>
Content-Type: multipart/form-data
```

**Validations:**
1. Tenant must have at least one category
2. Selected category must belong to tenant or be a global category
3. All required fields must be provided

## 🏗️ Category System Architecture

### Category Ownership

Categories can be:

1. **Global Categories** (`tenantId: null`)
   - Created by admins
   - Available to all tenants and customers
   - Examples: Gifts, Frames, Pottery, Golu Bommai

2. **Tenant Categories** (`tenantId: <tenant_id>`)
   - Created by specific tenants
   - Only visible to that tenant and their customers
   - Examples: Custom Collections, Special Editions

### Category Visibility Rules

| User Type | Can See |
|-----------|---------|
| Customer | Global categories only |
| Tenant | Own categories + global categories |
| Admin | All categories |

### Product Category Rules

Tenants can assign products to:
- ✅ Their own categories
- ✅ Global categories (created by admin)
- ❌ Other tenants' categories

## ✅ Best Practices

### 1. Category Planning

Before creating categories, plan your product organization:

```
✅ Good Category Structure:
- Pottery & Ceramics
- Handcrafted Gifts
- Custom Photo Frames
- Festival Collections

❌ Avoid:
- Too many categories (creates confusion)
- Too few categories (hard to organize)
- Overlapping categories
```

### 2. Category Naming

```javascript
// ✅ Good names
"Handcrafted Pottery"
"Custom Photo Frames"
"Festival Decorations"

// ❌ Avoid
"cat1"
"Products"
"Misc"
```

### 3. Category Management Workflow

```javascript
// Step 1: Check current categories
const checkCategories = async () => {
  const response = await fetch('/api/categories/tenant/can-create-products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();

  if (!data.canCreate) {
    // Redirect to create category page
    return false;
  }
  return true;
};

// Step 2: Create category if needed
const createCategory = async (categoryData) => {
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(categoryData)
  });
  return response.json();
};

// Step 3: Create product
const createProduct = async (productData) => {
  const canCreate = await checkCategories();

  if (!canCreate) {
    alert('Please create a category first');
    return;
  }

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: productData // FormData with images
  });

  const result = await response.json();

  if (result.action === 'create_category_first') {
    // Handle the case where categories were deleted
    alert(result.message);
    // Redirect to category creation
  }

  return result;
};
```

### 4. Error Handling

```javascript
const handleProductCreation = async (productData) => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: productData
    });

    const result = await response.json();

    if (!result.success) {
      switch (result.action) {
        case 'create_category_first':
          // No categories exist
          showCategoryPrompt();
          break;
        default:
          showError(result.message);
      }
    }

    return result;
  } catch (error) {
    console.error('Product creation error:', error);
    showError('Failed to create product');
  }
};
```

## 🐛 Troubleshooting

### Issue: "Please create at least one category before adding products"

**Cause**: Tenant has no active categories.

**Solution**:
1. Navigate to Categories management
2. Create at least one category
3. Try creating the product again

```bash
# Check categories
curl -X GET http://localhost:5000/api/categories/tenant/can-create-products \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create category
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Category",
    "description": "My first category"
  }'
```

### Issue: "Category with this name already exists"

**Cause**: Duplicate category name for the same tenant.

**Solution**: Use a different name or update the existing category.

### Issue: "You can only use your own categories or global categories"

**Cause**: Trying to assign product to another tenant's category.

**Solution**:
1. Use your own categories
2. Use global categories
3. Create a new category if needed

### Issue: "Not authorized to update/delete this category"

**Cause**: Trying to modify a category that doesn't belong to you.

**Solution**: Only manage your own categories. Contact admin for global category changes.

### Issue: "Cannot delete category. N products are using this category"

**Cause**: Products are assigned to this category.

**Solution**:
1. Reassign products to different category
2. Delete the products first
3. Then delete the category

```javascript
// Reassign products before deleting category
const deleteCategory = async (categoryId) => {
  // First, check product count
  const response = await fetch(`/api/categories/tenant/my-categories`);
  const data = await response.json();

  const category = data.categories.find(cat => cat._id === categoryId);

  if (category.productCount > 0) {
    const confirm = window.confirm(
      `This category has ${category.productCount} products. ` +
      `Please reassign them first.`
    );
    if (!confirm) return;
  }

  // Proceed with deletion
  const deleteResponse = await fetch(`/api/categories/${categoryId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return deleteResponse.json();
};
```

## 📊 Frontend Implementation Example

### React Component with Improved UX

```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CreateProductPage = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    material: ''
  });
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCategory)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Category created successfully!');
        setCategories([...categories, data.category]);
        setProductData({ ...productData, category: data.category._id });
        setShowCategoryModal(false);
        setNewCategory({ name: '', description: '' });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      formData.append(key, productData[key]);
    });

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        // Handle different error scenarios
        switch (data.action) {
          case 'no_categories':
            // Show modal to create category
            toast.error(data.message);
            setShowCategoryModal(true);
            break;

          case 'select_category':
            // Show available categories
            toast.error(data.message);
            setCategories(data.availableCategories);
            break;

          default:
            toast.error(data.message);
        }
      } else {
        toast.success('Product created successfully!');
        navigate('/tenant/products');
      }
    } catch (error) {
      toast.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create Product</h1>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Product Name</label>
          <input
            type="text"
            value={productData.name}
            onChange={(e) => setProductData({ ...productData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={productData.description}
            onChange={(e) => setProductData({ ...productData, description: e.target.value })}
            className="w-full p-2 border rounded"
            rows="4"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price (₹)</label>
            <input
              type="number"
              value={productData.price}
              onChange={(e) => setProductData({ ...productData, price: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stock</label>
            <input
              type="number"
              value={productData.stock}
              onChange={(e) => setProductData({ ...productData, stock: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        {/* Category Selection with Create Option */}
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <div className="flex gap-2">
            <select
              value={productData.category}
              onChange={(e) => setProductData({ ...productData, category: e.target.value })}
              className="flex-1 p-2 border rounded"
              required={categories.length > 0}
            >
              <option value="">
                {categories.length === 0 ? 'No categories available' : 'Select a category'}
              </option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} {cat.type === 'global' ? '(Global)' : ''}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Create Category
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Product'}
        </button>
      </form>

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProductPage;
```

## 🔒 Security Notes

1. **Authorization**: All category and product operations are protected by JWT authentication
2. **Tenant Isolation**: Tenants can only access their own data
3. **Category Validation**: System validates category ownership before product creation
4. **Rate Limiting**: API endpoints have rate limiting to prevent abuse

## 📚 Additional Resources

- [Main README](README.md) - Full application documentation
- [Security Documentation](SECURITY.md) - Security best practices
- [API Documentation](README.md#api-documentation) - Complete API reference

---

**Need Help?**
- 📧 Email: support@pokisham.com
- 📖 Documentation: [README.md](README.md)
- 🐛 Issues: GitHub Issues

---

*Last Updated: 2025-12-17*
*Version: 1.0.0*

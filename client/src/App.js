import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Components
import WelcomeRedirect from './components/common/WelcomeRedirect';
import InstallPWA from './components/common/InstallPWA';

// Pages
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/user/HomePage';
import ProductsPage from './pages/user/ProductsPage';
import ProductDetail from './pages/user/ProductDetail';
import AboutPage from './pages/user/AboutPage';
import ContactPage from './pages/user/ContactPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import WishlistPage from './pages/user/WishlistPage';
import ProfilePage from './pages/user/ProfilePage';
import OrdersPage from './pages/user/OrdersPage';
import OrderDetailPage from './pages/user/OrderDetailPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import AddProduct from './pages/admin/AddProduct';
import EditProduct from './pages/admin/EditProduct';
import OrdersManagement from './pages/admin/OrdersManagement';
import UsersManagement from './pages/admin/UsersManagement';
import ContactMessages from './pages/admin/ContactMessages';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import TenantManagement from './pages/superadmin/TenantManagement';
import TenantDetails from './pages/superadmin/TenantDetails';
import SuperAdminProducts from './pages/superadmin/SuperAdminProducts';
import SuperAdminOrders from './pages/superadmin/SuperAdminOrders';
import SuperAdminCommissions from './pages/superadmin/SuperAdminCommissions';
import SuperAdminProductCommissions from './pages/superadmin/SuperAdminProductCommissions';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantProducts from './pages/tenant/TenantProducts';
import TenantOrders from './pages/tenant/TenantOrders';
import TenantOrderDetail from './pages/tenant/TenantOrderDetail';
import TenantProfile from './pages/tenant/TenantProfile';
import TenantApplication from './pages/TenantApplication';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

// Protected Route Component
// eslint-disable-next-line no-unused-vars
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false, tenantOnly = false, sellerOnly = false }) => {
  const { isAuthenticated, isAdmin, isSuperAdmin, isTenant, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (tenantOnly && !isTenant) {
    return <Navigate to="/" replace />;
  }

  // sellerOnly allows admin, superadmin, or tenant (anyone who can sell)
  if (sellerOnly && !isAdmin && !isSuperAdmin && !isTenant) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Layout Component
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#333',
                },
                success: {
                  iconTheme: {
                    primary: '#ec5578',
                    secondary: '#fff',
                  },
                },
              }}
            />

          <WelcomeRedirect />
          <InstallPWA />

          <Routes>
            {/* Welcome Page */}
            <Route path="/welcome" element={<WelcomePage />} />

            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route
              path="/products"
              element={
                <Layout>
                  <ProductsPage />
                </Layout>
              }
            />
            <Route
              path="/product/:id"
              element={
                <Layout>
                  <ProductDetail />
                </Layout>
              }
            />
            <Route
              path="/about"
              element={
                <Layout>
                  <AboutPage />
                </Layout>
              }
            />
            <Route
              path="/contact"
              element={
                <Layout>
                  <ContactPage />
                </Layout>
              }
            />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Tenant Application (Public) */}
            <Route
              path="/become-seller"
              element={
                <Layout>
                  <TenantApplication />
                </Layout>
              }
            />

            {/* Legal Pages */}
            <Route
              path="/privacy"
              element={
                <Layout>
                  <PrivacyPolicy />
                </Layout>
              }
            />
            <Route
              path="/terms"
              element={
                <Layout>
                  <TermsOfService />
                </Layout>
              }
            />

            {/* Protected User Routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CartPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CheckoutPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Layout>
                    <WishlistPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrderDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Super Admin Routes */}
            <Route
              path="/superadmin/dashboard"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <SuperAdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/tenants"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <TenantManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/tenants/:id"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <TenantDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/products"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <SuperAdminProducts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/orders"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <SuperAdminOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/commissions"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <SuperAdminCommissions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/product-commissions"
              element={
                <ProtectedRoute superAdminOnly={true}>
                  <Layout>
                    <SuperAdminProductCommissions />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Tenant Routes */}
            <Route
              path="/tenant/dashboard"
              element={
                <ProtectedRoute tenantOnly={true}>
                  <Layout>
                    <TenantDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/products"
              element={
                <ProtectedRoute tenantOnly={true}>
                  <Layout>
                    <TenantProducts />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/orders"
              element={
                <ProtectedRoute tenantOnly={true}>
                  <Layout>
                    <TenantOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/orders/:id"
              element={
                <ProtectedRoute tenantOnly={true}>
                  <Layout>
                    <TenantOrderDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/profile"
              element={
                <ProtectedRoute tenantOnly={true}>
                  <Layout>
                    <TenantProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <ProductsManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/add"
              element={
                <ProtectedRoute sellerOnly={true}>
                  <Layout>
                    <AddProduct />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/edit/:id"
              element={
                <ProtectedRoute sellerOnly={true}>
                  <Layout>
                    <EditProduct />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <OrdersManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <UsersManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <ContactMessages />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute adminOnly={true}>
                  <Layout>
                    <CategoriesManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* 404 Page */}
            <Route
              path="*"
              element={
                <Layout>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-display font-bold text-gray-800 mb-4">404</h1>
                      <p className="text-xl text-gray-600 mb-8">Page not found</p>
                      <a href="/" className="btn-primary">
                        Go Home
                      </a>
                    </div>
                  </div>
                </Layout>
              }
            />
          </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

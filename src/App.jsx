import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import ScrollToTop from './components/shared/ScrollToTop';
import AdminRoute from './components/shared/AdminRoute';
import AdminOnlyRoute from './components/shared/AdminOnlyRoute';
import ShopLayout from './components/layout/ShopLayout';
import AdminLayout from './components/layout/AdminLayout';
import AccountLayout from './pages/account/AccountLayout';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/shop/Home';
import Products from './pages/shop/Products';
import ProductDetail from './pages/shop/ProductDetail';
import About from './pages/shop/About';
import Contact from './pages/shop/Contact';
import CGV from './pages/shop/CGV';
import Returns from './pages/shop/Returns';
import Cart from './pages/cart/Cart';
import Checkout from './pages/cart/Checkout';
import Orders from './pages/orders/Orders';
import OrderDetail from './pages/orders/OrderDetail';
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Addresses';
import Wishlist from './pages/account/Wishlist';
import Notifications from './pages/account/Notifications';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSettings from './pages/admin/AdminSettings';
import AdminAccounting from './pages/admin/AdminAccounting';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminAudit from './pages/admin/AdminAudit';
import AdminStores from './pages/admin/AdminStores';
import AdminStockTransfers from './pages/admin/AdminStockTransfers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const isDev = import.meta.env.DEV;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Shop */}
            <Route element={<ShopLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cgv" element={<CGV />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Pages protégées avec sidebar compte */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AccountLayout />}>
                  <Route path="/account/profile" element={<Profile />} />
                  <Route path="/account/addresses" element={<Addresses />} />
                  <Route path="/account/wishlist" element={<Wishlist />} />
                  <Route path="/account/notifications" element={<Notifications />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:orderNumber" element={<OrderDetail />} />
                </Route>
              </Route>
            </Route>

            {/* Admin + Staff */}
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/accounting" element={<AdminAccounting />} />
                <Route path="/admin/invoices" element={<AdminInvoices />} />
                <Route path="/admin/stock-transfers" element={<AdminStockTransfers />} />
                <Route path="/admin/audit" element={<AdminAudit />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route element={<AdminOnlyRoute />}>
                  <Route path="/admin/stores" element={<AdminStores />} />
                  <Route path="/admin/coupons" element={<AdminCoupons />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>

      {isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
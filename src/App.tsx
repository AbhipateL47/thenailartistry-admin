import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./features/auth/components/ProtectedRoute";
import { PublicRoute } from "./features/auth/components/PublicRoute";
import Login from "./features/auth/pages/Login";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import Maintenance from "./pages/Maintenance";
import Dashboard from "./pages/Dashboard";
import Products from "./features/products/pages/Products";
import AddProduct from "./features/products/pages/AddProduct";
import EditProduct from "./features/products/pages/EditProduct";
import Orders from "./features/orders/pages/Orders";
import OrderDetails from "./features/orders/pages/OrderDetails";
import ProductDetails from "./features/products/pages/ProductDetails";
import Customers from "./features/customers/pages/Customers";
import Analytics from "./features/analytics/pages/Analytics";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import ProductAttributes from "./features/products/pages/ProductAttributes";
import Coupons from "./features/coupons/pages/Coupons";
import AuditLogs from "./features/audit-logs/pages/AuditLogs";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* Public routes - redirect to dashboard if already logged in */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/maintenance" element={<PublicRoute><Maintenance /></PublicRoute>} />
        
        {/* Protected admin routes - redirect to login if not authenticated */}
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:productCode" element={<EditProduct />} />
          <Route path="products/view/:productCode" element={<ProductDetails />} />
          <Route path="product-attributes" element={<ProductAttributes />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderDetails />} />
          <Route path="customers" element={<Customers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        
        {/* Fallback - redirect to login if not authenticated, dashboard if authenticated */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

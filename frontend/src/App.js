import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ForceChangePassword from "./pages/ForceChangePassword";
import Dashboard from "./pages/Dashboard";
import RfqList from "./pages/rfq/RfqList";
import RfqDetails from "./pages/rfq/RfqDetails";
import CreateEditRfq from "./pages/rfq/CreateEditRfq";
import BidSubmission from "./pages/quotation/BidSubmission";
import QuotationComparison from "./pages/quotation/QuotationComparison";
import UserList from "./pages/user/UserList";
import VendorList from "./pages/vendor/VendorList";
import VendorProfile from "./pages/vendor/VendorProfile";
import AuditLogs from "./pages/audit/AuditLogs";
import NotificationsList from "./pages/notification/NotificationsList";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PoList from "./pages/po/PoList";
import PoDetails from "./pages/po/PoDetails";
import InvoiceList from "./pages/invoice/InvoiceList";
import InvoiceDetails from "./pages/invoice/InvoiceDetails";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Forced Reset Password */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ForceChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Main Protected Routes Panel */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard available to all logged in roles */}
            <Route index element={<Dashboard />} />

            {/* RFQ Routes */}
            <Route path="rfqs" element={<RfqList />} />
            <Route path="rfqs/:id" element={<RfqDetails />} />

            <Route
              path="rfqs/create"
              element={
                <ProtectedRoute allowedRoles={["officer"]}>
                  <CreateEditRfq />
                </ProtectedRoute>
              }
            />
            <Route
              path="rfqs/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["officer"]}>
                  <CreateEditRfq />
                </ProtectedRoute>
              }
            />
            <Route
              path="rfqs/:id/bid"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <BidSubmission />
                </ProtectedRoute>
              }
            />
            <Route
              path="rfqs/:id/compare"
              element={
                <ProtectedRoute allowedRoles={["officer", "manager"]}>
                  <QuotationComparison />
                </ProtectedRoute>
              }
            />

            {/* Purchase Orders */}
            <Route path="purchase-orders" element={<PoList />} />
            <Route path="purchase-orders/:id" element={<PoDetails />} />

            {/* Invoices */}
            <Route path="invoices" element={<InvoiceList />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />

            {/* Admin Directories */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserList />
                </ProtectedRoute>
              }
            />
            <Route
              path="vendors"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <VendorList />
                </ProtectedRoute>
              }
            />

            {/* Vendor Settings */}
            <Route
              path="vendor-profile"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorProfile />
                </ProtectedRoute>
              }
            />

            {/* Logs & Notifications */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route path="notifications" element={<NotificationsList />} />

            {/* Fallback to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* Visual Toast Notification Handler */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "text-xs font-medium border border-border shadow-dropdown bg-white text-text-primary rounded-lg",
          duration: 4000,
          success: {
            iconTheme: {
              primary: "#1D9E75",
              secondary: "#FFFFFF",
            },
          },
          error: {
            iconTheme: {
              primary: "#993556",
              secondary: "#FFFFFF",
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;

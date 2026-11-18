import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ErrorBoundary, NotFoundPage } from './components/ErrorBoundary.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { ServiceDetailsPage } from './pages/ServiceDetailsPage.tsx';
import { AboutPage } from './pages/AboutPage.tsx';
import { SignInPage } from './pages/SignInPage.tsx';
import { SignUpPage } from './pages/SignUpPage.tsx';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage.tsx';
import { PaymentCancelPage } from './pages/PaymentCancelPage.tsx';
import { StripeTestCheckoutPage } from './pages/StripeTestCheckoutPage.tsx';
import { CustomerOverviewPage } from './pages/dashboard/CustomerOverviewPage.tsx';
import { CustomerBookingsPage } from './pages/dashboard/CustomerBookingsPage.tsx';
import { CustomerPaymentsPage } from './pages/dashboard/CustomerPaymentsPage.tsx';
import { TechnicianOverviewPage } from './pages/dashboard/TechnicianOverviewPage.tsx';
import { TechnicianAddServicePage } from './pages/dashboard/TechnicianAddServicePage.tsx';
import { TechnicianMyServicesPage } from './pages/dashboard/TechnicianMyServicesPage.tsx';
import { TechnicianRequestsPage } from './pages/dashboard/TechnicianRequestsPage.tsx';
import { AdminOverviewPage } from './pages/dashboard/AdminOverviewPage.tsx';
import { AdminUsersPage } from './pages/dashboard/AdminUsersPage.tsx';
import { AdminServicesPage } from './pages/dashboard/AdminServicesPage.tsx';
import { AdminBookingsPage } from './pages/dashboard/AdminBookingsPage.tsx';
import { AdminTransactionsPage } from './pages/dashboard/AdminTransactionsPage.tsx';
import { ProfilePage } from './pages/dashboard/ProfilePage.tsx';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function DashboardRootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors closeButton />
            <Routes>
              {/* Public Routes with Sticky Navbar & Footer */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/services/:id" element={<ServiceDetailsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/stripe-test-checkout" element={<StripeTestCheckoutPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              {/* Smart Dashboard Redirect */}
              <Route path="/dashboard" element={<DashboardRootRedirect />} />

              {/* Customer Dashboard Routes */}
              <Route path="/dashboard/customer" element={<CustomerOverviewPage />} />
              <Route path="/dashboard/customer/bookings" element={<CustomerBookingsPage />} />
              <Route path="/dashboard/customer/payments" element={<CustomerPaymentsPage />} />

              {/* Technician Dashboard Routes */}
              <Route path="/dashboard/technician" element={<TechnicianOverviewPage />} />
              <Route path="/dashboard/technician/add-service" element={<TechnicianAddServicePage />} />
              <Route path="/dashboard/technician/my-services" element={<TechnicianMyServicesPage />} />
              <Route path="/dashboard/technician/requests" element={<TechnicianRequestsPage />} />

              {/* Admin Dashboard Routes */}
              <Route path="/dashboard/admin" element={<AdminOverviewPage />} />
              <Route path="/dashboard/admin/users" element={<AdminUsersPage />} />
              <Route path="/dashboard/admin/services" element={<AdminServicesPage />} />
              <Route path="/dashboard/admin/bookings" element={<AdminBookingsPage />} />
              <Route path="/dashboard/admin/transactions" element={<AdminTransactionsPage />} />

              {/* Shared Profile Route */}
              <Route path="/dashboard/profile" element={<ProfilePage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

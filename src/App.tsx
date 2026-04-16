import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute, GuestRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Landing / Public pages
import { LandingPage } from './pages/landing/LandingPage';
import { ArtworksPage } from './pages/landing/ArtworksPage';
import { ArtworkDetailPage } from './pages/landing/ArtworkDetailPage';
import { AuctionsPublicPage } from './pages/landing/AuctionsPublicPage';
import { AuctionDetailPublicPage } from './pages/landing/AuctionDetailPublicPage';
import { AboutPage } from './pages/landing/AboutPage';
import { ContactPage } from './pages/landing/ContactPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyPage } from './pages/auth/VerifyPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard pages
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { ArtworksPage as DashArtworksPage } from './pages/dashboard/ArtworksPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { CurrenciesPage } from './pages/dashboard/CurrenciesPage';
import { AuctionsPage } from './pages/dashboard/AuctionsPage';
import { AuctionDetailPage } from './pages/dashboard/AuctionDetailPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { CartPage } from './pages/dashboard/CartPage';
import { WalletPage } from './pages/dashboard/WalletPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { ActivityLogsPage } from './pages/dashboard/ActivityLogsPage';
import { RolesPage } from './pages/dashboard/RolesPage';
import { UsersPage } from './pages/dashboard/UsersPage';
import { SiteConfigPage } from './pages/dashboard/SiteConfigPage';
import { MessagesPage } from './pages/dashboard/MessagesPage';

function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
        <AuthModalProvider>
          <Routes>
            {/* Public — no login required */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/artworks" element={<ArtworksPage />} />
            <Route path="/artworks/:uuid" element={<ArtworkDetailPage />} />
            <Route path="/auctions" element={<AuctionsPublicPage />} />
            <Route path="/auctions/:uuid" element={<AuctionDetailPublicPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Auth */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Dashboard — login required */}
            <Route path="/dashboard" element={<DashboardWrapper><OverviewPage /></DashboardWrapper>} />
            <Route path="/dashboard/artworks" element={<DashboardWrapper><DashArtworksPage /></DashboardWrapper>} />
            <Route path="/dashboard/categories" element={<DashboardWrapper><CategoriesPage /></DashboardWrapper>} />
            <Route path="/dashboard/currencies" element={<DashboardWrapper><CurrenciesPage /></DashboardWrapper>} />
            <Route path="/dashboard/auctions" element={<DashboardWrapper><AuctionsPage /></DashboardWrapper>} />
            <Route path="/dashboard/auctions/:uuid" element={<DashboardWrapper><AuctionDetailPage /></DashboardWrapper>} />
            <Route path="/dashboard/orders" element={<DashboardWrapper><OrdersPage /></DashboardWrapper>} />
            <Route path="/dashboard/cart" element={<DashboardWrapper><CartPage /></DashboardWrapper>} />
            <Route path="/dashboard/wallet" element={<DashboardWrapper><WalletPage /></DashboardWrapper>} />
            <Route path="/dashboard/profile" element={<DashboardWrapper><ProfilePage /></DashboardWrapper>} />
            <Route path="/dashboard/activity-logs" element={<DashboardWrapper><ActivityLogsPage /></DashboardWrapper>} />
            <Route path="/dashboard/roles" element={<DashboardWrapper><RolesPage /></DashboardWrapper>} />
            <Route path="/dashboard/users" element={<DashboardWrapper><UsersPage /></DashboardWrapper>} />
            <Route path="/dashboard/messages" element={<DashboardWrapper><MessagesPage /></DashboardWrapper>} />
            <Route path="/dashboard/site-config" element={<DashboardWrapper><SiteConfigPage /></DashboardWrapper>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthModalProvider>
        </ToastProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

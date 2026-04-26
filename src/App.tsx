import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { siteApi } from './api';
import { AuthModalProvider } from './context/AuthModalContext';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { LoadingBar } from './components/ui/LoadingBar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Landing / Public pages
import { LandingPage } from './pages/landing/LandingPage';
import { ArtworksPage } from './pages/landing/ArtworksPage';
import { ArtworkDetailPage } from './pages/landing/ArtworkDetailPage';
import { AuctionsPublicPage } from './pages/landing/AuctionsPublicPage';
import { AuctionDetailPublicPage } from './pages/landing/AuctionDetailPublicPage';
import { AboutPage } from './pages/landing/AboutPage';
import { ContactPage } from './pages/landing/ContactPage';

// Auth pages (standalone — only pages reachable via emailed links)
import { VerifyPage } from './pages/auth/VerifyPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard pages
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { ArtworksPage as DashArtworksPage } from './pages/dashboard/ArtworksPage';
import { CategoriesPage } from './pages/dashboard/CategoriesPage';
import { CurrenciesPage } from './pages/dashboard/CurrenciesPage';
import { AuctionsPage } from './pages/dashboard/AuctionsPage';
import { AuctionDetailPage } from './pages/dashboard/AuctionDetailPage';
import AuctionConfigPage from './pages/dashboard/AuctionConfigPage';
import { OrdersPage } from './pages/dashboard/OrdersPage';
import { CartPage } from './pages/dashboard/CartPage';
import { WalletPage } from './pages/dashboard/WalletPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { ActivityLogsPage } from './pages/dashboard/ActivityLogsPage';
import { RolesPage } from './pages/dashboard/RolesPage';
import { UsersPage } from './pages/dashboard/UsersPage';
import { SiteConfigPage } from './pages/dashboard/SiteConfigPage';
import { MessagesPage } from './pages/dashboard/MessagesPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { PerformancePage } from './pages/dashboard/PerformancePage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { PaymentMethodsPage } from './pages/dashboard/PaymentMethodsPage';

function useDynamicFavicon() {
  useEffect(() => {
    siteApi.getFavicon()
      .then(res => {
        const url = res.data.favicon_url;
        if (!url) return;
        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.type = 'image/png';
        link.href = url;
      })
      .catch(() => {});
  }, []);
}

function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  useDynamicFavicon();
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
        <LoadingBar />
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

            {/* Auth — only pages reachable via emailed links */}
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Dashboard — login required */}
            <Route path="/dashboard" element={<DashboardWrapper><OverviewPage /></DashboardWrapper>} />
            <Route path="/dashboard/artworks" element={<DashboardWrapper><DashArtworksPage /></DashboardWrapper>} />
            <Route path="/dashboard/categories" element={<DashboardWrapper><CategoriesPage /></DashboardWrapper>} />
            <Route path="/dashboard/currencies" element={<DashboardWrapper><CurrenciesPage /></DashboardWrapper>} />
            <Route path="/dashboard/auctions" element={<DashboardWrapper><AuctionsPage /></DashboardWrapper>} />
            <Route path="/dashboard/auctions/:uuid" element={<DashboardWrapper><AuctionDetailPage /></DashboardWrapper>} />
            <Route path="/dashboard/auction-config" element={<DashboardWrapper><AuctionConfigPage /></DashboardWrapper>} />
            <Route path="/dashboard/orders" element={<DashboardWrapper><OrdersPage /></DashboardWrapper>} />
            <Route path="/dashboard/cart" element={<DashboardWrapper><CartPage /></DashboardWrapper>} />
            <Route path="/dashboard/wallet" element={<DashboardWrapper><WalletPage /></DashboardWrapper>} />
            <Route path="/dashboard/profile" element={<DashboardWrapper><ProfilePage /></DashboardWrapper>} />
            <Route path="/dashboard/activity-logs" element={<DashboardWrapper><ActivityLogsPage /></DashboardWrapper>} />
            <Route path="/dashboard/roles" element={<DashboardWrapper><RolesPage /></DashboardWrapper>} />
            <Route path="/dashboard/users" element={<DashboardWrapper><UsersPage /></DashboardWrapper>} />
            <Route path="/dashboard/messages" element={<DashboardWrapper><MessagesPage /></DashboardWrapper>} />
            <Route path="/dashboard/site-config" element={<DashboardWrapper><SiteConfigPage /></DashboardWrapper>} />
            <Route path="/dashboard/reports" element={<DashboardWrapper><ReportsPage /></DashboardWrapper>} />
            <Route path="/dashboard/performance" element={<DashboardWrapper><PerformancePage /></DashboardWrapper>} />
            <Route path="/dashboard/notifications" element={<DashboardWrapper><NotificationsPage /></DashboardWrapper>} />
            <Route path="/dashboard/payments" element={<DashboardWrapper><PaymentMethodsPage /></DashboardWrapper>} />

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

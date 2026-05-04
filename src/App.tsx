import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { ShieldOff } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { siteApi } from './api';
import { AuthModalProvider } from './context/AuthModalContext';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
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

// ── Access-denied screen rendered inside the dashboard layout ────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-5">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldOff size={36} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-earth-900">Access Denied</h2>
        <p className="text-earth-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          You don't have permission to view this page.
          Contact your administrator to request access.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}

// ── Permission guard — rendered after auth is confirmed ──────────────────────
function PermissionGuard({
  permission,
  adminOnly,
  children,
}: {
  permission?: string;
  adminOnly?: boolean;
  children: React.ReactNode;
}) {
  const { hasPermission, isAdmin } = useAuth();
  if (adminOnly && !isAdmin()) return <AccessDenied />;
  if (permission && !hasPermission(permission)) return <AccessDenied />;
  return <>{children}</>;
}

// ── Dashboard wrapper — combines auth + layout + permission check ─────────────
function DashboardWrapper({
  children,
  permission,
  adminOnly,
}: {
  children: React.ReactNode;
  permission?: string;
  adminOnly?: boolean;
}) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PermissionGuard permission={permission} adminOnly={adminOnly}>
          {children}
        </PermissionGuard>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  useDynamicFavicon();
  return (
    <BrowserRouter>
      <ThemeProvider>
      <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
        <LoadingBar />
        <AuthModalProvider>
          <Routes>
            {/* ── Public — no login required ────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/artworks" element={<ArtworksPage />} />
            <Route path="/artworks/:uuid" element={<ArtworkDetailPage />} />
            <Route path="/auctions" element={<AuctionsPublicPage />} />
            <Route path="/auctions/:uuid" element={<AuctionDetailPublicPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* ── Auth — only pages reachable via emailed links ─────────── */}
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ── Dashboard — login required, permission-gated ──────────── */}

            {/* Always accessible to any logged-in user */}
            <Route path="/dashboard"         element={<DashboardWrapper><OverviewPage /></DashboardWrapper>} />
            <Route path="/dashboard/cart"    element={<DashboardWrapper><CartPage /></DashboardWrapper>} />
            <Route path="/dashboard/profile" element={<DashboardWrapper><ProfilePage /></DashboardWrapper>} />

            {/* Permission-gated pages */}
            <Route path="/dashboard/artworks"
              element={<DashboardWrapper permission="artworks.view_artwork"><DashArtworksPage /></DashboardWrapper>} />
            <Route path="/dashboard/categories"
              element={<DashboardWrapper permission="artworks.view_category"><CategoriesPage /></DashboardWrapper>} />
            <Route path="/dashboard/currencies"
              element={<DashboardWrapper permission="currencies.view_currency"><CurrenciesPage /></DashboardWrapper>} />
            <Route path="/dashboard/auctions"
              element={<DashboardWrapper permission="auctions.view_auction"><AuctionsPage /></DashboardWrapper>} />
            <Route path="/dashboard/auctions/:uuid"
              element={<DashboardWrapper permission="auctions.view_auction"><AuctionDetailPage /></DashboardWrapper>} />
            <Route path="/dashboard/auction-config"
              element={<DashboardWrapper permission="auctions.change_auctionconfig"><AuctionConfigPage /></DashboardWrapper>} />
            <Route path="/dashboard/orders"
              element={<DashboardWrapper permission="orders.view_order"><OrdersPage /></DashboardWrapper>} />
            <Route path="/dashboard/wallet"
              element={<DashboardWrapper permission="wallet.view_wallet"><WalletPage /></DashboardWrapper>} />
            <Route path="/dashboard/activity-logs"
              element={<DashboardWrapper permission="activity_logs.view_activitylog"><ActivityLogsPage /></DashboardWrapper>} />
            <Route path="/dashboard/users"
              element={<DashboardWrapper permission="accounts.view_user"><UsersPage /></DashboardWrapper>} />
            <Route path="/dashboard/messages"
              element={<DashboardWrapper permission="site_config.view_contactmessage"><MessagesPage /></DashboardWrapper>} />
            <Route path="/dashboard/reports"
              element={<DashboardWrapper permission="accounts.view_analytics"><ReportsPage /></DashboardWrapper>} />
            <Route path="/dashboard/performance"
              element={<DashboardWrapper permission="security.view_requestlog"><PerformancePage /></DashboardWrapper>} />
            <Route path="/dashboard/notifications"
              element={<DashboardWrapper permission="notifications.view_notificationlog"><NotificationsPage /></DashboardWrapper>} />

            {/* Admin-only pages */}
            <Route path="/dashboard/payments"
              element={<DashboardWrapper adminOnly><PaymentMethodsPage /></DashboardWrapper>} />
            <Route path="/dashboard/roles"
              element={<DashboardWrapper adminOnly><RolesPage /></DashboardWrapper>} />
            <Route path="/dashboard/site-config"
              element={<DashboardWrapper adminOnly><SiteConfigPage /></DashboardWrapper>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthModalProvider>
        </ToastProvider>
      </AuthProvider>
      </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

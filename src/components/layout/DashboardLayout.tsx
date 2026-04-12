import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Image, Tag, DollarSign, Gavel, ShoppingBag,
  Package, User, Wallet, ClipboardList, LogOut, Menu, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../api';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  permission?: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: 'Overview',       icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Artworks',       icon: Image,           to: '/dashboard/artworks',      permission: 'artworks.view_artwork' },
  { label: 'Categories',     icon: Tag,             to: '/dashboard/categories',    permission: 'artworks.view_category' },
  { label: 'Currencies',     icon: DollarSign,      to: '/dashboard/currencies',    permission: 'currencies.view_currency' },
  { label: 'Auctions',       icon: Gavel,           to: '/dashboard/auctions' },
  { label: 'Orders',         icon: Package,         to: '/dashboard/orders' },
  { label: 'Cart',           icon: ShoppingBag,     to: '/dashboard/cart' },
  { label: 'Wallet',         icon: Wallet,          to: '/dashboard/wallet' },
  { label: 'Profile',        icon: User,            to: '/dashboard/profile' },
  { label: 'Activity Logs',  icon: ClipboardList,   to: '/dashboard/activity-logs', permission: 'activity_logs.view_activitylog' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    profileApi.get()
      .then(res => setAvatarUrl(res.data.avatar_url || null))
      .catch(() => {});
  }, [user?.uuid]);

  const visibleNav = navItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-earth-100">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">AS</div>
          <span className="font-bold text-earth-900">AfriStudio</span>
        </Link>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-earth-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-earth-200">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.name}
                className="w-full h-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : (
              <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-earth-900 truncate">{user?.name}</p>
            <p className="text-xs text-earth-500 truncate">{user?.roles?.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700 border border-primary-100'
                  : 'text-earth-600 hover:bg-earth-50 hover:text-earth-900'
              }`}
            >
              <Icon size={18} className={active ? 'text-primary-600' : 'text-earth-400'} />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto text-primary-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-earth-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-earth-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-earth-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white h-full shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-earth-100 px-4 lg:px-6 py-4 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden p-2 hover:bg-earth-100 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} className="text-earth-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-earth-900 capitalize">
              {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          <Link to="/" className="text-sm text-earth-500 hover:text-earth-700 transition-colors">
            ← Back to site
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

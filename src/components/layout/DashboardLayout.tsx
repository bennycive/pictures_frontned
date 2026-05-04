import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Image, Tag, DollarSign, Gavel, ShoppingBag,
  Package, User, Wallet, ClipboardList, LogOut, Menu, ChevronRight,
  Shield, Users, Settings2, Inbox, BarChart2, Activity, Bell,
  Zap, X, SlidersHorizontal, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileApi, siteApi, cartApi } from '../../api';
import { Logo } from '../ui/Logo';
import { LanguageSelector } from '../ui/LanguageSelector';

/* ─── Quick-Access Floating Radial FAB ───────────────────────────────────── */

const FAB_ITEMS_BASE = [
  { label: 'Auctions',  icon: Gavel,    to: '/dashboard/auctions',      grad: 'from-primary-600 to-primary-400', permission: 'auctions.view_auction' },
  { label: 'Artworks',  icon: Image,    to: '/dashboard/artworks',      grad: 'from-blue-500    to-cyan-400',    permission: 'artworks.view_artwork' },
  { label: 'Orders',    icon: Package,  to: '/dashboard/orders',        grad: 'from-emerald-500 to-teal-400',    permission: 'orders.view_order' },
  { label: 'Wallet',    icon: Wallet,   to: '/dashboard/wallet',        grad: 'from-violet-500  to-purple-400',  permission: 'wallet.view_wallet' },
  { label: 'Activity',  icon: Activity, to: '/dashboard/activity-logs', grad: 'from-amber-500   to-orange-400',  permission: 'activity_logs.view_activitylog' },
];

const FAB_R = 100; // ring radius px

/** Compute start/end arc angles based on which screen quadrant the FAB sits in */
function arcAngles(x: number, y: number): [number, number] {
  const cx = window.innerWidth  / 2;
  const cy = window.innerHeight / 2;
  if (x >= cx && y >= cy) return [90,  180]; // bottom-right → up-left
  if (x <  cx && y >= cy) return [0,    90]; // bottom-left  → up-right
  if (x >= cx && y <  cy) return [180, 270]; // top-right    → down-left
  return [270, 360];                          // top-left     → down-right
}

function QuickFAB() {
  const { isAdmin, hasPermission } = useAuth();

  const items = [
    ...FAB_ITEMS_BASE.filter(item => !item.permission || hasPermission(item.permission)),
    isAdmin()
      ? { label: 'Notifications', icon: Bell, to: '/dashboard/notifications', grad: 'from-red-500   to-rose-400',   permission: undefined }
      : { label: 'Profile',       icon: User, to: '/dashboard/profile',       grad: 'from-sky-500  to-indigo-400',  permission: undefined },
  ];

  /* ── position state (top-left coords of FAB center) ── */
  const [pos, setPos] = useState(() => ({
    x: window.innerWidth  - 80,
    y: window.innerHeight - 80,
  }));
  const [open,     setOpen]     = useState(false);
  const [dragging, setDragging] = useState(false);

  const dragRef  = useRef<{ sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  /* Escape to close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  /* ── drag: attach to the main button ── */
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y, moved: false };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.sx;
    const dy = e.clientY - dragRef.current.sy;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
    setPos({
      x: Math.max(8, Math.min(window.innerWidth  - 60, dragRef.current.px + dx)),
      y: Math.max(8, Math.min(window.innerHeight - 60, dragRef.current.py + dy)),
    });
  };

  const onPointerUp = () => {
    const wasDrag = dragRef.current?.moved ?? false;
    dragRef.current = null;
    setDragging(false);
    if (!wasDrag) setOpen(v => !v); // click only when not dragging
  };

  /* ── hover open / delayed close (mouse only — ignore touch simulated events) ── */
  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    clearTimeout(leaveTimer.current);
    setOpen(true);
  };
  const onLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    leaveTimer.current = setTimeout(() => setOpen(false), 280);
  };

  /* Arc geometry */
  const [arcStart, arcEnd] = arcAngles(pos.x, pos.y);
  const total = items.length;

  return createPortal(
    <div
      ref={containerRef}
      className="select-none"
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 50, width: 56, height: 56 }}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >

      {/* ── Ring items ─────────────────────────────────── */}
      {items.map((item, i) => {
        const angleDeg = arcStart + (i / (total - 1)) * (arcEnd - arcStart);
        const rad      = angleDeg * (Math.PI / 180);
        const tx = open ? Math.cos(rad) * FAB_R : 0;
        const ty = open ? Math.sin(rad) * FAB_R : 0;
        const openDelay  = i * 50;
        const closeDelay = (total - 1 - i) * 35;

        /* Label placement: always point toward screen center */
        const labelRight = pos.x > window.innerWidth / 2; // button on right → label on left

        return (
          <div
            key={item.label}
            className="absolute group"
            style={{
              /* center of ring items on FAB center */
              left: '50%', top: '50%',
              transform: open
                ? `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`
                : 'translate(-50%, -50%)',
              opacity:      open ? 1 : 0,
              pointerEvents: open ? 'auto' : 'none',
              transition: `transform 0.38s cubic-bezier(0.34,1.56,0.64,1) ${open ? openDelay : closeDelay}ms,
                           opacity  0.25s ease           ${open ? openDelay : closeDelay}ms`,
              zIndex: 1,
            }}
            /* bump z on hover so hovered item renders above siblings */
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.zIndex = '10'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.zIndex = '1';  }}
          >
            {/* ── Tooltip label ── */}
            <span
              className={`
                absolute whitespace-nowrap pointer-events-none
                bg-earth-900/95 text-white text-xs font-semibold
                px-3 py-1.5 rounded-xl shadow-xl
                opacity-0 group-hover:opacity-100
                scale-90 group-hover:scale-100
                transition-all duration-200
                ${labelRight ? 'right-[calc(100%+10px)]' : 'left-[calc(100%+10px)]'}
                top-1/2 -translate-y-1/2
              `}
            >
              {item.label}
              {/* caret */}
              <span className={`absolute top-1/2 -translate-y-1/2 w-0 h-0
                border-y-[5px] border-y-transparent
                ${labelRight
                  ? '-right-[8px] border-l-[8px] border-l-earth-900/95'
                  : '-left-[8px]  border-r-[8px] border-r-earth-900/95'}
              `} />
            </span>

            {/* ── Icon button ── */}
            <Link
              to={item.to}
              onClick={() => setOpen(false)}
              className={`
                w-11 h-11 rounded-full bg-gradient-to-br ${item.grad}
                flex items-center justify-center
                shadow-lg ring-2 ring-white/50
                transition-all duration-200
                group-hover:w-14 group-hover:h-14
                group-hover:shadow-2xl group-hover:ring-4 group-hover:ring-white/70
                active:scale-90
              `}
            >
              <item.icon
                size={17}
                className="text-white transition-all duration-200 group-hover:scale-110"
              />
            </Link>
          </div>
        );
      })}

      {/* ── Main FAB ───────────────────────────────────── */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`
          relative w-14 h-14 rounded-full
          bg-gradient-to-br from-primary-700 to-primary-500
          shadow-xl ring-4 ring-primary-300/50
          flex items-center justify-center
          transition-all duration-200
          hover:shadow-2xl hover:ring-primary-300/80
          active:scale-90
          ${dragging ? 'cursor-grabbing scale-110 shadow-2xl' : 'cursor-grab'}
          ${open && !dragging ? 'ring-primary-400/70' : ''}
        `}
        title={open ? 'Close' : 'Quick Access'}
        style={{ zIndex: 2, touchAction: 'none' }}
      >
        <Zap size={22} className={`text-white absolute transition-all duration-300 ${open ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
        <X   size={22} className={`text-white absolute transition-all duration-300 ${open ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90'}`} />

        {/* Pulse ring when closed */}
        {!open && !dragging && (
          <span className="absolute inset-0 rounded-full bg-primary-400/30 animate-ping" />
        )}
      </button>

      {/* ── "Quick Access" badge on hover when closed ── */}
      {!open && (
        <span
          className={`
            absolute top-1/2 -translate-y-1/2 pointer-events-none
            bg-earth-900/90 text-white text-[11px] font-semibold
            px-2.5 py-1 rounded-lg whitespace-nowrap shadow-lg
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            ${pos.x > window.innerWidth / 2 ? 'right-[calc(100%+10px)]' : 'left-[calc(100%+10px)]'}
          `}
        >
          Quick Access
        </span>
      )}
    </div>,
    document.body
  );
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
  permission?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  // ── Always visible ─────────────────────────────────────────────────────────
  { label: 'Overview', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Cart',     icon: ShoppingBag,     to: '/dashboard/cart' },
  { label: 'Profile',  icon: User,            to: '/dashboard/profile' },

  // ── Permission-gated — visible when the user's role grants the permission ──
  { label: 'Artworks',       icon: Image,           to: '/dashboard/artworks',       permission: 'artworks.view_artwork' },
  { label: 'Categories',     icon: Tag,             to: '/dashboard/categories',     permission: 'artworks.view_category' },
  { label: 'Currencies',     icon: DollarSign,      to: '/dashboard/currencies',     permission: 'currencies.view_currency' },
  { label: 'Auctions',       icon: Gavel,           to: '/dashboard/auctions',       permission: 'auctions.view_auction' },
  { label: 'Auction Config', icon: SlidersHorizontal, to: '/dashboard/auction-config', permission: 'auctions.change_auctionconfig' },
  { label: 'Orders',         icon: Package,         to: '/dashboard/orders',         permission: 'orders.view_order' },
  { label: 'Wallet',         icon: Wallet,          to: '/dashboard/wallet',         permission: 'wallet.view_wallet' },
  { label: 'Activity Logs',  icon: ClipboardList,   to: '/dashboard/activity-logs',  permission: 'activity_logs.view_activitylog' },
  { label: 'Users',          icon: Users,           to: '/dashboard/users',          permission: 'accounts.view_user' },
  { label: 'Messages',       icon: Inbox,           to: '/dashboard/messages',       permission: 'site_config.view_contactmessage' },
  { label: 'Reports',        icon: BarChart2,       to: '/dashboard/reports',        permission: 'accounts.view_analytics' },
  { label: 'Performance',    icon: Activity,        to: '/dashboard/performance',    permission: 'security.view_requestlog' },
  { label: 'Notifications',  icon: Bell,            to: '/dashboard/notifications',  permission: 'notifications.view_notificationlog' },

  // ── Hard admin-only — never delegatable via role permissions ───────────────
  { label: 'Payments',    icon: CreditCard, to: '/dashboard/payments',    adminOnly: true },
  { label: 'Roles',       icon: Shield,     to: '/dashboard/roles',       adminOnly: true },
  { label: 'Site Config', icon: Settings2,  to: '/dashboard/site-config', adminOnly: true },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    profileApi.get()
      .then(res => setAvatarUrl(res.data.avatar_url || null))
      .catch(() => {});
    cartApi.get()
      .then(res => setCartCount(res.data.items?.length ?? 0))
      .catch(() => {});
  }, [user?.uuid]);

  useEffect(() => {
    if (!isAdmin()) return;
    const fetchCount = () =>
      siteApi.getUnreadCount()
        .then(res => setUnreadCount(res.data.count))
        .catch(() => {});
    fetchCount();
    // Refresh every 60 s while the dashboard is open
    const t = setInterval(fetchCount, 60_000);
    return () => clearInterval(t);
  }, [user?.uuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleNav = navItems.filter(item => {
    if (item.adminOnly && !isAdmin()) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isNavActive = (to: string) => {
    if (to === '/dashboard') return location.pathname === to;
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-earth-100">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="dark" className="h-8 w-auto" />
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
          const active = isNavActive(item.to);
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
              {item.to === '/dashboard/messages' && unreadCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-green-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              {item.to === '/dashboard/cart' && cartCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              {active && item.to !== '/dashboard/messages' && item.to !== '/dashboard/cart' && (
                <ChevronRight size={14} className="ml-auto text-primary-400" />
              )}
              {active && item.to === '/dashboard/messages' && unreadCount === 0 && (
                <ChevronRight size={14} className="ml-auto text-primary-400" />
              )}
              {active && item.to === '/dashboard/cart' && cartCount === 0 && (
                <ChevronRight size={14} className="ml-auto text-primary-400" />
              )}
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
          <LanguageSelector />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Floating Quick-Access ring — visible on every dashboard page */}
      <QuickFAB />
    </div>
  );
}

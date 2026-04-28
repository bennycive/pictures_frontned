import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, Tag, Gavel, Package, Wallet, ArrowRight,
  ShoppingBag, Users, Bell, Mail, CheckCircle2, XCircle,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  artworksApi, categoriesApi, auctionsApi, ordersApi,
  walletApi, adminUsersApi, notificationsApi, siteApi,
  activityLogsApi, profileApi,
} from '../../api';
import type { Auction, Order, ActivityLog } from '../../api/types';
import { StatusBadge } from '../../components/ui/Badge';
import { SectionSpinner } from '../../components/ui/Spinner';
import { Logo } from '../../components/ui/Logo';

/* ─── helpers ──────────────────────────────────────────────────────── */

function fmt(v: string | number): string {
  const n = Number(v);
  if (isNaN(n)) return String(v);
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── StatCard ─────────────────────────────────────────────────────── */
/*
  Design: white card, thin 3-px gradient top strip, icon badge top-right,
  big number bottom-left, label + optional sub below. Clean hover lift.
*/
function StatCard({ icon: Icon, label, value, strip, iconCls, sub, to }: {
  icon: React.ElementType; label: string; value: string | number;
  strip: string; iconCls: string; sub?: string; to: string;
}) {
  return (
    <Link to={to}
      className="group relative bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* gradient accent strip */}
      <div className={`h-[3px] w-full ${strip}`} />

      <div className="px-4 py-3.5 flex items-center gap-3">
        {/* icon */}
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
          <Icon size={16} />
        </div>

        {/* value + label */}
        <div className="flex-1 min-w-0">
          <p className="text-xl font-extrabold text-earth-900 dark:text-earth-100 tabular-nums leading-none">{value}</p>
          <p className="text-[11px] font-medium text-earth-500 dark:text-earth-400 mt-0.5 truncate">{label}</p>
          {sub && (
            <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              sub.includes('failed') && !sub.startsWith('0')
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : sub.includes('all read')
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-earth-100 text-earth-500 dark:bg-earth-700 dark:text-earth-400'
            }`}>{sub}</span>
          )}
        </div>

        {/* hover arrow */}
        <ArrowRight size={13} className="text-earth-200 dark:text-earth-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Link>
  );
}

/* ─── SectionHeader ────────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, to, badge }: {
  icon: React.ElementType; title: string; to: string; badge?: number;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-earth-100 dark:border-earth-700 bg-earth-50/60 dark:bg-earth-900/30">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <Icon size={13} className="text-primary-600 dark:text-primary-400" />
        </div>
        <span className="text-sm font-semibold text-earth-900 dark:text-earth-100">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold bg-primary-600 text-white">{badge}</span>
        )}
      </div>
      <Link to={to} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
        View all <ArrowRight size={11} />
      </Link>
    </div>
  );
}

/* ─── EmptyState ───────────────────────────────────────────────────── */
function EmptyState({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center py-14 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-earth-50 dark:bg-earth-700 flex items-center justify-center">
        <Icon size={22} className="text-earth-300 dark:text-earth-600" />
      </div>
      <p className="text-sm text-earth-400">{label}</p>
    </div>
  );
}

/* ─── types ────────────────────────────────────────────────────────── */
interface DashStats {
  artworks: number; categories: number; auctions: number; orders: number;
  users: number; notifSent: number; notifFailed: number; unreadMessages: number;
}

/* ─── OverviewPage ─────────────────────────────────────────────────── */
export function OverviewPage() {
  const { user, hasPermission, isAdmin } = useAuth();

  const isStaff = user?.is_staff ?? false;
  const isPriv  = isAdmin() || isStaff;

  const [stats, setStats]                   = useState<DashStats>({
    artworks: 0, categories: 0, auctions: 0, orders: 0,
    users: 0, notifSent: 0, notifFailed: 0, unreadMessages: 0,
  });
  const [recentAuctions, setRecentAuctions] = useState<Auction[]>([]);
  const [recentOrders,   setRecentOrders]   = useState<Order[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [walletBalance,  setWalletBalance]  = useState<string | null>(null);
  const [avatarUrl,      setAvatarUrl]      = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const t: Promise<unknown>[] = [];

    t.push(profileApi.get().then(r => setAvatarUrl(r.data.avatar_url || null)).catch(() => null));
    t.push(walletApi.get().then(r => setWalletBalance(r.data.balance)).catch(() => null));

    if (hasPermission('artworks.view_artwork'))
      t.push(artworksApi.list().then(r => setStats(s => ({ ...s, artworks: r.data.count }))).catch(() => null));

    if (hasPermission('artworks.view_category'))
      t.push(categoriesApi.list().then(r => setStats(s => ({ ...s, categories: r.data.count }))).catch(() => null));

    t.push(auctionsApi.list().then(r => {
      const d = r.data as Auction[];
      setStats(s => ({ ...s, auctions: d.length }));
      setRecentAuctions(d.slice(0, 6));
    }).catch(() => null));

    t.push(ordersApi.list().then(r => {
      const d = r.data as Order[];
      setStats(s => ({ ...s, orders: d.length }));
      setRecentOrders(d.slice(0, 6));
    }).catch(() => null));

    if (isPriv) {
      t.push(adminUsersApi.list().then(r => setStats(s => ({ ...s, users: r.data.length }))).catch(() => null));
      t.push(notificationsApi.list().then(r => {
        const logs = r.data;
        setStats(s => ({
          ...s,
          notifSent:   logs.filter(l => l.status === 'sent').length,
          notifFailed: logs.filter(l => l.status === 'failed').length,
        }));
      }).catch(() => null));
      t.push(siteApi.getUnreadCount().then(r => setStats(s => ({ ...s, unreadMessages: r.data.count }))).catch(() => null));
      t.push(activityLogsApi.list({ limit: 8 }).then(r => setRecentActivity(r.data.results.slice(0, 8))).catch(() => null));
    }

    Promise.allSettled(t).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <SectionSpinner size="lg" />;

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const roles     = user?.roles ?? [];

  /* ── stat card definitions ────────── */
  const cards = [
    hasPermission('artworks.view_artwork') && {
      icon: Image, label: 'Artworks', value: stats.artworks,
      strip: 'bg-gradient-to-r from-blue-500 to-cyan-400',
      iconCls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      to: '/dashboard/artworks',
    },
    hasPermission('artworks.view_category') && {
      icon: Tag, label: 'Categories', value: stats.categories,
      strip: 'bg-gradient-to-r from-violet-500 to-purple-400',
      iconCls: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
      to: '/dashboard/categories',
    },
    {
      icon: Gavel, label: 'Auctions', value: stats.auctions,
      strip: 'bg-gradient-to-r from-primary-600 to-primary-400',
      iconCls: 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
      to: '/dashboard/auctions',
    },
    {
      icon: ShoppingBag, label: 'My Orders', value: stats.orders,
      strip: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      iconCls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
      to: '/dashboard/orders',
    },
    isPriv && {
      icon: Users, label: 'Users', value: stats.users,
      strip: 'bg-gradient-to-r from-sky-500 to-indigo-400',
      iconCls: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
      to: '/dashboard/users',
    },
    isPriv && {
      icon: Bell, label: 'Notifications', value: stats.notifSent + stats.notifFailed,
      sub: `${stats.notifFailed} failed`,
      strip: stats.notifFailed > 0
        ? 'bg-gradient-to-r from-red-500 to-orange-400'
        : 'bg-gradient-to-r from-amber-500 to-yellow-400',
      iconCls: stats.notifFailed > 0
        ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      to: '/dashboard/notifications',
    },
    isPriv && {
      icon: Mail, label: 'Messages', value: stats.unreadMessages,
      sub: stats.unreadMessages > 0 ? `${stats.unreadMessages} unread` : 'all read',
      strip: stats.unreadMessages > 0
        ? 'bg-gradient-to-r from-rose-500 to-pink-400'
        : 'bg-gradient-to-r from-teal-500 to-cyan-400',
      iconCls: stats.unreadMessages > 0
        ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400'
        : 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
      to: '/dashboard/messages',
    },
  ].filter(Boolean) as {
    icon: React.ElementType; label: string; value: number;
    strip: string; iconCls: string; sub?: string; to: string;
  }[];


  /* ── activity event color ────────── */
  const eventColor = (event?: string | null) => {
    if (!event) return 'bg-earth-300 dark:bg-earth-600';
    const e = event.toLowerCase();
    if (e.includes('create')) return 'bg-emerald-400';
    if (e.includes('delete')) return 'bg-red-400';
    if (e.includes('update')) return 'bg-amber-400';
    return 'bg-primary-400';
  };

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-earth-700 text-white shadow-xl">
        {/* decorative rings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
          <div className="absolute -top-8  -right-8  w-40 h-40 rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/5" />
        </div>

        <div className="relative px-6 py-7 sm:px-8 sm:py-8 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">

          {/* Identity */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30 shadow-lg shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Logo size={34} variant="light" showText={false} />
              </div>
            )}
            <div>
              <p className="text-primary-200 text-xs font-medium tracking-wide uppercase">Welcome back</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5 leading-tight">{firstName}</h1>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {roles.length > 0
                  ? roles.map(r => (
                      <span key={r} className="text-[11px] font-semibold bg-white/20 border border-white/15 text-white/90 px-2.5 py-0.5 rounded-full backdrop-blur-sm">{r}</span>
                    ))
                  : <span className="text-[11px] text-primary-200 font-medium">Member</span>
                }
              </div>
            </div>
          </div>

          {/* Wallet tile */}
          {walletBalance !== null && (
            <Link to="/dashboard/wallet"
              className="group flex flex-col gap-1 bg-white/10 hover:bg-white/18 active:bg-white/25 border border-white/20 rounded-2xl px-6 py-5 transition-all backdrop-blur-sm shrink-0 min-w-[180px]">
              <div className="flex items-center gap-1.5 text-primary-200 text-xs font-medium">
                <Wallet size={11} /> Wallet Balance
              </div>
              <p className="text-3xl font-extrabold text-white tabular-nums leading-tight">{fmt(walletBalance)}</p>
              <div className="flex items-center gap-1 text-primary-200 text-xs mt-0.5 group-hover:text-white transition-colors">
                Manage wallet <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )}
        </div>

        {/* Failure alert strip */}
        {isPriv && stats.notifFailed > 0 && (
          <div className="relative mx-6 mb-5 sm:mx-8 flex items-center gap-2.5 bg-red-500/25 border border-red-300/30 rounded-xl px-4 py-2.5 text-sm backdrop-blur-sm">
            <XCircle size={14} className="text-red-300 shrink-0" />
            <span className="text-red-100">{stats.notifFailed} notification{stats.notifFailed > 1 ? 's' : ''} failed.</span>
            <Link to="/dashboard/notifications" className="ml-auto text-xs text-red-200 hover:text-white font-semibold underline-offset-2 hover:underline">
              Review →
            </Link>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          STAT CARDS  — 3 per row
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ════════════════════════════════════════════════════
          RECENT — AUCTIONS + ORDERS
      ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Auctions */}
        <div className="bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 shadow-sm overflow-hidden">
          <SectionHeader icon={Gavel} title="Recent Auctions" to="/dashboard/auctions" badge={recentAuctions.filter(a => a.status === 'live').length} />
          {recentAuctions.length === 0
            ? <EmptyState icon={Gavel} label="No auctions yet" />
            : (
              <div className="divide-y divide-earth-50 dark:divide-earth-700/60">
                {recentAuctions.map(a => (
                  <Link key={a.uuid} to="/dashboard/auctions"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-earth-50 dark:hover:bg-earth-700/40 transition-colors group">
                    {/* thumbnail */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-earth-100 dark:bg-earth-700 ring-1 ring-earth-200 dark:ring-earth-600">
                      {a.artwork_image
                        ? <img src={a.artwork_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><Gavel size={14} className="text-earth-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-earth-900 dark:text-earth-100 truncate">{a.artwork_name}</p>
                      <p className="text-xs text-earth-500 font-mono mt-0.5">
                        {a.currency} {Number(a.current_price || a.start_price).toLocaleString()}
                        {a.total_bids > 0 && (
                          <span className="ml-2 text-primary-500 font-sans">{a.total_bids} bid{a.total_bids !== 1 ? 's' : ''}</span>
                        )}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                ))}
              </div>
            )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 shadow-sm overflow-hidden">
          <SectionHeader icon={ShoppingBag} title="Recent Orders" to="/dashboard/orders" />
          {recentOrders.length === 0
            ? <EmptyState icon={ShoppingBag} label="No orders yet" />
            : (
              <div className="divide-y divide-earth-50 dark:divide-earth-700/60">
                {recentOrders.map(o => (
                  <Link key={o.uuid} to="/dashboard/orders"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-earth-50 dark:hover:bg-earth-700/40 transition-colors">
                    {/* avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-earth-100 to-earth-200 dark:from-earth-700 dark:to-earth-600 flex items-center justify-center shrink-0 ring-1 ring-earth-200 dark:ring-earth-600">
                      <Package size={15} className="text-earth-500 dark:text-earth-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-earth-900 dark:text-earth-100 font-mono">#{o.uuid.slice(0, 8)}</p>
                      <p className="text-xs text-earth-500 mt-0.5">
                        {o.currency || 'USD'} {Number(o.total).toLocaleString()} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          ACTIVITY TIMELINE  (admin / staff only)
      ════════════════════════════════════════════════════ */}
      {isPriv && (
        <div className="bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 shadow-sm overflow-hidden">
          <SectionHeader icon={Activity} title="Recent Activity" to="/dashboard/activity-logs" />
          {recentActivity.length === 0
            ? <EmptyState icon={Activity} label="No recent activity" />
            : (
              <div className="px-5 py-4 space-y-0">
                {recentActivity.map((log, i) => (
                  <div key={log.id} className="flex gap-3">
                    {/* timeline spine */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ring-2 ring-white dark:ring-earth-800 ${eventColor(log.event)}`} />
                      {i < recentActivity.length - 1 && (
                        <div className="w-px flex-1 bg-earth-100 dark:bg-earth-700 my-1" />
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 ${i < recentActivity.length - 1 ? 'pb-4' : ''}`}>
                      <p className="text-sm text-earth-800 dark:text-earth-200 leading-snug">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {log.causer_name && (
                          <span className="text-[11px] font-medium text-earth-600 dark:text-earth-400">{log.causer_name}</span>
                        )}
                        {log.event && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide bg-earth-100 dark:bg-earth-700 text-earth-500 dark:text-earth-400 px-1.5 py-0.5 rounded">{log.event}</span>
                        )}
                        <span className="text-[11px] text-earth-400 ml-auto">{ago(log.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          NOTIFICATION SUMMARY  (admin / staff only)
      ════════════════════════════════════════════════════ */}
      {isPriv && (stats.notifSent + stats.notifFailed > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Sent */}
          <Link to="/dashboard/notifications"
            className="group flex items-center gap-4 bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 p-5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-l-2xl" />
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-extrabold text-earth-900 dark:text-earth-100 tabular-nums">{stats.notifSent}</p>
              <p className="text-xs text-earth-500 mt-0.5">Notifications Sent</p>
            </div>
            <ArrowRight size={14} className="text-earth-300 group-hover:text-emerald-500 transition-colors" />
          </Link>

          {/* Failed */}
          <Link to="/dashboard/notifications"
            className={`group flex items-center gap-4 bg-white dark:bg-earth-800 rounded-2xl border p-5 hover:shadow-md transition-all overflow-hidden relative ${
              stats.notifFailed > 0
                ? 'border-red-100 dark:border-red-900/40 hover:border-red-300'
                : 'border-earth-100 dark:border-earth-700'
            }`}>
            <div className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${stats.notifFailed > 0 ? 'bg-gradient-to-b from-red-400 to-rose-400' : 'bg-earth-200 dark:bg-earth-600'}`} />
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${stats.notifFailed > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-earth-50 dark:bg-earth-700'}`}>
              <XCircle size={22} className={stats.notifFailed > 0 ? 'text-red-500' : 'text-earth-400'} />
            </div>
            <div className="flex-1">
              <p className={`text-2xl font-extrabold tabular-nums ${stats.notifFailed > 0 ? 'text-red-600 dark:text-red-400' : 'text-earth-900 dark:text-earth-100'}`}>
                {stats.notifFailed}
              </p>
              <p className="text-xs text-earth-500 mt-0.5">Notifications Failed</p>
            </div>
            <ArrowRight size={14} className={`transition-colors ${stats.notifFailed > 0 ? 'text-red-300 group-hover:text-red-500' : 'text-earth-300'}`} />
          </Link>
        </div>
      )}


    </div>
  );
}

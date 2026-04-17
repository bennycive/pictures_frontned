import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Image, Tag, Gavel, Package, Wallet, TrendingUp, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { artworksApi, categoriesApi, auctionsApi, ordersApi, walletApi } from '../../api';
import type { Auction, Order } from '../../api/types';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

function formatBalance(value: string | number): string {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(2) + 'M';
  if (num >= 1_000)         return (num / 1_000).toFixed(2) + 'K';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({ icon: Icon, label, value, color, to, isBalance }: { icon: React.ElementType; label: string; value: string | number; color: string; to: string; isBalance?: boolean }) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-earth-100 p-4 sm:p-6 flex items-center gap-3 hover:shadow-md transition-shadow min-w-0">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-bold text-earth-900 truncate">
          {isBalance ? formatBalance(value) : value}
        </p>
        <p className="text-xs sm:text-sm text-earth-500 truncate">{label}</p>
      </div>
    </Link>
  );
}

export function OverviewPage() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState({ artworks: 0, categories: 0, auctions: 0 });
  const [recentAuctions, setRecentAuctions] = useState<Auction[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tasks: Promise<unknown>[] = [];

    if (hasPermission('artworks.view_artwork')) {
      tasks.push(artworksApi.list().then(r => setStats(s => ({ ...s, artworks: r.data.count }))));
    }
    if (hasPermission('artworks.view_category')) {
      tasks.push(categoriesApi.list().then(r => setStats(s => ({ ...s, categories: r.data.count }))));
    }

    tasks.push(
      auctionsApi.list().then(r => {
        const data = r.data as Auction[];
        setStats(s => ({ ...s, auctions: data.length }));
        setRecentAuctions(data.slice(0, 5));
      }),
      ordersApi.list().then(r => setRecentOrders((r.data as Order[]).slice(0, 5))),
      walletApi.get().then(r => setWalletBalance(r.data.balance)),
    );

    Promise.allSettled(tasks).finally(() => setLoading(false));
  }, [hasPermission]);

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-700 to-earth-700 text-white rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}!</h2>
        <p className="text-primary-100 text-sm">{user?.roles?.join(' · ')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {hasPermission('artworks.view_artwork') && (
          <StatCard icon={Image} label="Total Artworks" value={stats.artworks} color="bg-blue-500" to="/dashboard/artworks" />
        )}
        {hasPermission('artworks.view_category') && (
          <StatCard icon={Tag} label="Categories" value={stats.categories} color="bg-purple-500" to="/dashboard/categories" />
        )}
        <StatCard icon={Gavel} label="Auctions" value={stats.auctions} color="bg-primary-600" to="/dashboard/auctions" />
        {walletBalance !== null && (
          <StatCard icon={Wallet} label="Wallet Balance" value={walletBalance} color="bg-green-500" to="/dashboard/wallet" isBalance />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Auctions */}
        <div className="bg-white rounded-xl border border-earth-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-earth-900">Recent Auctions</h3>
            <Link to="/dashboard/auctions" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {recentAuctions.length === 0 ? (
            <p className="text-earth-400 text-sm text-center py-6">No auctions yet</p>
          ) : (
            <div className="space-y-3">
              {recentAuctions.map(a => (
                <Link key={a.uuid} to={`/dashboard/auctions/${a.uuid}`} className="flex items-center gap-3 p-3 hover:bg-earth-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-earth-100 rounded-lg overflow-hidden shrink-0">
                    {a.artwork_image && <img src={a.artwork_image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-900 truncate">{a.artwork_name}</p>
                    <p className="text-xs text-earth-500">{a.currency} {a.current_price || a.start_price}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-earth-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-earth-900">Recent Orders</h3>
            <Link to="/dashboard/orders" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-earth-400 text-sm text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(o => (
                <Link key={o.uuid} to="/dashboard/orders" className="flex items-center gap-3 p-3 hover:bg-earth-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-earth-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package size={18} className="text-earth-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-900">Order #{o.uuid.slice(0, 8)}</p>
                    <p className="text-xs text-earth-500">{o.currency} {o.total}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Auctions', icon: Gavel, to: '/auctions', color: 'text-primary-600 bg-primary-50' },
          { label: 'Artworks', icon: Image, to: '/artworks', color: 'text-blue-600 bg-blue-50' },
          { label: 'Orders', icon: Package, to: '/dashboard/orders', color: 'text-purple-600 bg-purple-50' },
          { label: 'Wallet', icon: Wallet, to: '/dashboard/wallet', color: 'text-green-600 bg-green-50' },
          { label: 'Activity', icon: TrendingUp, to: '/dashboard/activity-logs', color: 'text-orange-600 bg-orange-50' },
          { label: 'History', icon: Clock, to: '/dashboard/orders', color: 'text-gray-600 bg-gray-50' },
        ].map(q => (
          <Link key={q.label} to={q.to} className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-earth-100 hover:shadow-sm transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${q.color}`}>
              <q.icon size={18} />
            </div>
            <span className="text-xs font-medium text-earth-700">{q.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

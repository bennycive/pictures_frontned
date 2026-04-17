import { useEffect, useState, useCallback } from 'react';
import { Eye, ShoppingBag, Users, Palette } from 'lucide-react';
import { ordersApi } from '../../api';
import type { Order } from '../../api/types';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

type ViewTab = 'mine' | 'all' | 'artist';

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export function OrdersPage() {
  const { user, hasPermission, hasRole, isAdmin } = useAuth();
  const { error } = useToast();

  const isPrivileged = isAdmin() || hasRole('Moderator');
  const isArtist = hasRole('Artist');
  const canUpdateStatus = hasPermission('orders.change_order');

  // Determine which tabs are available
  const tabs: { key: ViewTab; label: string; icon: typeof ShoppingBag }[] = [
    { key: 'mine', label: 'My Orders', icon: ShoppingBag },
    ...(isPrivileged ? [{ key: 'all' as ViewTab, label: 'All Orders', icon: Users }] : []),
    ...(isArtist && !isPrivileged ? [{ key: 'artist' as ViewTab, label: 'Artwork Orders', icon: Palette }] : []),
  ];

  const defaultTab: ViewTab = isPrivileged ? 'all' : 'mine';
  const [activeTab, setActiveTab] = useState<ViewTab>(defaultTab);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async (tab: ViewTab) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (tab === 'mine' && isPrivileged && user?.uuid) {
        // Privileged users see all by default; filter to own orders by uuid
        params.user_uuid = user.uuid;
      }
      if (tab === 'artist') params.artist = true;
      // tab === 'all' sends no extra params — backend returns all for privileged roles
      const { data } = await ordersApi.list(params);
      setOrders(data as Order[]);
    } catch {
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [error, isPrivileged, user?.uuid]);

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    setSelected(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(selected.uuid, newStatus);
      swal.success('Order status updated');
      setStatusModal(false);
      load(activeTab);
    } catch {
      error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  // Whether to show a buyer column (not relevant for "mine" tab)
  const showBuyer = activeTab !== 'mine';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">Orders</h1>
        <p className="text-sm text-earth-500 mt-0.5">
          {activeTab === 'all' && 'All orders across the platform'}
          {activeTab === 'mine' && 'Orders you have placed'}
          {activeTab === 'artist' && 'Orders containing your artworks'}
        </p>
      </div>

      {/* Tabs — only shown when user has more than one view */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-earth-100 dark:bg-earth-800 rounded-xl p-1 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-earth-700 text-earth-900 dark:text-earth-100 shadow-sm'
                    : 'text-earth-500 dark:text-earth-400 hover:text-earth-700 dark:hover:text-earth-200'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <SectionSpinner size="lg" />
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={40} className="mx-auto text-earth-300 mb-3" />
          <p className="text-earth-500 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-earth-800 rounded-xl border border-earth-100 dark:border-earth-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-earth-100 dark:border-earth-700 bg-earth-50 dark:bg-earth-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Order ID</th>
                  {showBuyer && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Buyer</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50 dark:divide-earth-700">
                {orders.map(order => {
                  const isMine = order.buyer_uuid === user?.uuid || !order.buyer_uuid;
                  return (
                    <tr
                      key={order.uuid}
                      className={`hover:bg-earth-50 dark:hover:bg-earth-700/50 transition-colors ${
                        showBuyer && isMine ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-earth-600 dark:text-earth-400">
                            #{order.uuid.slice(0, 8)}
                          </span>
                          {showBuyer && isMine && (
                            <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded font-medium">
                              Mine
                            </span>
                          )}
                        </div>
                      </td>
                      {showBuyer && (
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-earth-800 dark:text-earth-200">
                              {order.buyer_name || order.delivery_name}
                            </p>
                            {order.buyer_email && (
                              <p className="text-xs text-earth-400">{order.buyer_email}</p>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-4 py-3 text-earth-600 dark:text-earth-400">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-earth-900 dark:text-earth-100">
                          {order.currency || 'USD'} {order.total}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-earth-500 dark:text-earth-400 text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelected(order); setStatusModal(false); }}
                            className="p-1.5 hover:bg-earth-100 dark:hover:bg-earth-700 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye size={15} className="text-earth-600 dark:text-earth-400" />
                          </button>
                          {canUpdateStatus && (
                            <button
                              onClick={() => { setSelected(order); setNewStatus(order.status); setStatusModal(true); }}
                              className="px-2 py-1 text-xs bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-lg transition-colors"
                            >
                              Update
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-earth-100 dark:border-earth-700 text-xs text-earth-400">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Order detail modal */}
      <Modal
        open={!!selected && !statusModal}
        onClose={() => setSelected(null)}
        title={`Order #${selected?.uuid.slice(0, 8)}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.status} />
              <span className="font-bold text-primary-700 dark:text-primary-400">
                {selected.currency || 'USD'} {selected.total}
              </span>
            </div>

            {/* Buyer info (shown for privileged views) */}
            {showBuyer && (selected.buyer_name || selected.buyer_email) && (
              <div className="bg-earth-50 dark:bg-earth-700 rounded-lg p-4">
                <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-2">Buyer</p>
                <p className="font-medium text-earth-900 dark:text-earth-100">{selected.buyer_name}</p>
                {selected.buyer_email && (
                  <p className="text-sm text-earth-500">{selected.buyer_email}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-earth-500 dark:text-earth-400 text-xs mb-0.5">Recipient</p>
                <p className="font-medium text-earth-900 dark:text-earth-100">{selected.delivery_name}</p>
              </div>
              <div>
                <p className="text-earth-500 dark:text-earth-400 text-xs mb-0.5">Phone</p>
                <p className="font-medium text-earth-900 dark:text-earth-100">{selected.delivery_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-earth-500 dark:text-earth-400 text-xs mb-0.5">Delivery Address</p>
                <p className="font-medium text-earth-900 dark:text-earth-100">
                  {selected.delivery_address}, {selected.delivery_city}, {selected.delivery_country}
                </p>
              </div>
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-earth-500 dark:text-earth-400 text-xs mb-0.5">Notes</p>
                  <p className="font-medium text-earth-900 dark:text-earth-100">{selected.notes}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-2">
                {selected.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-earth-50 dark:bg-earth-700 rounded-lg p-3 text-sm">
                    <span className="font-medium text-earth-800 dark:text-earth-200">{item.artwork_name}</span>
                    <span className="font-semibold text-earth-900 dark:text-earth-100">
                      {item.currency || 'USD'} {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-earth-400">
              Ordered {new Date(selected.created_at).toLocaleString()}
            </p>

            {canUpdateStatus && (
              <button
                onClick={() => { setNewStatus(selected.status); setStatusModal(true); }}
                className="w-full btn-primary text-sm"
              >
                Update Status
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* Update status modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status" size="sm">
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">New Status</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStatusModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={updating} className="btn-primary flex-1">
              {updating ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

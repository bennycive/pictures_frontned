import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Eye, ShoppingBag, Users, Palette, Search, X,
  Clock, CheckCircle, Truck, PackageCheck, XCircle,
  MapPin, Phone, StickyNote, ChevronRight, MessageSquare,
} from 'lucide-react';
import { ordersApi } from '../../api';
import type { Order, OrderStatusHistory } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

// ── Stage definitions ──────────────────────────────────────────────────────────

type OrderStatus = Order['status'];

const STAGES: { key: OrderStatus; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'pending',   label: 'Order Placed',  icon: Clock,         desc: 'Your order has been received and is awaiting confirmation.' },
  { key: 'confirmed', label: 'Confirmed',     icon: CheckCircle,   desc: 'Order confirmed and being prepared for shipment.' },
  { key: 'shipped',   label: 'Shipped',       icon: Truck,         desc: 'Your order is on its way.' },
  { key: 'delivered', label: 'Delivered',     icon: PackageCheck,  desc: 'Order successfully delivered.' },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
type StatusFilter = 'all' | OrderStatus;
type ViewTab = 'mine' | 'all' | 'artist';

// ── Progress stepper component ─────────────────────────────────────────────────

function OrderStepper({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <XCircle size={20} className="text-red-500" />
        </div>
        <div>
          <p className="font-semibold text-red-700">Order Cancelled</p>
          <p className="text-xs text-red-400">This order has been cancelled.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STAGES.findIndex(s => s.key === order.status);

  return (
    <div className="relative">
      {/* Connecting line */}
      <div className="absolute top-5 left-5 right-5 h-0.5 bg-earth-100" style={{ zIndex: 0 }} />
      <div
        className="absolute top-5 left-5 h-0.5 bg-primary-500 transition-all duration-500"
        style={{ width: currentIdx <= 0 ? 0 : `${(currentIdx / (STAGES.length - 1)) * 100}%`, zIndex: 1 }}
      />

      <div className="relative flex justify-between" style={{ zIndex: 2 }}>
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const done    = idx < currentIdx;
          const current = idx === currentIdx;
          const future  = idx > currentIdx;

          // find the history entry for this stage
          const histEntry = order.status_history?.find(h => h.status === stage.key);

          return (
            <div key={stage.key} className="flex flex-col items-center gap-1.5 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                done    ? 'bg-primary-500 border-primary-500 text-white' :
                current ? 'bg-white border-primary-500 text-primary-600 shadow-md shadow-primary-100' :
                          'bg-white border-earth-200 text-earth-300'
              }`}>
                <Icon size={18} strokeWidth={current ? 2.5 : 2} />
              </div>
              <p className={`text-xs font-semibold text-center leading-tight ${
                done || current ? 'text-earth-800' : 'text-earth-400'
              }`}>
                {stage.label}
              </p>
              {histEntry && (
                <p className="text-[10px] text-earth-400 text-center leading-tight">
                  {new Date(histEntry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              {current && !future && (
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Now</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage description */}
      <div className="mt-4 p-3 bg-primary-50 rounded-xl text-sm text-primary-700 text-center">
        {STAGES[currentIdx]?.desc ?? ''}
      </div>
    </div>
  );
}

// ── Timeline entry ─────────────────────────────────────────────────────────────

const HISTORY_ICON: Record<OrderStatus, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle,
  shipped:   Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
};

const HISTORY_COLOR: Record<OrderStatus, string> = {
  pending:   'bg-amber-100 text-amber-600',
  confirmed: 'bg-blue-100 text-blue-600',
  shipped:   'bg-indigo-100 text-indigo-600',
  delivered: 'bg-green-100 text-green-600',
  cancelled: 'bg-red-100 text-red-500',
};

function StatusTimeline({ history }: { history: OrderStatusHistory[] }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="space-y-0">
      {history.map((entry, idx) => {
        const Icon  = HISTORY_ICON[entry.status] ?? Clock;
        const color = HISTORY_COLOR[entry.status] ?? 'bg-earth-100 text-earth-500';
        const isLast = idx === history.length - 1;
        return (
          <div key={entry.id} className="flex gap-3">
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={15} />
              </div>
              {!isLast && <div className="w-px flex-1 bg-earth-100 my-1" />}
            </div>
            {/* Content */}
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-earth-800 capitalize">{entry.status}</span>
                {entry.changed_by_name && (
                  <span className="text-[10px] text-earth-400">by {entry.changed_by_name}</span>
                )}
              </div>
              {entry.note && (
                <p className="text-xs text-earth-600 mt-0.5 flex items-start gap-1">
                  <MessageSquare size={11} className="shrink-0 mt-0.5 text-earth-400" />
                  {entry.note}
                </p>
              )}
              <p className="text-[10px] text-earth-400 mt-1">
                {new Date(entry.created_at).toLocaleString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { user, hasPermission, hasRole, isAdmin } = useAuth();
  const { error } = useToast();

  const isPrivileged   = isAdmin() || hasRole('Moderator');
  const isArtist       = hasRole('Artist');
  const canUpdateStatus = hasPermission('orders.change_order');

  const tabs: { key: ViewTab; label: string; icon: typeof ShoppingBag }[] = [
    { key: 'mine', label: 'My Orders', icon: ShoppingBag },
    ...(isPrivileged ? [{ key: 'all' as ViewTab, label: 'All Orders', icon: Users }] : []),
    ...(isArtist && !isPrivileged ? [{ key: 'artist' as ViewTab, label: 'Artwork Orders', icon: Palette }] : []),
  ];

  const defaultTab: ViewTab = isPrivileged ? 'all' : 'mine';
  const [activeTab,    setActiveTab]    = useState<ViewTab>(defaultTab);
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState<Order | null>(null);
  const [statusModal,  setStatusModal]  = useState(false);
  const [newStatus,    setNewStatus]    = useState<OrderStatus>('pending');
  const [statusNote,   setStatusNote]   = useState('');
  const [updating,     setUpdating]     = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search,       setSearch]       = useState('');

  const load = useCallback(async (tab: ViewTab) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (tab === 'mine' && isPrivileged && user?.uuid) params.user_uuid = user.uuid;
      if (tab === 'artist') params.artist = true;
      const { data } = await ordersApi.list(params);
      setOrders(data as Order[]);
    } catch { error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [error, isPrivileged, user?.uuid]); // eslint-disable-line

  useEffect(() => { load(activeTab); }, [activeTab, load]);

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    setSelected(null);
    setStatusFilter('all');
    setSearch('');
  };

  const openDetail = (order: Order) => {
    setSelected(order);
    setStatusModal(false);
  };

  const openStatusModal = (order: Order) => {
    setSelected(order);
    setNewStatus(order.status);
    setStatusNote('');
    setStatusModal(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      const { data: updated } = await ordersApi.updateStatus(selected.uuid, newStatus, statusNote);
      setOrders(prev => prev.map(o => o.uuid === updated.uuid ? updated : o));
      setSelected(updated);
      swal.success('Order status updated');
      setStatusModal(false);
    } catch { error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const showBuyer = activeTab !== 'mine';

  const statusCounts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: orders.length, pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => { if (o.status in c) c[o.status as StatusFilter]++; });
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    let list = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.uuid.includes(q) ||
        (o.buyer_name  || '').toLowerCase().includes(q) ||
        (o.buyer_email || '').toLowerCase().includes(q) ||
        o.delivery_name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, search]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Orders</h1>
          <p className="text-sm text-earth-500 mt-0.5">
            {activeTab === 'all'    && 'All orders across the platform'}
            {activeTab === 'mine'   && 'Track the progress of your orders'}
            {activeTab === 'artist' && 'Orders containing your artworks'}
          </p>
        </div>
        {activeTab !== 'mine' && (
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input className="input pl-9 pr-8 text-sm" placeholder="Search buyer, order ID…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-white text-earth-900 shadow-sm' : 'text-earth-500 hover:text-earth-700'
                }`}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {(['all', ...STATUS_OPTIONS] as StatusFilter[]).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              statusFilter === s ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-earth-600 border-earth-200 hover:border-primary-300 hover:text-primary-600'
            }`}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 ${statusFilter === s ? 'opacity-80' : 'text-earth-400'}`}>
              ({statusCounts[s]})
            </span>
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? <SectionSpinner size="lg" /> : visible.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag size={40} className="mx-auto text-earth-300 mb-3" />
          <p className="text-earth-500 text-sm">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(order => {
            const isMine = order.buyer_uuid === user?.uuid || !order.buyer_uuid;
            const currentStageIdx = STAGES.findIndex(s => s.key === order.status);
            const isCancelled = order.status === 'cancelled';
            return (
              <div key={order.uuid}
                className="bg-white rounded-2xl border border-earth-100 hover:border-primary-200 hover:shadow-sm transition-all overflow-hidden">
                {/* Row header */}
                <div className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-earth-500">#{order.uuid.slice(0, 8).toUpperCase()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_BADGE[order.status]}`}>
                        {order.status}
                      </span>
                      {showBuyer && isMine && (
                        <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">Mine</span>
                      )}
                    </div>
                    {showBuyer && (
                      <p className="text-sm font-medium text-earth-700 mt-0.5 truncate">
                        {order.buyer_name || order.delivery_name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-earth-400">
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                      <span className="font-semibold text-primary-700">{order.currency} {order.total}</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canUpdateStatus && (
                      <button onClick={() => openStatusModal(order)}
                        className="text-xs font-medium text-primary-600 border border-primary-200 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                        Update
                      </button>
                    )}
                    <button onClick={() => openDetail(order)}
                      className="p-2 hover:bg-earth-50 rounded-xl transition-colors flex items-center gap-1 text-xs text-earth-500">
                      <Eye size={15} /> <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Mini progress bar (skip for cancelled) */}
                {!isCancelled && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-1">
                      {STAGES.map((stage, idx) => {
                        const Icon    = stage.icon;
                        const done    = idx <= currentStageIdx;
                        return (
                          <div key={stage.key} className="flex items-center gap-1 flex-1 last:flex-none">
                            <div className={`flex items-center gap-1 ${done ? 'text-primary-600' : 'text-earth-300'}`}>
                              <Icon size={13} />
                              <span className="text-[10px] font-medium hidden sm:block">{stage.label}</span>
                            </div>
                            {idx < STAGES.length - 1 && (
                              <div className={`flex-1 h-px mx-1 ${idx < currentStageIdx ? 'bg-primary-400' : 'bg-earth-100'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Order detail modal ─────────────────────────────────────────── */}
      <Modal open={!!selected && !statusModal} onClose={() => setSelected(null)}
        title={`Order #${selected?.uuid.slice(0, 8).toUpperCase()}`} size="lg">
        {selected && (
          <div className="space-y-6">

            {/* Stepper */}
            <OrderStepper order={selected} />

            {/* Items */}
            <div>
              <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-2">
                {selected.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-earth-50 rounded-xl p-3 text-sm">
                    <span className="font-medium text-earth-800">{item.artwork_name}</span>
                    <span className="font-semibold text-primary-700">{item.currency} {item.price}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-earth-100">
                <span className="text-sm font-bold text-earth-700">Total</span>
                <span className="text-base font-bold text-primary-700">{selected.currency} {selected.total}</span>
              </div>
            </div>

            {/* Delivery */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-earth-400 flex items-center gap-1 mb-0.5"><MapPin size={11} /> Delivery Address</p>
                <p className="font-medium text-earth-800">
                  {selected.delivery_name} — {selected.delivery_address}, {selected.delivery_city}, {selected.delivery_country}
                </p>
              </div>
              <div>
                <p className="text-xs text-earth-400 flex items-center gap-1 mb-0.5"><Phone size={11} /> Phone</p>
                <p className="font-medium text-earth-800">{selected.delivery_phone}</p>
              </div>
              {selected.payment_channel && (
                <div>
                  <p className="text-xs text-earth-400 mb-0.5">Payment</p>
                  <p className="font-medium text-earth-800 capitalize">{selected.payment_channel.replace('_', ' ')}</p>
                </div>
              )}
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-earth-400 flex items-center gap-1 mb-0.5"><StickyNote size={11} /> Notes</p>
                  <p className="font-medium text-earth-800">{selected.notes}</p>
                </div>
              )}
            </div>

            {/* Buyer (admin view) */}
            {showBuyer && (selected.buyer_name || selected.buyer_email) && (
              <div className="bg-earth-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1">Buyer</p>
                <p className="font-medium text-earth-800">{selected.buyer_name}</p>
                {selected.buyer_email && <p className="text-xs text-earth-500">{selected.buyer_email}</p>}
              </div>
            )}

            {/* History timeline */}
            {selected.status_history && selected.status_history.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide mb-3">Status History</p>
                <StatusTimeline history={selected.status_history} />
              </div>
            )}

            <p className="text-xs text-earth-400">Order placed {new Date(selected.created_at).toLocaleString()}</p>

            {canUpdateStatus && (
              <button onClick={() => { setNewStatus(selected.status); setStatusNote(''); setStatusModal(true); }}
                className="w-full btn-primary text-sm">
                Update Status
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ── Update status modal ────────────────────────────────────────── */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status" size="sm">
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">New Status</label>
            <div className="grid grid-cols-1 gap-2">
              {STATUS_OPTIONS.map(s => {
                const Icon = HISTORY_ICON[s];
                return (
                  <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    newStatus === s ? 'border-primary-400 bg-primary-50' : 'border-earth-200 hover:border-earth-300'
                  }`}>
                    <input type="radio" name="status" className="accent-primary-600"
                      checked={newStatus === s} onChange={() => setNewStatus(s)} />
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      newStatus === s ? HISTORY_COLOR[s] : 'bg-earth-100 text-earth-400'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <span className="text-sm font-medium capitalize">{s}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">
              Note <span className="text-earth-400 font-normal">(optional — visible to customer)</span>
            </label>
            <textarea
              className="input h-20 resize-none text-sm"
              placeholder="e.g. Shipped via DHL, tracking number: TZ1234567890"
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStatusModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={updating} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {updating ? <><Spinner size="sm" /> Updating…</> : 'Update Status'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

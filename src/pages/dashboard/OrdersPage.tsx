import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { ordersApi } from '../../api';
import type { Order } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

export function OrdersPage() {
  const { hasPermission } = useAuth();
  const { success, error } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const canUpdateStatus = hasPermission('orders.change_order');

  const load = async () => {
    setLoading(true);
    try { const { data } = await ordersApi.list(); setOrders(data as Order[]); }
    catch { error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(selected.uuid, newStatus);
      success('Order status updated!');
      setStatusModal(false);
      load();
    } catch { error('Failed to update status'); }
    finally { setUpdating(false); }
  };

  const columns = [
    { key: 'uuid', header: 'Order ID', render: (o: Order) => <span className="font-mono text-xs text-earth-600">#{o.uuid.slice(0, 8)}</span> },
    { key: 'status', header: 'Status', render: (o: Order) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', render: (o: Order) => <span className="font-semibold">{o.currency || 'USD'} {o.total}</span> },
    { key: 'delivery_name', header: 'Customer', render: (o: Order) => o.delivery_name },
    { key: 'created_at', header: 'Date', render: (o: Order) => new Date(o.created_at).toLocaleDateString() },
    { key: 'actions', header: 'Actions', render: (o: Order) => (
      <div className="flex gap-2">
        <button onClick={() => setSelected(o)} className="p-1.5 hover:bg-earth-100 rounded-lg">
          <Eye size={15} className="text-earth-600" />
        </button>
        {canUpdateStatus && (
          <button onClick={() => { setSelected(o); setNewStatus(o.status); setStatusModal(true); }}
            className="px-2 py-1 text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors">
            Update Status
          </button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-earth-900">Orders</h1>

      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <Table columns={columns} data={orders} keyField="uuid" emptyMessage="No orders yet." />
      )}

      {/* Order detail modal */}
      <Modal open={!!selected && !statusModal} onClose={() => setSelected(null)} title={`Order #${selected?.uuid.slice(0, 8)}`} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={selected.status} />
              <span className="font-bold text-primary-700">{selected.currency || 'USD'} {selected.total}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-earth-500">Customer</p>
                <p className="font-medium">{selected.delivery_name}</p>
              </div>
              <div>
                <p className="text-earth-500">Phone</p>
                <p className="font-medium">{selected.delivery_phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-earth-500">Address</p>
                <p className="font-medium">{selected.delivery_address}, {selected.delivery_city}, {selected.delivery_country}</p>
              </div>
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-earth-500">Notes</p>
                  <p className="font-medium">{selected.notes}</p>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-earth-900 mb-2">Items</h4>
              <div className="space-y-2">
                {selected.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-earth-50 rounded-lg p-3 text-sm">
                    <span className="font-medium text-earth-800">{item.artwork_name}</span>
                    <span className="font-semibold">{item.currency || 'USD'} {item.price}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-earth-400">Ordered {new Date(selected.created_at).toLocaleString()}</p>
          </div>
        )}
      </Modal>

      {/* Update status modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Order Status" size="sm">
        <form onSubmit={handleUpdateStatus} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">New Status</label>
            <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStatusModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={updating} className="btn-primary flex-1">{updating ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

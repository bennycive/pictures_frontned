import { useEffect, useState } from 'react';
import { Plus, Play, Square, Eye, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auctionsApi, artworksApi } from '../../api';
import type { Auction, Artwork } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

interface AuctionForm {
  artwork_uuid: string; start_price: string; reserve_price: string;
  bid_increment: string; currency: string; start_time: string; end_time: string;
}

export function AuctionsPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<AuctionForm>({ artwork_uuid: '', start_price: '', reserve_price: '', bid_increment: '1.00', currency: 'USD', start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission('auctions.add_auction');
  const canManage = hasPermission('auctions.change_auction');

  const load = async () => {
    setLoading(true);
    try {
      const [a, art] = await Promise.all([auctionsApi.list(), artworksApi.list({ is_sold: false })]);
      setAuctions(a.data as Auction[]);
      setArtworks((art.data.results || []));
    } catch { error('Failed to load auctions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, reserve_price: form.reserve_price || null };
      await auctionsApi.create(payload as Record<string, unknown>);
      swal.success('Auction created!');
      setModalOpen(false);
      load();
    } catch { error('Failed to create auction'); }
    finally { setSaving(false); }
  };

  const handleStart = async (uuid: string) => {
    try { await auctionsApi.start(uuid); swal.success('Auction started!'); load(); }
    catch { error('Failed to start auction'); }
  };

  const handleEnd = async (uuid: string) => {
    try { await auctionsApi.end(uuid); swal.success('Auction ended!'); load(); }
    catch { error('Failed to end auction'); }
  };

  const columns = [
    { key: 'artwork', header: 'Artwork', render: (a: Auction) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-earth-100 rounded-lg overflow-hidden shrink-0">
          {a.artwork_image && <img src={a.artwork_image} alt="" className="w-full h-full object-cover" />}
        </div>
        <span className="font-medium text-earth-900">{a.artwork_name}</span>
      </div>
    )},
    { key: 'status', header: 'Status', render: (a: Auction) => <StatusBadge status={a.status} /> },
    { key: 'price', header: 'Current / Start', render: (a: Auction) => (
      <span>{a.currency} {a.current_price || a.start_price}</span>
    )},
    { key: 'bids', header: 'Bids', render: (a: Auction) => (
      <div className="flex items-center gap-1 text-earth-600"><TrendingUp size={14} />{a.total_bids}</div>
    )},
    { key: 'time', header: 'End Time', render: (a: Auction) => (
      <div className="flex items-center gap-1 text-earth-500 text-xs"><Clock size={12} />{new Date(a.end_time).toLocaleDateString()}</div>
    )},
    { key: 'actions', header: 'Actions', render: (a: Auction) => (
      <div className="flex gap-2">
        <Link to={`/dashboard/auctions/${a.uuid}`} className="p-1.5 hover:bg-earth-100 rounded-lg"><Eye size={15} className="text-earth-600" /></Link>
        {canManage && a.status === 'pending' && (
          <button onClick={() => handleStart(a.uuid)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Start"><Play size={15} className="text-green-600" /></button>
        )}
        {canManage && a.status === 'live' && (
          <button onClick={() => handleEnd(a.uuid)} className="p-1.5 hover:bg-red-50 rounded-lg" title="End"><Square size={15} className="text-red-500" /></button>
        )}
      </div>
    )},
  ];

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 7 * 24 * 3600000).toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-earth-900">Auctions</h1>
        {canCreate && (
          <button onClick={() => { setForm({ artwork_uuid: artworks[0]?.uuid || '', start_price: '', reserve_price: '', bid_increment: '1.00', currency: 'USD', start_time: defaultStart, end_time: defaultEnd }); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Auction
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'live', 'pending', 'ended'].map(s => {
          const count = s === 'all' ? auctions.length : auctions.filter(a => a.status === s).length;
          return (
            <span key={s} className="px-3 py-1.5 bg-white border border-earth-100 rounded-lg text-sm text-earth-600">
              {s.charAt(0).toUpperCase() + s.slice(1)} ({count})
            </span>
          );
        })}
      </div>

      {loading ? <SectionSpinner /> : (
        <Table columns={columns} data={auctions} keyField="uuid" emptyMessage="No auctions found." />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Auction">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Artwork</label>
            <select className="input" value={form.artwork_uuid} onChange={e => setForm(f => ({ ...f, artwork_uuid: e.target.value }))} required>
              <option value="">Select artwork...</option>
              {artworks.map(a => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Start Price</label>
              <input type="number" step="0.01" className="input" value={form.start_price} onChange={e => setForm(f => ({ ...f, start_price: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Reserve Price (optional)</label>
              <input type="number" step="0.01" className="input" value={form.reserve_price} onChange={e => setForm(f => ({ ...f, reserve_price: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Bid Increment</label>
              <input type="number" step="0.01" className="input" value={form.bid_increment} onChange={e => setForm(f => ({ ...f, bid_increment: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Currency</label>
              <input className="input uppercase" maxLength={3} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Start Time</label>
              <input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">End Time</label>
              <input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Creating...' : 'Create Auction'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Plus, Play, Square, Eye, TrendingUp, Clock, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auctionsApi, artworksApi } from '../../api';
import type { Auction, Artwork } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

interface AuctionForm {
  artwork_uuid: string; start_price: string; reserve_price: string;
  bid_increment: string; currency: string; start_time: string; end_time: string;
}

type FilterStatus = 'all' | 'pending' | 'live' | 'ended';

const EMPTY_FORM: AuctionForm = {
  artwork_uuid: '', start_price: '', reserve_price: '',
  bid_increment: '1.00', currency: 'USD', start_time: '', end_time: '',
};

function defaultTimes() {
  const now = new Date();
  return {
    start: new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16),
    end:   new Date(now.getTime() + 7 * 24 * 3600000).toISOString().slice(0, 16),
  };
}

export function AuctionsPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();

  const [auctions, setAuctions]       = useState<Auction[]>([]);
  const [artworks, setArtworks]       = useState<Artwork[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<FilterStatus>('all');

  // Create / Edit modal
  const [modalOpen, setModalOpen]     = useState(false);
  const [editTarget, setEditTarget]   = useState<Auction | null>(null);
  const [form, setForm]               = useState<AuctionForm>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);

  const canCreate = hasPermission('auctions.add_auction');
  const canManage = hasPermission('auctions.change_auction');
  const canDelete = hasPermission('auctions.delete_auction');

  const load = async () => {
    setLoading(true);
    try {
      const [a, art] = await Promise.all([
        auctionsApi.list(),
        artworksApi.list({ is_sold: false, page_size: 100 }),
      ]);
      setAuctions(a.data as Auction[]);
      setArtworks(art.data.results || []);
    } catch { error('Failed to load auctions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    const t = defaultTimes();
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, artwork_uuid: artworks[0]?.uuid || '', start_time: t.start, end_time: t.end });
    setModalOpen(true);
  };

  const openEdit = (a: Auction) => {
    setEditTarget(a);
    setForm({
      artwork_uuid:   String(a.artwork_uuid),
      start_price:    String(a.start_price),
      reserve_price:  a.reserve_price ? String(a.reserve_price) : '',
      bid_increment:  String(a.bid_increment),
      currency:       a.currency,
      start_time:     a.start_time ? new Date(a.start_time).toISOString().slice(0, 16) : '',
      end_time:       a.end_time   ? new Date(a.end_time).toISOString().slice(0, 16)   : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, reserve_price: form.reserve_price || null };
      if (editTarget) {
        await auctionsApi.update(editTarget.uuid, payload as Record<string, unknown>);
        swal.success('Auction updated!');
      } else {
        await auctionsApi.create(payload as Record<string, unknown>);
        swal.success('Auction created!');
      }
      setModalOpen(false);
      load();
    } catch { error(editTarget ? 'Failed to update auction' : 'Failed to create auction'); }
    finally { setSaving(false); }
  };

  const handleStart = async (a: Auction) => {
    const ok = await swal.confirm(`Start auction for "${a.artwork_name}"? It will go live immediately.`);
    if (!ok) return;
    try { await auctionsApi.start(a.uuid); swal.success('Auction started!'); load(); }
    catch { error('Failed to start auction'); }
  };

  const handleEnd = async (a: Auction) => {
    const ok = await swal.confirm(`End auction for "${a.artwork_name}"? This will close bidding and settle the winner.`, true);
    if (!ok) return;
    try { await auctionsApi.end(a.uuid); swal.success('Auction ended!'); load(); }
    catch { error('Failed to end auction'); }
  };

  const handleDelete = async (a: Auction) => {
    const ok = await swal.confirmDelete(`Delete auction for "${a.artwork_name}"?`);
    if (!ok) return;
    try { await auctionsApi.delete(a.uuid); swal.success('Auction deleted.'); load(); }
    catch { error('Failed to delete auction'); }
  };

  const counts: Record<FilterStatus, number> = {
    all:     auctions.length,
    live:    auctions.filter(a => a.status === 'live').length,
    pending: auctions.filter(a => a.status === 'pending').length,
    ended:   auctions.filter(a => a.status === 'ended').length,
  };

  const visible = filter === 'all' ? auctions : auctions.filter(a => a.status === filter);

  const columns = [
    {
      key: 'artwork', header: 'Artwork',
      render: (a: Auction) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-earth-100 rounded-lg overflow-hidden shrink-0">
            {a.artwork_image && <img src={a.artwork_image} alt="" className="w-full h-full object-cover" />}
          </div>
          <span className="font-medium text-earth-900">{a.artwork_name}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (a: Auction) => <StatusBadge status={a.status} /> },
    {
      key: 'price', header: 'Current / Start',
      render: (a: Auction) => (
        <span className="font-medium">{a.currency} {a.current_price || a.start_price}</span>
      ),
    },
    {
      key: 'bids', header: 'Bids',
      render: (a: Auction) => (
        <div className="flex items-center gap-1 text-earth-600">
          <TrendingUp size={14} />{a.total_bids}
        </div>
      ),
    },
    {
      key: 'time', header: 'End Time',
      render: (a: Auction) => (
        <div className="flex items-center gap-1 text-earth-500 text-xs">
          <Clock size={12} />{new Date(a.end_time).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (a: Auction) => (
        <div className="flex gap-1">
          <Link to={`/dashboard/auctions/${a.uuid}`} className="p-1.5 hover:bg-earth-100 rounded-lg" title="View">
            <Eye size={14} className="text-earth-600" />
          </Link>
          {canManage && a.status === 'pending' && (
            <>
              <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-earth-100 rounded-lg" title="Edit">
                <Pencil size={14} className="text-earth-500" />
              </button>
              <button onClick={() => handleStart(a)} className="p-1.5 hover:bg-green-50 rounded-lg" title="Start">
                <Play size={14} className="text-green-600" />
              </button>
            </>
          )}
          {canManage && a.status === 'live' && (
            <button onClick={() => handleEnd(a)} className="p-1.5 hover:bg-red-50 rounded-lg" title="End">
              <Square size={14} className="text-red-500" />
            </button>
          )}
          {canDelete && a.status === 'pending' && (
            <button onClick={() => handleDelete(a)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
              <Trash2 size={14} className="text-red-400" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Auctions</h1>
          <p className="text-sm text-earth-500 mt-0.5">{auctions.length} total auctions</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Create Auction
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
        {(['all', 'live', 'pending', 'ended'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s
                ? 'bg-white text-earth-900 shadow-sm'
                : 'text-earth-500 hover:text-earth-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === s ? 'bg-primary-100 text-primary-700' : 'bg-earth-200 text-earth-500'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {loading ? <SectionSpinner /> : (
        <Table columns={columns} data={visible} keyField="uuid" emptyMessage="No auctions found." />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Auction' : 'Create Auction'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editTarget && (
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Artwork</label>
              <select
                className="input"
                value={form.artwork_uuid}
                onChange={e => setForm(f => ({ ...f, artwork_uuid: e.target.value }))}
                required
              >
                <option value="">Select artwork...</option>
                {artworks.map(a => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
              </select>
            </div>
          )}
          {editTarget && (
            <div className="bg-earth-50 rounded-xl px-4 py-3 text-sm text-earth-700">
              <span className="text-earth-400 text-xs uppercase tracking-wide font-semibold">Artwork</span>
              <p className="font-medium mt-0.5">{editTarget.artwork_name}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Start Price</label>
              <input type="number" step="0.01" min="0.01" className="input" value={form.start_price}
                onChange={e => setForm(f => ({ ...f, start_price: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Reserve Price <span className="text-earth-400">(optional)</span></label>
              <input type="number" step="0.01" min="0.01" className="input" value={form.reserve_price}
                onChange={e => setForm(f => ({ ...f, reserve_price: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Bid Increment</label>
              <input type="number" step="0.01" min="0.01" className="input" value={form.bid_increment}
                onChange={e => setForm(f => ({ ...f, bid_increment: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Currency</label>
              <input className="input uppercase" maxLength={3} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Start Time</label>
              <input type="datetime-local" className="input" value={form.start_time}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">End Time</label>
              <input type="datetime-local" className="input" value={form.end_time}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Create Auction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

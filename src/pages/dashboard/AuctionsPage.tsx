import { useEffect, useState } from 'react';
import { Plus, Play, Square, Eye, TrendingUp, Clock, Pencil, Trash2, Gavel, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auctionsApi, artworksApi } from '../../api';
import type { Auction, Artwork } from '../../api/types';
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

const STATUS_STYLES: Record<string, string> = {
  live:      'bg-green-50 border-green-200',
  pending:   'bg-earth-50 border-earth-200',
  ended:     'bg-gray-50 border-gray-200',
  cancelled: 'bg-red-50 border-red-200',
};

export function AuctionsPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();

  const [auctions, setAuctions]     = useState<Auction[]>([]);
  const [artworks, setArtworks]     = useState<Artwork[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<FilterStatus>('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Auction | null>(null);
  const [form, setForm]             = useState<AuctionForm>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

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

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openCreate = () => {
    const t = defaultTimes();
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, artwork_uuid: artworks[0]?.uuid || '', start_time: t.start, end_time: t.end });
    setModalOpen(true);
  };

  const openEdit = (a: Auction) => {
    setEditTarget(a);
    setForm({
      artwork_uuid:  String(a.artwork_uuid),
      start_price:   String(a.start_price),
      reserve_price: a.reserve_price ? String(a.reserve_price) : '',
      bid_increment: String(a.bid_increment),
      currency:      a.currency,
      start_time:    a.start_time ? new Date(a.start_time).toISOString().slice(0, 16) : '',
      end_time:      a.end_time   ? new Date(a.end_time).toISOString().slice(0, 16)   : '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, reserve_price: form.reserve_price || null };
      if (editTarget) { await auctionsApi.update(editTarget.uuid, payload as Record<string, unknown>); swal.success('Auction updated!'); }
      else            { await auctionsApi.create(payload as Record<string, unknown>); swal.success('Auction created!'); }
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
    const ok = await swal.confirm(`End auction for "${a.artwork_name}"? This will close bidding.`, true);
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

  const f = (k: keyof AuctionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Auctions</h1>
          <p className="text-sm text-earth-500 mt-0.5">
            {counts.live > 0 && <span className="text-green-600 font-semibold">{counts.live} live · </span>}
            {auctions.length} total
          </p>
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Create Auction
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
        {(['all', 'live', 'pending', 'ended'] as FilterStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === s ? 'bg-white text-earth-900 shadow-sm' : 'text-earth-500 hover:text-earth-700'
            }`}
          >
            {s === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              filter === s ? 'bg-primary-100 text-primary-700' : 'bg-earth-200 text-earth-500'
            }`}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <SectionSpinner /> : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-16 text-center">
          <div className="w-16 h-16 bg-earth-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gavel size={28} className="text-earth-300" />
          </div>
          <p className="font-medium text-earth-600 mb-1">No auctions found</p>
          <p className="text-sm text-earth-400">
            {filter !== 'all' ? `No ${filter} auctions` : 'Create your first auction to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-earth-50 border-b border-earth-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Artwork</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Bids</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Ends</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50">
                {visible.map(a => (
                  <tr key={a.uuid} className={`hover:bg-earth-50 transition-colors ${a.status === 'live' ? 'bg-green-50/30' : ''}`}>
                    {/* Artwork */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-earth-100 shrink-0 border border-earth-200">
                          {a.artwork_image
                            ? <img src={a.artwork_image} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Gavel size={14} className="text-earth-300" /></div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-earth-900 truncate max-w-[160px]">{a.artwork_name}</p>
                          <p className="text-xs text-earth-400 font-mono">{a.uuid.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {a.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />}
                        <StatusBadge status={a.status} />
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-earth-900">{a.currency} {a.current_price || a.start_price}</p>
                      {a.current_price && a.current_price !== a.start_price && (
                        <p className="text-xs text-earth-400">Start: {a.start_price}</p>
                      )}
                    </td>
                    {/* Bids */}
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                        a.total_bids > 0 ? 'bg-primary-50 text-primary-700' : 'bg-earth-100 text-earth-400'
                      }`}>
                        <TrendingUp size={11} /> {a.total_bids}
                      </span>
                    </td>
                    {/* End time */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-earth-500">
                        <Clock size={11} />
                        {new Date(a.end_time).toLocaleDateString()}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/dashboard/auctions/${a.uuid}`}
                          className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="View details">
                          <Eye size={14} className="text-earth-500" />
                        </Link>
                        {canManage && a.status === 'pending' && (
                          <>
                            <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="Edit">
                              <Pencil size={14} className="text-earth-500" />
                            </button>
                            <button onClick={() => handleStart(a)}
                              className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded-lg transition-colors"
                              title="Start auction">
                              <Play size={11} /> Start
                            </button>
                          </>
                        )}
                        {canManage && a.status === 'live' && (
                          <button onClick={() => handleEnd(a)}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition-colors"
                            title="End auction">
                            <Square size={11} /> End
                          </button>
                        )}
                        {canDelete && a.status === 'pending' && (
                          <button onClick={() => handleDelete(a)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-earth-100 text-xs text-earth-400 flex justify-between">
            <span>{visible.length} {filter === 'all' ? 'auctions' : filter + ' auctions'}</span>
            {counts.live > 0 && <span className="text-green-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />{counts.live} currently live</span>}
          </div>
        </div>
      )}

      {/* Create / Edit modal with logo */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? `Edit — ${editTarget.artwork_name}` : 'Create Auction'} size="md" branded>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Artwork selector or read-only */}
          {!editTarget ? (
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Artwork <span className="text-red-400">*</span></label>
              <select className="input" value={form.artwork_uuid} onChange={f('artwork_uuid')} required>
                <option value="">Select artwork…</option>
                {artworks.map(a => <option key={a.uuid} value={a.uuid}>{a.name}</option>)}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-earth-50 rounded-xl p-3 border border-earth-100">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-earth-100 shrink-0">
                {editTarget.artwork_image && <img src={editTarget.artwork_image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="text-xs text-earth-400 font-semibold uppercase tracking-wide">Artwork</p>
                <p className="font-semibold text-earth-900 text-sm">{editTarget.artwork_name}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Start Price <span className="text-red-400">*</span></label>
              <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00" value={form.start_price} onChange={f('start_price')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Reserve Price <span className="text-earth-400 normal-case font-normal">(optional)</span></label>
              <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00" value={form.reserve_price} onChange={f('reserve_price')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Bid Increment <span className="text-red-400">*</span></label>
              <input type="number" step="0.01" min="0.01" className="input" value={form.bid_increment} onChange={f('bid_increment')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Currency <span className="text-red-400">*</span></label>
              <input className="input uppercase font-mono tracking-widest text-center" maxLength={3} placeholder="USD" value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Start Time <span className="text-red-400">*</span></label>
              <input type="datetime-local" className="input" value={form.start_time} onChange={f('start_time')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">End Time <span className="text-red-400">*</span></label>
              <input type="datetime-local" className="input" value={form.end_time} onChange={f('end_time')} required />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {saving ? <Spinner size="sm" /> : <Check size={15} />}
            {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Auction'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import {
  Plus, Play, Square, Eye, TrendingUp, Clock, Pencil, Trash2,
  Gavel, Check, AlarmClock, CalendarClock, Image as ImageIcon,
  Upload, X, Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { auctionsApi, artworksApi } from '../../api';
import type { Auction, AuctionImage, Artwork } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

// ── DateTimePicker ─────────────────────────────────────────────────────────────

function DateTimePicker({
  label, required, value, onChange, min,
}: {
  label: string; required?: boolean;
  value: string; onChange: (v: string) => void;
  min?: string;
}) {
  const readable = value
    ? new Date(value).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })
    : null;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type="datetime-local"
        required={required}
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        className="input w-full"
      />
      {readable && (
        <p className="text-xs text-primary-600 font-medium flex items-center gap-1.5">
          <CalendarClock size={12} />
          {readable}
        </p>
      )}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuctionForm {
  artwork_uuid: string; start_price: string; reserve_price: string;
  bid_increment: string; currency: string; start_time: string; end_time: string;
}

interface ExtendForm { end_time: string; bid_increment: string }

type FilterStatus = 'all' | 'pending' | 'live' | 'ended';

interface PendingFile { file: File; preview: string; isPrimary: boolean }

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

// ── Image Manager Component ────────────────────────────────────────────────────

function ImageManager({
  auctionUuid,
  existing,
  onChanged,
}: {
  auctionUuid: string;
  existing: AuctionImage[];
  onChanged: (images: AuctionImage[]) => void;
}) {
  const { error, success } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<AuctionImage[]>(existing);
  const [uploading, setUploading] = useState(false);

  const syncUp = (next: AuctionImage[]) => { setImages(next); onChanged(next); };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const updated = [...images];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('image', file);
      if (updated.length === 0) fd.append('is_primary', 'true');
      try {
        const { data } = await auctionsApi.uploadImage(auctionUuid, fd);
        updated.push(data);
      } catch {
        error(`Failed to upload ${file.name}`);
      }
    }
    syncUp(updated);
    setUploading(false);
    success('Images uploaded');
  };

  const handleDelete = async (img: AuctionImage) => {
    const ok = await swal.confirmDelete('Delete this image?');
    if (!ok) return;
    try {
      await auctionsApi.deleteImage(auctionUuid, img.id);
      syncUp(images.filter(i => i.id !== img.id));
    } catch { error('Failed to delete image'); }
  };

  const handleSetPrimary = async (img: AuctionImage) => {
    try {
      await auctionsApi.setPrimaryImage(auctionUuid, img.id);
      syncUp(images.map(i => ({ ...i, is_primary: i.id === img.id })));
    } catch { error('Failed to set primary image'); }
  };

  return (
    <div className="space-y-3">
      {/* Existing images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map(img => (
            <div key={img.id} className={`relative group rounded-xl overflow-hidden border-2 ${img.is_primary ? 'border-primary-500' : 'border-earth-100'}`}>
              <img
                src={img.image_url ?? ''}
                alt="auction"
                className="w-full aspect-square object-cover"
              />
              {/* Primary badge */}
              {img.is_primary && (
                <div className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={9} fill="currentColor" /> Primary
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img)}
                    className="bg-white text-earth-800 text-[10px] font-semibold px-2 py-1 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-1"
                    title="Set as primary"
                  >
                    <Star size={10} /> Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="bg-white text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  title="Delete"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload drop zone */}
      <div
        className="border-2 border-dashed border-earth-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-primary-600">
            <Spinner size="sm" /> Uploading…
          </div>
        ) : (
          <>
            <Upload size={20} className="text-earth-300 mx-auto mb-1" />
            <p className="text-xs text-earth-500 font-medium">Click or drag to add images</p>
            <p className="text-[10px] text-earth-400 mt-0.5">First image auto-becomes primary</p>
          </>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ── Pending Images Picker (for new auctions before UUID exists) ────────────────

function PendingImagePicker({
  files,
  onChange,
}: {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const newFiles: PendingFile[] = Array.from(list).map((file, idx) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: files.length === 0 && idx === 0,
    }));
    const updated = [...files, ...newFiles];
    if (!updated.some(f => f.isPrimary) && updated.length > 0) updated[0].isPrimary = true;
    onChange(updated);
  };

  const remove = (idx: number) => {
    const updated = files.filter((_, i) => i !== idx);
    if (updated.length > 0 && !updated.some(f => f.isPrimary)) updated[0].isPrimary = true;
    onChange(updated);
  };

  const setPrimary = (idx: number) => {
    onChange(files.map((f, i) => ({ ...f, isPrimary: i === idx })));
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide">
        Images <span className="text-earth-400 normal-case font-normal">(optional — upload after creating)</span>
      </label>

      {files.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {files.map((f, i) => (
            <div key={i} className={`relative group rounded-xl overflow-hidden border-2 ${f.isPrimary ? 'border-primary-500' : 'border-earth-100'}`}>
              <img src={f.preview} alt="" className="w-full aspect-square object-cover" />
              {f.isPrimary && (
                <div className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star size={9} fill="currentColor" /> Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                {!f.isPrimary && (
                  <button type="button" onClick={() => setPrimary(i)}
                    className="bg-white text-earth-800 text-[10px] font-semibold px-2 py-1 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-1">
                    <Star size={10} /> Primary
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="bg-white text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="border-2 border-dashed border-earth-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
      >
        <Upload size={20} className="text-earth-300 mx-auto mb-1" />
        <p className="text-xs text-earth-500 font-medium">Click or drag images here</p>
        <p className="text-[10px] text-earth-400 mt-0.5">Multiple images supported · First is primary</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => addFiles(e.target.files)} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function AuctionsPage() {
  const { hasPermission } = useAuth();
  const { error, success } = useToast();

  const [auctions, setAuctions]             = useState<Auction[]>([]);
  const [artworks, setArtworks]             = useState<Artwork[]>([]);
  const [loading, setLoading]               = useState(true);
  const [filter, setFilter]                 = useState<FilterStatus>('all');
  const [modalOpen, setModalOpen]           = useState(false);
  const [extendOpen, setExtendOpen]         = useState(false);
  const [imagesOpen, setImagesOpen]         = useState(false);
  const [editTarget, setEditTarget]         = useState<Auction | null>(null);
  const [extendTarget, setExtendTarget]     = useState<Auction | null>(null);
  const [imagesTarget, setImagesTarget]     = useState<Auction | null>(null);
  const [form, setForm]                     = useState<AuctionForm>(EMPTY_FORM);
  const [extendForm, setExtendForm]         = useState<ExtendForm>({ end_time: '', bid_increment: '' });
  const [pendingFiles, setPendingFiles]     = useState<PendingFile[]>([]);
  const [saving, setSaving]                 = useState(false);

  const canCreate = hasPermission('auctions.add_auction');
  const canManage = hasPermission('auctions.change_auction');
  const canDelete = hasPermission('auctions.delete_auction');

  const auctionedUuids = new Set(
    auctions
      .filter(a => a.status === 'pending' || a.status === 'live')
      .map(a => a.artwork_uuid)
  );
  const availableArtworks = artworks.filter(a => !auctionedUuids.has(a.uuid));
  const selectedArtwork = artworks.find(a => a.uuid === form.artwork_uuid) ?? null;

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
    setPendingFiles([]);
    setForm({ ...EMPTY_FORM, artwork_uuid: artworks[0]?.uuid || '', start_time: t.start, end_time: t.end });
    setModalOpen(true);
  };

  const openEdit = (a: Auction) => {
    setEditTarget(a);
    setPendingFiles([]);
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

  const openExtend = (a: Auction) => {
    setExtendTarget(a);
    setExtendForm({ end_time: new Date(a.end_time).toISOString().slice(0, 16), bid_increment: String(a.bid_increment) });
    setExtendOpen(true);
  };

  const openImages = (a: Auction) => {
    setImagesTarget(a);
    setImagesOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, reserve_price: form.reserve_price || null };
      if (editTarget) {
        await auctionsApi.update(editTarget.uuid, payload as Record<string, unknown>);
        success('Auction updated!');
        // Upload any new pending images for edit
        if (pendingFiles.length > 0) {
          await uploadFilesToAuction(editTarget.uuid, pendingFiles);
        }
      } else {
        const { data: created } = await auctionsApi.create(payload as Record<string, unknown>);
        if (pendingFiles.length > 0) {
          await uploadFilesToAuction(created.uuid, pendingFiles);
        }
        success('Auction created!');
      }
      setModalOpen(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      error(msg || (editTarget ? 'Failed to update auction' : 'Failed to create auction'));
    } finally { setSaving(false); }
  };

  const uploadFilesToAuction = async (uuid: string, files: PendingFile[]) => {
    for (const { file, isPrimary } of files) {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('is_primary', isPrimary ? 'true' : 'false');
      await auctionsApi.uploadImage(uuid, fd);
    }
  };

  const handleExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendTarget) return;
    setSaving(true);
    try {
      await auctionsApi.update(extendTarget.uuid, {
        end_time: extendForm.end_time,
        ...(extendForm.bid_increment ? { bid_increment: extendForm.bid_increment } : {}),
      });
      success('Auction updated!');
      setExtendOpen(false);
      load();
    } catch { error('Failed to update auction'); }
    finally { setSaving(false); }
  };

  const handleStart = async (a: Auction) => {
    const ok = await swal.confirm({
      title: `Start auction for "${a.artwork_name}"?`,
      text: 'It will go live immediately.',
    });
    if (!ok) return;
    try { await auctionsApi.start(a.uuid); success('Auction started!'); load(); }
    catch { error('Failed to start auction'); }
  };

  const handleEnd = async (a: Auction) => {
    const ok = await swal.confirm({
      title: `End auction for "${a.artwork_name}"?`,
      text: 'This will close bidding.',
      danger: true,
    });
    if (!ok) return;
    try { await auctionsApi.end(a.uuid); success('Auction ended!'); load(); }
    catch { error('Failed to end auction'); }
  };

  const handleDelete = async (a: Auction) => {
    const ok = await swal.confirmDelete(`Delete auction for "${a.artwork_name}"?`);
    if (!ok) return;
    try { await auctionsApi.delete(a.uuid); success('Auction deleted.'); load(); }
    catch { error('Failed to delete auction'); }
  };

  const counts: Record<FilterStatus, number> = {
    all:     auctions.length,
    live:    auctions.filter(a => a.status === 'live').length,
    pending: auctions.filter(a => a.status === 'pending').length,
    ended:   auctions.filter(a => a.status === 'ended').length,
  };

  const visible = filter === 'all' ? auctions : auctions.filter(a => a.status === filter);
  const nowStr  = new Date().toISOString().slice(0, 16);

  const sf = (k: keyof AuctionForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  // thumbnail: prefer primary_image, fallback to artwork_image
  const thumb = (a: Auction) => a.primary_image || a.artwork_image || null;

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
          <button key={s} onClick={() => setFilter(s)}
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
                  {['Artwork', 'Status', 'Price', 'Bids', 'Ends', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-50">
                {visible.map(a => (
                  <tr key={a.uuid} className={`hover:bg-earth-50 transition-colors ${a.status === 'live' ? 'bg-green-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail — stacked if multiple images */}
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-earth-100 border border-earth-200">
                            {thumb(a)
                              ? <img src={thumb(a)!} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><Gavel size={14} className="text-earth-300" /></div>}
                          </div>
                          {a.images && a.images.length > 1 && (
                            <span className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                              {a.images.length}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-earth-900 truncate max-w-[160px]">{a.artwork_name}</p>
                          <p className="text-xs text-earth-400 font-mono">{a.uuid.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {a.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />}
                        <StatusBadge status={a.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-earth-900">{a.currency} {a.current_price || a.start_price}</p>
                      {a.current_price && a.current_price !== a.start_price && (
                        <p className="text-xs text-earth-400">Start: {a.start_price}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                        a.total_bids > 0 ? 'bg-primary-50 text-primary-700' : 'bg-earth-100 text-earth-400'
                      }`}>
                        <TrendingUp size={11} /> {a.total_bids}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-earth-500">
                        <Clock size={11} /> {new Date(a.end_time).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/dashboard/auctions/${a.uuid}`}
                          className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="View">
                          <Eye size={14} className="text-earth-500" />
                        </Link>
                        {/* Images button */}
                        {canManage && (
                          <button onClick={() => openImages(a)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Manage Images">
                            <ImageIcon size={14} className="text-blue-500" />
                          </button>
                        )}
                        {canManage && a.status === 'pending' && (
                          <>
                            <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="Edit">
                              <Pencil size={14} className="text-earth-500" />
                            </button>
                            <button onClick={() => handleStart(a)}
                              className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2 py-1 rounded-lg transition-colors">
                              <Play size={11} /> Start
                            </button>
                          </>
                        )}
                        {canManage && a.status === 'live' && (
                          <>
                            <button onClick={() => openExtend(a)} className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Adjust">
                              <AlarmClock size={14} className="text-blue-500" />
                            </button>
                            <button onClick={() => handleEnd(a)}
                              className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition-colors">
                              <Square size={11} /> End
                            </button>
                          </>
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
            {counts.live > 0 && (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {counts.live} currently live
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? `Edit — ${editTarget.artwork_name}` : 'Create Auction'}
        size="lg"
        branded
      >
        <form onSubmit={handleSave} className="space-y-5">

          {/* Artwork selector */}
          {!editTarget ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide">
                Artwork <span className="text-red-400">*</span>
              </label>
              <select
                className="input"
                value={form.artwork_uuid}
                onChange={sf('artwork_uuid')}
                required
              >
                <option value="">Select artwork…</option>
                {availableArtworks.length === 0
                  ? <option disabled>No artworks available for auction</option>
                  : availableArtworks.map(a => <option key={a.uuid} value={a.uuid}>{a.name}</option>)
                }
              </select>

              {selectedArtwork ? (
                <div className="flex items-center gap-4 p-3 bg-earth-50 rounded-xl border border-earth-100">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-earth-200 shrink-0 border border-earth-200">
                    {selectedArtwork.image_url
                      ? <img src={selectedArtwork.image_url} alt={selectedArtwork.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-earth-300" /></div>
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-earth-900 text-sm">{selectedArtwork.name}</p>
                    {selectedArtwork.category && (
                      <p className="text-xs text-earth-500 mt-0.5">{selectedArtwork.category.name}</p>
                    )}
                    {selectedArtwork.pricing && (
                      <p className="text-xs font-semibold text-primary-600 mt-1">{selectedArtwork.pricing.formatted}</p>
                    )}
                    {selectedArtwork.dimensions && (
                      <p className="text-xs text-earth-400 mt-0.5">{selectedArtwork.dimensions}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-earth-50 rounded-xl border border-dashed border-earth-200">
                  <div className="w-20 h-20 rounded-xl bg-earth-100 flex items-center justify-center shrink-0">
                    <ImageIcon size={24} className="text-earth-300" />
                  </div>
                  <p className="text-sm text-earth-400">Select an artwork to preview it here</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-earth-50 rounded-xl p-3 border border-earth-100">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-earth-100 shrink-0 border border-earth-200">
                {(editTarget.primary_image || editTarget.artwork_image)
                  ? <img src={editTarget.primary_image || editTarget.artwork_image} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-earth-300" /></div>
                }
              </div>
              <div>
                <p className="text-xs text-earth-400 font-semibold uppercase tracking-wide">Artwork</p>
                <p className="font-semibold text-earth-900">{editTarget.artwork_name}</p>
                {editTarget.images && editTarget.images.length > 0 && (
                  <p className="text-xs text-earth-500 mt-0.5">{editTarget.images.length} image{editTarget.images.length !== 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          )}

          {/* Pricing row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">
                Start Price <span className="text-red-400">*</span>
              </label>
              <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
                value={form.start_price} onChange={sf('start_price')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">
                Reserve Price <span className="text-earth-400 normal-case font-normal">(optional)</span>
              </label>
              <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
                value={form.reserve_price} onChange={sf('reserve_price')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">
                Bid Increment <span className="text-red-400">*</span>
              </label>
              <input type="number" step="0.01" min="0.01" className="input"
                value={form.bid_increment} onChange={sf('bid_increment')} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">
                Currency <span className="text-red-400">*</span>
              </label>
              <input className="input uppercase font-mono tracking-widest text-center" maxLength={3}
                placeholder="USD" value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value.toUpperCase() }))} required />
            </div>
          </div>

          {/* Schedule section */}
          <div className="rounded-xl border border-earth-100 bg-earth-50 p-4 space-y-4">
            <p className="text-xs font-semibold text-earth-500 uppercase tracking-wide flex items-center gap-1.5">
              <CalendarClock size={13} /> Schedule
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DateTimePicker
                label="Start Time"
                required
                value={form.start_time}
                onChange={v => setForm(p => ({ ...p, start_time: v }))}
                min={nowStr}
              />
              <DateTimePicker
                label="End Time"
                required
                value={form.end_time}
                onChange={v => setForm(p => ({ ...p, end_time: v }))}
                min={form.start_time || nowStr}
              />
            </div>
          </div>

          {/* Images section */}
          {!editTarget ? (
            /* Create: pick files before the auction exists */
            <PendingImagePicker files={pendingFiles} onChange={setPendingFiles} />
          ) : (
            /* Edit: live image manager against existing auction */
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide">
                Images
              </label>
              <ImageManager
                auctionUuid={editTarget.uuid}
                existing={editTarget.images ?? []}
                onChanged={imgs => {
                  setAuctions(prev =>
                    prev.map(a => a.uuid === editTarget.uuid ? { ...a, images: imgs, primary_image: imgs.find(i => i.is_primary)?.image_url ?? a.primary_image } : a)
                  );
                }}
              />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Spinner size="sm" /> : <Check size={15} />}
            {saving ? (pendingFiles.length > 0 ? 'Creating & uploading images…' : 'Saving…') : editTarget ? 'Save Changes' : 'Create Auction'}
          </button>
        </form>
      </Modal>

      {/* ── Dedicated Image Manager modal ───────────────────────────────────── */}
      <Modal
        open={imagesOpen}
        onClose={() => { setImagesOpen(false); setImagesTarget(null); load(); }}
        title={`Images — ${imagesTarget?.artwork_name ?? ''}`}
        size="md"
      >
        {imagesTarget && (
          <ImageManager
            auctionUuid={imagesTarget.uuid}
            existing={imagesTarget.images ?? []}
            onChanged={imgs => {
              setAuctions(prev =>
                prev.map(a => a.uuid === imagesTarget.uuid
                  ? { ...a, images: imgs, primary_image: imgs.find(i => i.is_primary)?.image_url ?? a.primary_image }
                  : a
                )
              );
            }}
          />
        )}
      </Modal>

      {/* ── Extend Live Auction modal ────────────────────────────────────────── */}
      <Modal
        open={extendOpen}
        onClose={() => setExtendOpen(false)}
        title={`Adjust — ${extendTarget?.artwork_name ?? ''}`}
        size="sm"
      >
        <form onSubmit={handleExtend} className="space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <AlarmClock size={15} className="shrink-0 mt-0.5 text-amber-600" />
            <p>Extend or shorten the end time and adjust the bid increment while the auction is live.</p>
          </div>

          <DateTimePicker
            label="New End Time"
            required
            value={extendForm.end_time}
            onChange={v => setExtendForm(p => ({ ...p, end_time: v }))}
            min={nowStr}
          />

          <div>
            <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">
              Bid Increment <span className="text-earth-400 normal-case font-normal">(optional)</span>
            </label>
            <input type="number" step="0.01" min="0.01" className="input"
              placeholder="Leave unchanged"
              value={extendForm.bid_increment}
              onChange={e => setExtendForm(p => ({ ...p, bid_increment: e.target.value }))} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setExtendOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <Spinner size="sm" /> : <Check size={15} />}
              {saving ? 'Saving…' : 'Apply Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

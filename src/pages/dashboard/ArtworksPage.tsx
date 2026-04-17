import { useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Image, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload, X } from 'lucide-react';
import { artworksApi, categoriesApi } from '../../api';
import type { Artwork, Category } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { swal } from '../../lib/swal';

interface ArtworkForm { name: string; dimensions: string; base_price: string; category_uuid: string; is_sold: boolean; image?: File | null; }

const PAGE_SIZE = 10;

export function ArtworksPage() {
  const { hasPermission } = useAuth();
  const { success, error } = useToast();

  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Artwork | null>(null);
  const [form, setForm] = useState<ArtworkForm>({ name: '', dimensions: '', base_price: '', category_uuid: '', is_sold: false, image: null });
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When search triggers a load, suppress the page-effect duplicate
  const searchLoadingRef = useRef(false);

  const canCreate = hasPermission('artworks.add_artwork');
  const canEdit   = hasPermission('artworks.change_artwork');
  const canDelete = hasPermission('artworks.delete_artwork');

  // Categories load once — failure here must never block artworks
  useEffect(() => {
    categoriesApi.list()
      .then(res => setCategories(res.data.results || []))
      .catch(() => {});
  }, []);

  // Core load: receives explicit args — no stale closure possible
  const load = useCallback(async (pageVal: number, searchVal: string) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pageVal };
      if (searchVal.trim()) params.search = searchVal.trim();
      const { data } = await artworksApi.list(params);
      setArtworks(data.results);
      setTotal(data.count);
    } catch {
      error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Fires on mount + whenever the pagination page changes
  useEffect(() => {
    if (searchLoadingRef.current) {
      searchLoadingRef.current = false; // skip once — search already called load
      return;
    }
    load(page, search);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search input handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      searchLoadingRef.current = true; // tell page-effect to skip on the setPage(1) below
      setPage(1);
      load(1, value);
    }, 350);
  }, [load]);

  // Cleanup debounce timer on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Revoke any previous object URL to avoid memory leaks
  const setPreview = (file: File | null, fallback: string | null = null) => {
    setPreviewUrl(prev => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      if (file) return URL.createObjectURL(file);
      return fallback;
    });
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', dimensions: '', base_price: '', category_uuid: categories[0]?.uuid || '', is_sold: false, image: null });
    setPreview(null, null);
    setModalOpen(true);
  };

  const openEdit = (a: Artwork) => {
    setEditing(a);
    setForm({ name: a.name, dimensions: a.dimensions, base_price: String(a.pricing?.base_usd ?? ''), category_uuid: a.category?.uuid || '', is_sold: a.is_sold, image: null });
    setPreview(null, a.image_url || null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('dimensions', form.dimensions);
      fd.append('base_price', form.base_price);
      fd.append('category_uuid', form.category_uuid);
      fd.append('is_sold', String(form.is_sold));
      if (form.image) fd.append('image', form.image);
      if (editing) { await artworksApi.update(editing.uuid, fd); success('Artwork updated!'); }
      else { await artworksApi.create(fd); success('Artwork created!'); }
      setModalOpen(false);
      load(page, search);
    } catch { error('Failed to save artwork'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (a: Artwork) => {
    const ok = await swal.confirmDelete(`"${a.name}" will be permanently removed.`);
    if (!ok) return;
    try { await artworksApi.delete(a.uuid); success('Artwork deleted'); load(page, search); }
    catch { error('Failed to delete artwork'); }
  };

  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Artworks</h1>
          {!loading && <p className="text-sm text-earth-400 mt-0.5">{total} total artworks</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
            <input
              className="input pl-9 w-56 text-sm"
              placeholder="Search artworks..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          {canCreate && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm whitespace-nowrap">
              <Plus size={15} /> Add Artwork
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-earth-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-earth-50 border-b border-earth-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide w-16">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden lg:table-cell">Dimensions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Price (USD)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Status</th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex justify-center"><Spinner size="lg" /></div>
                  </td>
                </tr>
              ) : artworks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-earth-400">
                    <div className="flex flex-col items-center gap-2">
                      <Image size={32} className="text-earth-200" />
                      <p>{search ? `No artworks matching "${search}"` : 'No artworks yet.'}</p>
                      {canCreate && !search && (
                        <button onClick={openCreate} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1">
                          Add your first artwork →
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                artworks.map((a, i) => (
                  <tr key={a.uuid} className={`hover:bg-primary-50/30 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-earth-50/30'}`}>
                    <td className="px-4 py-3">
                      <div className="w-12 h-10 bg-earth-100 rounded-lg overflow-hidden shrink-0">
                        {a.image_url
                          ? <img src={a.image_url} alt={a.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Image size={16} className="text-earth-300" /></div>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-earth-900">{a.name}</span>
                    </td>
                    <td className="px-4 py-3 text-earth-500 hidden md:table-cell">
                      {a.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-earth-500 hidden lg:table-cell">
                      {a.dimensions}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-primary-700">
                        {a.pricing ? `$${a.pricing.base_usd}` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={a.is_sold ? 'Sold' : 'Available'} color={a.is_sold ? 'red' : 'green'} />
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => openEdit(a)}
                              className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil size={14} className="text-earth-500" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(a)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-earth-100 bg-earth-50/50">
            <p className="text-xs text-earth-400">
              Showing <span className="font-medium text-earth-700">{start}–{end}</span> of <span className="font-medium text-earth-700">{total}</span> artworks
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft size={15} className="text-earth-600" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous"
              >
                <ChevronLeft size={15} className="text-earth-600" />
              </button>

              {/* Page number pills */}
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '…' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-earth-400 text-xs">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                          page === p
                            ? 'bg-primary-600 text-white'
                            : 'hover:bg-earth-100 text-earth-600'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                }
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next"
              >
                <ChevronRight size={15} className="text-earth-600" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight size={15} className="text-earth-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Artwork' : 'Add Artwork'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Category</label>
            <select className="input" value={form.category_uuid} onChange={e => setForm(f => ({ ...f, category_uuid: e.target.value }))} required>
              <option value="">Select category...</option>
              {categories.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Dimensions</label>
              <input className="input" placeholder="e.g. 60x90" value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Base Price (USD)</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="250.00" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} required />
            </div>
          </div>
          {/* Image upload with preview */}
          <div>
            <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1">
              Image {editing && <span className="text-xs text-earth-400 font-normal">(leave empty to keep current)</span>}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0] || null;
                setForm(f => ({ ...f, image: file }));
                setPreview(file, editing?.image_url || null);
              }}
            />
            {previewUrl ? (
              <div className="relative group rounded-xl overflow-hidden border-2 border-earth-200 dark:border-earth-600 bg-earth-50 dark:bg-earth-700">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-earth-900 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    <Upload size={13} /> Change
                  </button>
                  {form.image && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, image: null }));
                        setPreview(null, editing?.image_url || null);
                        if (fileRef.current) fileRef.current.value = '';
                      }}
                      className="flex items-center gap-1.5 bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      <X size={13} /> Remove
                    </button>
                  )}
                </div>
                {/* New file badge */}
                {form.image && (
                  <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    New
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-earth-300 dark:border-earth-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group"
              >
                <div className="w-10 h-10 bg-earth-100 dark:bg-earth-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 rounded-full flex items-center justify-center transition-colors">
                  <Upload size={18} className="text-earth-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-earth-600 dark:text-earth-400 group-hover:text-primary-600 transition-colors">Click to upload image</p>
                  <p className="text-xs text-earth-400 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </button>
            )}
            {form.image && (
              <p className="text-xs text-earth-400 mt-1.5 truncate">
                Selected: <span className="font-medium text-earth-600 dark:text-earth-300">{form.image.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_sold" checked={form.is_sold} onChange={e => setForm(f => ({ ...f, is_sold: e.target.checked }))} className="w-4 h-4 rounded accent-primary-600" />
            <label htmlFor="is_sold" className="text-sm text-earth-700">Mark as sold</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? <><Spinner size="sm" /> Saving...</> : editing ? 'Save Changes' : 'Add Artwork'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

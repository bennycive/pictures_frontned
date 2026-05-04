import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Plus, Search, Pencil, Trash2, Image, Eye,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Upload, X, Filter, Calendar, Layers, Star, Images,
} from 'lucide-react';
import { artworksApi, categoriesApi } from '../../api';
import type { Artwork, ArtworkImage, Category } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Logo } from '../../components/ui/Logo';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { swal } from '../../lib/swal';

interface ArtworkForm {
  name: string; dimensions: string; base_price: string;
  category_uuid: string; is_sold: boolean;
}

type PendingFile = { file: File; preview: string; isPrimary: boolean; description: string };

const PAGE_SIZES = [10, 25, 50];

// ── Image Manager (existing artwork) ──────────────────────────────────────────
function ImageManager({ artworkUuid, onUpdated }: { artworkUuid: string; onUpdated: () => void }) {
  const { error: showError, success } = useToast();
  const [images, setImages] = useState<ArtworkImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingDescriptionId, setSavingDescriptionId] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    try {
      const { data } = await artworksApi.listImages(artworkUuid);
      setImages(data);
    } finally {
      setLoading(false);
    }
  }, [artworkUuid]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('image', file);
        fd.append('description', '');
        await artworksApi.uploadImage(artworkUuid, fd);
      }
      await fetchImages();
      onUpdated();
    } catch { showError('Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDelete = async (img: ArtworkImage) => {
    const ok = await swal.confirmDelete('This image will be permanently removed.');
    if (!ok) return;
    try {
      await artworksApi.deleteImage(artworkUuid, img.id);
      await fetchImages();
      onUpdated();
    } catch { showError('Failed to delete image'); }
  };

  const handleSetPrimary = async (img: ArtworkImage) => {
    try {
      await artworksApi.setPrimaryImage(artworkUuid, img.id);
      await fetchImages();
      onUpdated();
    } catch { showError('Failed to set primary image'); }
  };

  const handleDescriptionChange = (id: number, description: string) => {
    setImages(current => current.map(img => img.id === id ? { ...img, description } : img));
  };

  const handleSaveDescription = async (img: ArtworkImage) => {
    setSavingDescriptionId(img.id);
    try {
      await artworksApi.updateImage(artworkUuid, img.id, { description: img.description });
      await fetchImages();
      onUpdated();
      success('Photo description saved');
    } catch { showError('Failed to save description'); }
    finally { setSavingDescriptionId(null); }
  };

  if (loading) return <div className="flex justify-center py-8"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleUpload(e.target.files)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {images.map(img => (
          <div key={img.id} className="rounded-xl border border-earth-100 bg-earth-50 p-3 space-y-2">
            <div className="flex gap-3">
              <div className="relative group shrink-0">
                <img
                  src={img.image_url ?? ''}
                  alt={img.description || 'Artwork photo'}
                  className={`w-24 h-24 object-cover rounded-xl border-2 transition-all ${
                    img.is_primary ? 'border-primary-500' : 'border-earth-200'
                  }`}
                />
                {img.is_primary && (
                  <div className="absolute top-0 inset-x-0 text-center bg-primary-500 text-white text-[10px] font-bold rounded-t-xl py-0.5">
                    Primary
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(img)}
                      title="Set as primary"
                      className="bg-white/90 hover:bg-white p-1.5 rounded-lg text-earth-900 transition-colors"
                    >
                      <Star size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img)}
                    title="Delete"
                    className="bg-red-500/90 hover:bg-red-500 p-1.5 rounded-lg text-white transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-[11px] font-semibold text-earth-500 uppercase tracking-wide mb-1">
                  Photo Description
                </label>
                <textarea
                  className="input w-full min-h-[72px] resize-y text-xs"
                  placeholder="Describe this photo..."
                  value={img.description || ''}
                  onChange={e => handleDescriptionChange(img.id, e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveDescription(img)}
                disabled={savingDescriptionId === img.id}
                className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {savingDescriptionId === img.id ? 'Saving...' : 'Save Description'}
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-earth-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary-400 hover:bg-primary-50/30 transition-colors disabled:opacity-60"
        >
          {uploading ? <Spinner size="sm" /> : (
            <>
              <Upload size={18} className="text-earth-400" />
              <span className="text-xs text-earth-400">Add</span>
            </>
          )}
        </button>
      </div>

      {images.length === 0 && !uploading && (
        <p className="text-sm text-earth-400 text-center py-2">
          No images yet. Click "Add" to upload.
        </p>
      )}

      <p className="text-xs text-earth-400">Click the ★ icon to set an image as primary. Multiple files allowed.</p>
    </div>
  );
}

// ── Pending Image Picker (new artwork, pre-creation) ──────────────────────────
function PendingImagePicker({ files, onChange }: {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
}) {
  const addRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: files.length === 0 && i === 0,
      description: '',
    }));
    onChange([...files, ...newFiles]);
  };

  const remove = (idx: number) => {
    const removed = files[idx];
    const next = files.filter((_, i) => i !== idx);
    if (removed.isPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true };
    }
    URL.revokeObjectURL(removed.preview);
    onChange(next);
  };

  const setPrimary = (idx: number) => {
    onChange(files.map((f, i) => ({ ...f, isPrimary: i === idx })));
  };

  const setDescription = (idx: number, description: string) => {
    onChange(files.map((f, i) => i === idx ? { ...f, description } : f));
  };

  return (
    <div>
      <input
        ref={addRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => { addFiles(e.target.files); if (addRef.current) addRef.current.value = ''; }}
      />

      {files.length === 0 ? (
        <button
          type="button"
          onClick={() => addRef.current?.click()}
          className="w-full h-36 border-2 border-dashed border-earth-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-400 hover:bg-primary-50/30 transition-colors group"
        >
          <div className="w-10 h-10 bg-earth-100 group-hover:bg-primary-100 rounded-full flex items-center justify-center transition-colors">
            <Upload size={18} className="text-earth-400 group-hover:text-primary-600 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-earth-600 group-hover:text-primary-600 transition-colors">Click to upload images</p>
            <p className="text-xs text-earth-400 mt-0.5">PNG, JPG, WEBP • Multiple allowed</p>
          </div>
        </button>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {files.map((pf, idx) => (
              <div key={idx} className="rounded-xl border border-earth-100 bg-earth-50 p-3">
                <div className="flex gap-3">
                  <div className="relative group shrink-0">
                    <img
                      src={pf.preview}
                      alt={pf.description || 'Selected artwork photo'}
                      onClick={() => setPrimary(idx)}
                      className={`w-20 h-20 object-cover rounded-xl border-2 cursor-pointer transition-all ${
                        pf.isPrimary ? 'border-primary-500' : 'border-earth-200 hover:border-earth-300'
                      }`}
                    />
                    {pf.isPrimary && (
                      <div className="absolute top-0 inset-x-0 text-center bg-primary-500 text-white text-[10px] font-bold rounded-t-xl py-0.5">
                        Primary
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-semibold text-earth-500 uppercase tracking-wide mb-1">
                      Photo Description
                    </label>
                    <textarea
                      className="input w-full min-h-[72px] resize-y text-xs"
                      placeholder="Describe this photo..."
                      value={pf.description}
                      onChange={e => setDescription(idx, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addRef.current?.click()}
              className="w-20 h-20 border-2 border-dashed border-earth-300 rounded-xl flex items-center justify-center hover:border-primary-400 hover:bg-primary-50/30 transition-colors"
            >
              <Plus size={20} className="text-earth-400" />
            </button>
          </div>
          <p className="text-xs text-earth-400">Click an image to set it as primary. Add a short description for each photo.</p>
        </div>
      )}
    </div>
  );
}


export function ArtworksPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();

  const [artworks, setArtworks]       = useState<Artwork[]>([]);
  const [categories, setCategories]   = useState<Category[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]               = useState(1);
  const [pageSize, setPageSize]       = useState(10);
  const [total, setTotal]             = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter]     = useState('');

  // Edit/create modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Artwork | null>(null);
  const [form, setForm]           = useState<ArtworkForm>({ name: '', dimensions: '', base_price: '', category_uuid: '', is_sold: false });
  const [saving, setSaving]       = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  // View detail modal
  const [viewing, setViewing] = useState<Artwork | null>(null);

  // Images modal
  const [imagesArtwork, setImagesArtwork] = useState<Artwork | null>(null);

  const debounceRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchLoadingRef  = useRef(false);

  const canCreate = hasPermission('artworks.add_artwork');
  const canEdit   = hasPermission('artworks.change_artwork');
  const canDelete = hasPermission('artworks.delete_artwork');

  useEffect(() => {
    categoriesApi.list()
      .then(res => setCategories(res.data.results || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async (pageVal: number, searchVal: string, catVal: string, statusVal: string, sizeVal: number) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: pageVal, page_size: sizeVal };
      if (searchVal.trim())  params.search        = searchVal.trim();
      if (catVal)            params.category_uuid = catVal;
      if (statusVal !== '')  params.is_sold        = statusVal;
      const { data } = await artworksApi.list(params);
      setArtworks(data.results);
      setTotal(data.count);
    } catch {
      error('Failed to load artworks');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (searchLoadingRef.current) { searchLoadingRef.current = false; return; }
    load(page, search, categoryFilter, statusFilter, pageSize);
  }, [page, pageSize, categoryFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      searchLoadingRef.current = true;
      setPage(1);
      load(1, value, categoryFilter, statusFilter, pageSize);
    }, 350);
  }, [load, categoryFilter, statusFilter, pageSize]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const resetPage = (cb: () => void) => { setPage(1); cb(); };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start      = (page - 1) * pageSize + 1;
  const end        = Math.min(page * pageSize, total);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', dimensions: '', base_price: '', category_uuid: categories[0]?.uuid || '', is_sold: false });
    setPendingFiles([]);
    setModalOpen(true);
  };

  const openEdit = (a: Artwork) => {
    setEditing(a);
    setForm({ name: a.name, dimensions: a.dimensions, base_price: String(a.pricing?.base_usd ?? ''), category_uuid: a.category?.uuid || '', is_sold: a.is_sold });
    setPendingFiles([]);
    setViewing(null);
    setModalOpen(true);
  };

  const uploadPendingImages = async (uuid: string) => {
    const primaryIdx = pendingFiles.findIndex(f => f.isPrimary);
    const ordered = primaryIdx >= 0
      ? [pendingFiles[primaryIdx], ...pendingFiles.filter((_, i) => i !== primaryIdx)]
      : pendingFiles;

    for (let i = 0; i < ordered.length; i++) {
      const pf = ordered[i];
      const fd = new FormData();
      fd.append('image', pf.file);
      fd.append('description', pf.description);
      if (i === 0) fd.append('is_primary', 'true');
      await artworksApi.uploadImage(uuid, fd);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('dimensions', form.dimensions);
      fd.append('base_price', form.base_price);
      fd.append('category_uuid', form.category_uuid);
      fd.append('is_sold', String(form.is_sold));

      if (editing) {
        await artworksApi.update(editing.uuid, fd);
        swal.success('Artwork updated!');
      } else {
        const { data: newArtwork } = await artworksApi.create(fd);
        if (pendingFiles.length > 0) {
          await uploadPendingImages(newArtwork.uuid);
        }
        swal.success('Artwork created!');
      }

      // Cleanup pending previews
      pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
      setPendingFiles([]);
      setModalOpen(false);
      load(page, search, categoryFilter, statusFilter, pageSize);
    } catch { error('Failed to save artwork'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (a: Artwork) => {
    const ok = await swal.confirmDelete(`"${a.name}" will be permanently removed.`);
    if (!ok) return;
    try { await artworksApi.delete(a.uuid); swal.success('Artwork deleted'); load(page, search, categoryFilter, statusFilter, pageSize); }
    catch { error('Failed to delete artwork'); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Artworks</h1>
          {!loading && <p className="text-sm text-earth-400 mt-0.5">{total} total artworks</p>}
        </div>
        {canCreate && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm whitespace-nowrap self-start sm:self-auto">
            <Plus size={15} /> Add Artwork
          </button>
        )}
      </div>

      {/* Filters toolbar */}
      <div className="bg-white rounded-xl border border-earth-100 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
          <input
            className="input pl-9 text-sm w-full"
            placeholder="Search by name, category..."
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="relative">
          <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
          <select
            value={categoryFilter}
            onChange={e => resetPage(() => setCategoryFilter(e.target.value))}
            className="input pl-8 text-sm pr-8 min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.uuid} value={c.uuid}>{c.name}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => resetPage(() => setStatusFilter(e.target.value))}
            className="input pl-8 text-sm pr-8"
          >
            <option value="">All Status</option>
            <option value="false">Available</option>
            <option value="true">Sold</option>
          </select>
        </div>
        <select
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          className="input text-sm w-auto"
        >
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-earth-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-earth-50 border-b border-earth-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide w-14">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide hidden lg:table-cell">Dimensions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-earth-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-earth-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {loading ? (
                <tr><td colSpan={8} className="py-16 text-center"><div className="flex justify-center"><Spinner size="lg" /></div></td></tr>
              ) : artworks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-earth-400">
                    <div className="flex flex-col items-center gap-2">
                      <Image size={32} className="text-earth-200" />
                      <p>{search ? `No artworks matching "${search}"` : 'No artworks found.'}</p>
                      {canCreate && !search && (
                        <button onClick={openCreate} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-1">Add your first artwork →</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                artworks.map((a, i) => {
                  const thumb = a.primary_image || a.image_url;
                  const imgCount = a.images?.length ?? 0;
                  return (
                    <tr
                      key={a.uuid}
                      className={`hover:bg-primary-50/30 transition-colors cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-earth-50/30'}`}
                      onClick={() => setViewing(a)}
                    >
                      <td className="px-4 py-3 text-xs text-earth-400">{start + i}</td>
                      <td className="px-4 py-3">
                        <div className="relative w-12 h-10 bg-earth-100 rounded-lg overflow-hidden shrink-0">
                          {thumb
                            ? <img src={thumb} alt={a.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Image size={16} className="text-earth-300" /></div>
                          }
                          {imgCount > 1 && (
                            <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] font-bold px-1 rounded-tl">
                              {imgCount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-earth-900">{a.name}</span>
                      </td>
                      <td className="px-4 py-3 text-earth-500 hidden md:table-cell">{a.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-earth-500 hidden lg:table-cell">{a.dimensions}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-primary-700">
                          {a.pricing ? `$${Number(a.pricing.base_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={a.is_sold ? 'Sold' : 'Available'} color={a.is_sold ? 'red' : 'green'} />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewing(a)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="View details">
                            <Eye size={14} className="text-earth-400" />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => setImagesArtwork(a)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="Manage images">
                                <Images size={14} className="text-earth-500" />
                              </button>
                              <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors" title="Edit">
                                <Pencil size={14} className="text-earth-500" />
                              </button>
                            </>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(a)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={14} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {!loading && total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-earth-100 bg-earth-50/50 gap-2">
            <p className="text-xs text-earth-400">
              Showing <span className="font-medium text-earth-700">{start}–{end}</span> of <span className="font-medium text-earth-700">{total}</span> artworks
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="First">
                <ChevronsLeft size={15} className="text-earth-600" />
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Previous">
                <ChevronLeft size={15} className="text-earth-600" />
              </button>
              <div className="flex items-center gap-1 mx-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, idx) => p === '…' ? (
                    <span key={`e${idx}`} className="px-1 text-earth-400 text-xs">…</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p as number)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'bg-primary-600 text-white' : 'hover:bg-earth-100 text-earth-600'}`}>
                      {p}
                    </button>
                  ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Next">
                <ChevronRight size={15} className="text-earth-600" />
              </button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-earth-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Last">
                <ChevronsRight size={15} className="text-earth-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Images Modal ── */}
      <Modal
        open={!!imagesArtwork}
        onClose={() => { setImagesArtwork(null); load(page, search, categoryFilter, statusFilter, pageSize); }}
        title={`Images — ${imagesArtwork?.name ?? ''}`}
        size="lg"
      >
        {imagesArtwork && (
          <ImageManager
            artworkUuid={imagesArtwork.uuid}
            onUpdated={() => load(page, search, categoryFilter, statusFilter, pageSize)}
          />
        )}
      </Modal>

      {/* ── View Detail Modal ── */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="" size="lg">
        {viewing && (
          <div className="space-y-5">
            <div className="flex items-center justify-center pb-3 border-b border-earth-100">
              <Logo variant="dark" className="h-7 w-auto" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Gallery preview in view modal */}
              <div className="space-y-2">
                <div className="rounded-xl overflow-hidden bg-earth-100 aspect-[4/3]">
                  {(viewing.primary_image || viewing.image_url) ? (
                    <img
                      src={viewing.primary_image || viewing.image_url}
                      alt={viewing.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Image size={40} className="text-earth-300" /></div>
                  )}
                </div>
                {viewing.images?.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto">
                    {viewing.images.slice(0, 6).map(img => (
                      <img key={img.id} src={img.image_url ?? ''} alt="" className="w-12 h-10 object-cover rounded-lg shrink-0 border border-earth-200" />
                    ))}
                    {viewing.images.length > 6 && (
                      <div className="w-12 h-10 rounded-lg bg-earth-100 flex items-center justify-center shrink-0 text-xs text-earth-400 font-medium">
                        +{viewing.images.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-earth-900">{viewing.name}</h2>
                  <Badge label={viewing.is_sold ? 'Sold' : 'Available'} color={viewing.is_sold ? 'red' : 'green'} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-earth-600">
                    <Layers size={14} className="text-earth-400 shrink-0" />
                    <span className="font-medium text-earth-500 w-24 shrink-0">Category</span>
                    <span className="text-earth-900">{viewing.category?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-earth-600">
                    <span className="text-lg shrink-0">📐</span>
                    <span className="font-medium text-earth-500 w-24 shrink-0">Dimensions</span>
                    <span className="text-earth-900">{viewing.dimensions || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-earth-600">
                    <span className="text-lg shrink-0">💵</span>
                    <span className="font-medium text-earth-500 w-24 shrink-0">Base Price</span>
                    <span className="text-earth-900 font-semibold text-primary-700">
                      {viewing.pricing ? `$${Number(viewing.pricing.base_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </span>
                  </div>
                  {viewing.pricing && viewing.pricing.currency_code !== 'USD' && (
                    <div className="flex items-center gap-2 text-earth-600">
                      <span className="text-lg shrink-0">💱</span>
                      <span className="font-medium text-earth-500 w-24 shrink-0">Converted</span>
                      <span className="text-earth-900">{viewing.pricing.formatted}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-earth-600">
                    <Calendar size={14} className="text-earth-400 shrink-0" />
                    <span className="font-medium text-earth-500 w-24 shrink-0">Added</span>
                    <span className="text-earth-900">{new Date(viewing.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-earth-600">
                    <Images size={14} className="text-earth-400 shrink-0" />
                    <span className="font-medium text-earth-500 w-24 shrink-0">Photos</span>
                    <span className="text-earth-900">{viewing.images?.length ?? 0} image{(viewing.images?.length ?? 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-earth-100">
              <button onClick={() => setViewing(null)} className="btn-secondary flex-1">Close</button>
              {canEdit && (
                <>
                  <button onClick={() => { setViewing(null); setImagesArtwork(viewing); }} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border border-earth-200 hover:bg-earth-50 rounded-xl transition-colors">
                    <Images size={14} /> Images
                  </button>
                  <button onClick={() => openEdit(viewing)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <Pencil size={14} /> Edit Artwork
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={async () => { await handleDelete(viewing); setViewing(null); }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Artwork' : 'Add Artwork'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Images — shown first so they're immediately visible */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              {editing ? 'Photos' : 'Photos'}
              {!editing && <span className="text-xs text-earth-400 font-normal ml-1">— click an image to set it as primary</span>}
              {editing && <span className="text-xs text-earth-400 font-normal ml-1">— use the Images button to add or change photos</span>}
            </label>
            {editing ? (
              <div className="flex items-center gap-3 p-3 bg-earth-50 rounded-xl border border-earth-100">
                {(editing.primary_image || editing.image_url) ? (
                  <img
                    src={editing.primary_image || editing.image_url}
                    alt={editing.name}
                    className="w-20 h-16 object-cover rounded-lg border border-earth-200 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-16 bg-earth-100 rounded-lg flex items-center justify-center shrink-0">
                    <Image size={20} className="text-earth-300" />
                  </div>
                )}
                <div className="text-xs text-earth-500">
                  <p className="font-medium text-earth-700 mb-0.5">
                    {editing.images?.length
                      ? `${editing.images.length} photo${editing.images.length !== 1 ? 's' : ''} attached`
                      : 'No photos yet'}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setModalOpen(false); setImagesArtwork(editing); }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Manage Photos →
                  </button>
                </div>
              </div>
            ) : (
              <PendingImagePicker files={pendingFiles} onChange={setPendingFiles} />
            )}
          </div>

          <div className="border-t border-earth-100 pt-4 space-y-4">
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
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_sold" checked={form.is_sold} onChange={e => setForm(f => ({ ...f, is_sold: e.target.checked }))} className="w-4 h-4 rounded accent-primary-600" />
              <label htmlFor="is_sold" className="text-sm text-earth-700">Mark as sold</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-earth-100">
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

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Tag, X, Check, Layers } from 'lucide-react'; // X used in search clear
import { categoriesApi } from '../../api';
import type { Category } from '../../api/types';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { swal } from '../../lib/swal';

// Deterministic pastel colour per category name initial
const PALETTE = [
  'bg-primary-100 text-primary-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];
const chipColor = (name: string) => PALETTE[name.charCodeAt(0) % PALETTE.length];

export function CategoriesPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Category | null>(null);
  const [creating, setCreating]     = useState(false);
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving]         = useState(false);

  const canCreate = hasPermission('artworks.add_category');
  const canEdit   = hasPermission('artworks.change_category');
  const canDelete = hasPermission('artworks.delete_category');

  const load = async () => {
    setLoading(true);
    try { const { data } = await categoriesApi.list({ search }); setCategories(data.results); }
    catch { error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput.trim()); };
  const clearSearch = () => { setSearchInput(''); setSearch(''); };

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setCreating(true); };
  const openEdit   = (c: Category) => { setCreating(false); setEditing(c); setName(c.name); setDescription(c.description || ''); setModalOpen(true); };
  const cancelForm = () => { setEditing(null); setCreating(false); setModalOpen(false); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await categoriesApi.update(editing.uuid, { name, description }); swal.success('Category updated!'); }
      else         { await categoriesApi.create({ name, description }); swal.success('Category created!'); }
      setModalOpen(false);
      setCreating(false);
      setEditing(null);
      load();
    } catch { error('Failed to save category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Category) => {
    const ok = await swal.confirmDelete(`Delete "${c.name}"? This will affect all artworks in this category.`);
    if (!ok) return;
    try { await categoriesApi.delete(c.uuid); swal.success('Category deleted'); load(); }
    catch { error('Failed to delete category'); }
  };

  const totalArtworks = categories.reduce((s, c) => s + c.artworks_count, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Categories</h1>
          <p className="text-sm text-earth-500 mt-0.5">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'} · {totalArtworks} artworks total
          </p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              className="input pl-9 pr-8 text-sm w-52"
              placeholder="Search categories…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                <X size={13} />
              </button>
            )}
          </form>
          {canCreate && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Inline create form */}
      {creating && (
        <div className="bg-white rounded-2xl border-2 border-primary-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-earth-100 bg-primary-50/40">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <Plus size={15} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-earth-900">New Category</h3>
          </div>
          <form onSubmit={handleSave} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Name <span className="text-red-400">*</span></label>
                <input className="input w-full text-sm" placeholder="e.g. Painting" required value={name} onChange={e => setName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Description</label>
                <input className="input w-full text-sm" placeholder="Optional short description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors">
                {saving ? <Spinner size="sm" /> : <Check size={14} />}
                {saving ? 'Saving…' : 'Create Category'}
              </button>
              <button type="button" onClick={cancelForm} className="text-sm border border-earth-200 text-earth-500 hover:bg-earth-50 px-4 py-2 rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {loading ? <SectionSpinner /> : categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-earth-100 p-16 text-center">
          <div className="w-16 h-16 bg-earth-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag size={28} className="text-earth-300" />
          </div>
          <p className="font-medium text-earth-600 mb-1">No categories found</p>
          <p className="text-sm text-earth-400">
            {search ? `No results for "${search}"` : 'Add your first category to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3 bg-earth-50 border-b border-earth-100 text-xs font-semibold text-earth-500 uppercase tracking-wide">
            <span className="w-8" />
            <span>Category</span>
            <span className="text-center w-24">Artworks</span>
            {(canEdit || canDelete) && <span className="w-16 text-right">Actions</span>}
          </div>

          <div className="divide-y divide-earth-50">
            {categories.map(cat => (
              <div key={cat.uuid}>
                  <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-earth-50 transition-colors group">
                    {/* Avatar chip */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${chipColor(cat.name)}`}>
                      {cat.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + meta */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-earth-900 text-sm">{cat.name}</span>
                        <code className="text-[10px] bg-earth-100 text-earth-500 px-1.5 py-0.5 rounded font-mono">{cat.slug}</code>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-earth-500 mt-0.5 truncate max-w-sm">{cat.description}</p>
                      )}
                    </div>

                    {/* Artwork count badge */}
                    <div className="w-24 flex justify-center">
                      <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        cat.artworks_count > 0 ? 'bg-primary-50 text-primary-700' : 'bg-earth-100 text-earth-400'
                      }`}>
                        <Layers size={11} />
                        {cat.artworks_count}
                      </span>
                    </div>

                    {/* Actions */}
                    {(canEdit || canDelete) && (
                      <div className="w-16 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} className="text-earth-500" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-earth-100 text-xs text-earth-400 flex items-center justify-between">
            <span>{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>
            <span>{totalArtworks} artworks across all categories</span>
          </div>
        </div>
      )}

      {/* Edit modal with logo */}
      <Modal open={modalOpen} onClose={cancelForm} title={editing ? `Edit — ${editing.name}` : 'Edit Category'} size="sm" branded>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Name <span className="text-red-400">*</span></label>
            <input className="input w-full" required autoFocus value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-earth-500 uppercase tracking-wide mb-1.5">Description</label>
            <textarea className="input w-full resize-none h-20" placeholder="Optional description…" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <Spinner size="sm" /> : <Check size={15} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

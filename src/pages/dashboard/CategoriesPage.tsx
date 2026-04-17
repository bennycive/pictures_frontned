import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { categoriesApi } from '../../api';
import type { Category } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { swal } from '../../lib/swal';

export function CategoriesPage() {
  const { hasPermission } = useAuth();
  const { error } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission('artworks.add_category');
  const canEdit = hasPermission('artworks.change_category');
  const canDelete = hasPermission('artworks.delete_category');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await categoriesApi.list({ search });
      setCategories(data.results);
    } catch { error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setName(''); setDescription(''); setModalOpen(true); };
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setDescription(c.description || ''); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await categoriesApi.update(editing.uuid, { name, description }); swal.success('Category updated!'); }
      else { await categoriesApi.create({ name, description }); swal.success('Category created!'); }
      setModalOpen(false);
      load();
    } catch { error('Failed to save category'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Category) => {
    const ok = await swal.confirmDelete(`Delete category "${c.name}"? This will affect all artworks in this category.`);
    if (!ok) return;
    try { await categoriesApi.delete(c.uuid); swal.success('Category deleted'); load(); }
    catch { error('Failed to delete category'); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (c: Category) => <span className="font-medium text-earth-900">{c.name}</span> },
    { key: 'slug', header: 'Slug', render: (c: Category) => <code className="text-xs bg-earth-100 px-2 py-0.5 rounded">{c.slug}</code> },
    { key: 'description', header: 'Description', render: (c: Category) => <span className="text-earth-600 text-sm">{c.description || <span className="italic text-earth-400">—</span>}</span> },
    { key: 'artworks_count', header: 'Artworks', render: (c: Category) => <span className="font-medium">{c.artworks_count}</span> },
    { key: 'actions', header: 'Actions', render: (c: Category) => (
      <div className="flex gap-2">
        {canEdit && <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-earth-100 rounded-lg"><Pencil size={15} className="text-earth-600" /></button>}
        {canDelete && <button onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={15} className="text-red-500" /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-earth-900">Categories</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input className="input pl-9 w-56" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {canCreate && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
      </div>
      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <Table columns={columns} data={categories} keyField="uuid" emptyMessage="No categories found." />
      )}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Description</label>
            <textarea className="input min-h-[80px] resize-y" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

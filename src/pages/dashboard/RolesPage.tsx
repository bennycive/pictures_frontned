import { useEffect, useState } from 'react';
import { Shield, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { rolesApi, permissionsApi } from '../../api';
import type { Role, Permission } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';

export function RolesPage() {
  const { error } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: '', permission_ids: [] as number[] });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
      setRoles(r.data);
      setPermissions(p.data);
    } catch { error('Failed to load roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', permission_ids: [] });
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({ name: role.name, permission_ids: role.permissions.map(p => p.id) });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const togglePermission = (id: number) => {
    setForm(f => ({
      ...f,
      permission_ids: f.permission_ids.includes(id)
        ? f.permission_ids.filter(x => x !== id)
        : [...f.permission_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await rolesApi.update(editing.id, form);
        swal.success('Role updated');
      } else {
        await rolesApi.create(form);
        swal.success('Role created');
      }
      closeModal();
      load();
    } catch { error('Failed to save role'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    const ok = await swal.confirmDelete(`Delete role "${name}"? Users with this role will lose its permissions.`);
    if (!ok) return;
    setDeletingId(id);
    try {
      await rolesApi.delete(id);
      swal.success('Role deleted');
      load();
    } catch { error('Failed to delete role'); }
    finally { setDeletingId(null); }
  };

  // Group permissions by app label
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const app = p.content_type.split(' | ')[0] || 'Other';
    (acc[app] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-earth-900">Roles</h2>
          <p className="text-sm text-earth-500 mt-0.5">{roles.length} roles configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={16} /> New Role
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : roles.length === 0 ? (
        <div className="text-center py-16 text-earth-400">No roles found. Create your first role.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-white border border-earth-100 rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-primary-500 shrink-0" />
                  <span className="font-semibold text-earth-900">{role.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(role)}
                    className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} className="text-earth-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id, role.name)}
                    disabled={deletingId === role.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    {deletingId === role.id
                      ? <Spinner size="sm" />
                      : <Trash2 size={14} className="text-red-400" />}
                  </button>
                </div>
              </div>

              <div className="text-xs text-earth-500">
                {role.users_count} {role.users_count === 1 ? 'user' : 'users'} &middot;{' '}
                {role.permissions.length} {role.permissions.length === 1 ? 'permission' : 'permissions'}
              </div>

              {role.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 5).map(p => (
                    <span key={p.id} className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
                      {p.codename}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="text-[10px] bg-earth-100 text-earth-500 px-2 py-0.5 rounded-full">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-10 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-earth-100">
              <h3 className="font-bold text-earth-900">{editing ? 'Edit Role' : 'New Role'}</h3>
              <button onClick={closeModal} className="p-1 hover:bg-earth-100 rounded-lg">
                <X size={18} className="text-earth-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1.5">Role name</label>
                <input
                  className="input w-full"
                  placeholder="e.g. Editor"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-2">
                  Permissions ({form.permission_ids.length} selected)
                </label>
                <div className="border border-earth-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  {Object.entries(grouped).map(([app, perms]) => (
                    <div key={app}>
                      <div className="px-3 py-1.5 bg-earth-50 border-b border-earth-100 text-[10px] font-bold text-earth-500 uppercase tracking-wider">
                        {app}
                      </div>
                      {perms.map(p => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-earth-50 cursor-pointer border-b border-earth-50 last:border-0"
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                              form.permission_ids.includes(p.id)
                                ? 'bg-primary-500 border-primary-500'
                                : 'border-earth-300'
                            }`}
                            onClick={() => togglePermission(p.id)}
                          >
                            {form.permission_ids.includes(p.id) && <Check size={10} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-earth-800">{p.name}</p>
                            <p className="text-[10px] text-earth-400">{p.codename}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-5 border-t border-earth-100">
              <button onClick={closeModal} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

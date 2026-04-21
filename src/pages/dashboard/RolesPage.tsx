import { useEffect, useState, useMemo } from 'react';
import {
  Shield, Plus, Pencil, Trash2, X, Check, Search, Users,
  ChevronDown, ChevronRight, CheckSquare, Square, LayoutGrid,
} from 'lucide-react';
import { rolesApi, permissionsApi } from '../../api';
import type { Role, Permission } from '../../api/types';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';

/* ── pretty app label ──────────────────────────────────────────────────────── */
const APP_META: Record<string, { label: string; color: string }> = {
  artworks:       { label: 'Artworks',        color: 'bg-amber-100  text-amber-700'   },
  auctions:       { label: 'Auctions',         color: 'bg-primary-100 text-primary-700' },
  orders:         { label: 'Orders',           color: 'bg-emerald-100 text-emerald-700' },
  accounts:       { label: 'Accounts',         color: 'bg-blue-100   text-blue-700'    },
  wallet:         { label: 'Wallet',           color: 'bg-violet-100 text-violet-700'  },
  cart:           { label: 'Cart',             color: 'bg-cyan-100   text-cyan-700'    },
  currencies:     { label: 'Currencies',       color: 'bg-yellow-100 text-yellow-700'  },
  site_config:    { label: 'Site Config',      color: 'bg-pink-100   text-pink-700'    },
  security:       { label: 'Security',         color: 'bg-red-100    text-red-700'     },
  notifications:  { label: 'Notifications',    color: 'bg-indigo-100 text-indigo-700'  },
  activity_logs:  { label: 'Activity Logs',    color: 'bg-teal-100   text-teal-700'    },
};

function appMeta(app: string) {
  return APP_META[app] ?? { label: app.replace(/_/g, ' '), color: 'bg-earth-100 text-earth-600' };
}

/* ── Role card gradient by index ──────────────────────────────────────────── */
const CARD_GRADIENTS = [
  'from-primary-600 to-primary-400',
  'from-blue-600    to-cyan-400',
  'from-emerald-600 to-teal-400',
  'from-violet-600  to-purple-400',
  'from-amber-600   to-orange-400',
  'from-rose-600    to-pink-400',
  'from-indigo-600  to-blue-400',
  'from-teal-600    to-emerald-400',
];

/* ─────────────────────────────────────────────────────────────────────────── */

export function RolesPage() {
  const { error } = useToast();
  const [roles, setRoles]           = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading]       = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Role | null>(null);
  const [form, setForm]             = useState({ name: '', permission_ids: [] as number[] });
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  /* ── modal permission search ── */
  const [permSearch, setPermSearch]   = useState('');
  const [collapsed, setCollapsed]     = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rolesApi.list(), permissionsApi.list()]);
      setRoles(r.data);
      setPermissions(p.data);
    } catch { error('Failed to load roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  /* ── open modal ── */
  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', permission_ids: [] });
    setPermSearch('');
    setCollapsed({});
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditing(role);
    setForm({ name: role.name, permission_ids: role.permissions.map(p => p.id) });
    setPermSearch('');
    setCollapsed({});
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  /* ── permission toggling ── */
  const togglePerm = (id: number) =>
    setForm(f => ({
      ...f,
      permission_ids: f.permission_ids.includes(id)
        ? f.permission_ids.filter(x => x !== id)
        : [...f.permission_ids, id],
    }));

  const toggleGroup = (ids: number[]) => {
    const allSelected = ids.every(id => form.permission_ids.includes(id));
    setForm(f => ({
      ...f,
      permission_ids: allSelected
        ? f.permission_ids.filter(id => !ids.includes(id))
        : [...new Set([...f.permission_ids, ...ids])],
    }));
  };

  const selectAll   = () => setForm(f => ({ ...f, permission_ids: permissions.map(p => p.id) }));
  const clearAll    = () => setForm(f => ({ ...f, permission_ids: [] }));

  /* ── save ── */
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

  /* ── grouping ── */
  const grouped = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((acc, p) => {
      const app = p.codename.split('.')[0] ?? p.content_type.split(' | ')[0] ?? 'other';
      (acc[app] ||= []).push(p);
      return acc;
    }, {});
  }, [permissions]);

  /* ── filtered groups for modal ── */
  const filteredGroups = useMemo(() => {
    if (!permSearch.trim()) return grouped;
    const q = permSearch.toLowerCase();
    const result: Record<string, Permission[]> = {};
    for (const [app, perms] of Object.entries(grouped)) {
      const matched = perms.filter(p =>
        p.name.toLowerCase().includes(q) || p.codename.toLowerCase().includes(q)
      );
      if (matched.length > 0) result[app] = matched;
    }
    return result;
  }, [grouped, permSearch]);

  /* ── filtered roles for list ── */
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles;
    const q = roleSearch.toLowerCase();
    return roles.filter(r => r.name.toLowerCase().includes(q));
  }, [roles, roleSearch]);

  /* ── stats ── */
  const totalUsers = roles.reduce((s, r) => s + r.users_count, 0);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-earth-900 dark:text-earth-100">Roles & Permissions</h1>
          <p className="text-sm text-earth-500 mt-0.5">
            {roles.length} roles &middot; {permissions.length} permissions &middot; {totalUsers} users assigned
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              className="input pl-9 pr-4 text-sm w-52"
              placeholder="Search roles…"
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
            />
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm px-4 py-2 shrink-0">
            <Plus size={15} /> New Role
          </button>
        </div>
      </div>

      {/* ── Roles grid ── */}
      {loading ? (
        <SectionSpinner size="lg" />
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-20">
          <Shield size={40} className="mx-auto text-earth-200 mb-3" />
          <p className="text-earth-400 text-sm">{roleSearch ? 'No roles match your search.' : 'No roles configured yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRoles.map((role, idx) => {
            const grad = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
            return (
              <div
                key={role.id}
                className="bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Gradient banner */}
                <div className={`bg-gradient-to-br ${grad} px-5 py-4 flex items-start justify-between`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shrink-0">
                      <Shield size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-base leading-tight">{role.name}</p>
                      <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                        <Users size={11} /> {role.users_count} {role.users_count === 1 ? 'user' : 'users'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} className="text-white" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      disabled={deletingId === role.id}
                      className="p-1.5 bg-white/20 hover:bg-red-500/50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === role.id
                        ? <Spinner size="sm" />
                        : <Trash2 size={13} className="text-white" />}
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 space-y-3">
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-earth-500 dark:text-earth-400">
                    <span className="flex items-center gap-1">
                      <LayoutGrid size={12} />
                      {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Permission chips */}
                  {role.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 6).map(p => {
                        const app = p.codename.split('.')[0] ?? '';
                        const meta = appMeta(app);
                        return (
                          <span key={p.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                            {p.codename}
                          </span>
                        );
                      })}
                      {role.permissions.length > 6 && (
                        <span className="text-[10px] bg-earth-100 dark:bg-earth-700 text-earth-500 dark:text-earth-400 px-2 py-0.5 rounded-full">
                          +{role.permissions.length - 6} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-earth-300 dark:text-earth-500 italic">No permissions assigned</p>
                  )}
                </div>

                {/* Footer action */}
                <div className="px-4 pb-4">
                  <button
                    onClick={() => openEdit(role)}
                    className="w-full text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl py-2 transition-colors"
                  >
                    Edit Permissions
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-earth-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4 flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-earth-100 dark:border-earth-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-bold text-earth-900 dark:text-earth-100 text-base">
                  {editing ? `Edit — ${editing.name}` : 'Create New Role'}
                </h3>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-earth-100 dark:hover:bg-earth-700 rounded-lg transition-colors">
                <X size={17} className="text-earth-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Role name */}
              <div>
                <label className="block text-xs font-semibold text-earth-600 dark:text-earth-400 uppercase tracking-wide mb-1.5">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="input w-full text-sm"
                  placeholder="e.g. Moderator, Editor, Analyst…"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Permissions header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-earth-600 dark:text-earth-400 uppercase tracking-wide">
                      Permissions
                    </p>
                    <p className="text-xs text-earth-400 mt-0.5">
                      {form.permission_ids.length} of {permissions.length} selected
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 px-2.5 py-1 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
                    >
                      Select all
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-xs font-medium text-earth-500 hover:text-earth-700 px-2.5 py-1 rounded-lg border border-earth-200 hover:bg-earth-50 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                </div>

                {/* Permission search */}
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
                  <input
                    className="input pl-9 pr-4 w-full text-sm"
                    placeholder="Search permissions…"
                    value={permSearch}
                    onChange={e => setPermSearch(e.target.value)}
                  />
                  {permSearch && (
                    <button
                      onClick={() => setPermSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Permission groups */}
                <div className="border border-earth-200 dark:border-earth-600 rounded-xl overflow-hidden divide-y divide-earth-100 dark:divide-earth-700">
                  {Object.entries(filteredGroups).length === 0 ? (
                    <p className="text-sm text-earth-400 text-center py-8">No permissions match your search.</p>
                  ) : Object.entries(filteredGroups).map(([app, perms]) => {
                    const meta      = appMeta(app);
                    const allIds    = perms.map(p => p.id);
                    const allCheck  = allIds.every(id => form.permission_ids.includes(id));
                    const someCheck = allIds.some(id => form.permission_ids.includes(id));
                    const isOpen    = !collapsed[app];

                    return (
                      <div key={app}>
                        {/* Group header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-earth-50 dark:bg-earth-900/40 hover:bg-earth-100 dark:hover:bg-earth-700/50 cursor-pointer transition-colors select-none">
                          {/* Checkbox + label */}
                          <div
                            className="flex items-center gap-3 flex-1"
                            onClick={() => toggleGroup(allIds)}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                              allCheck
                                ? 'bg-primary-500 border-primary-500'
                                : someCheck
                                  ? 'bg-primary-200 border-primary-400'
                                  : 'border-earth-300 bg-white dark:bg-earth-800'
                            }`}>
                              {allCheck ? (
                                <Check size={10} className="text-white" />
                              ) : someCheck ? (
                                <div className="w-2 h-0.5 bg-primary-600 rounded" />
                              ) : null}
                            </div>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-earth-400">
                              {allIds.filter(id => form.permission_ids.includes(id)).length}/{perms.length}
                            </span>
                          </div>
                          {/* Collapse toggle */}
                          <button
                            onClick={() => setCollapsed(c => ({ ...c, [app]: !c[app] }))}
                            className="p-1 text-earth-400 hover:text-earth-600 transition-colors"
                          >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </div>

                        {/* Permission rows */}
                        {isOpen && (
                          <div className="divide-y divide-earth-50 dark:divide-earth-700/50">
                            {perms.map(p => {
                              const checked = form.permission_ids.includes(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-earth-50 dark:hover:bg-earth-700/30 cursor-pointer transition-colors"
                                >
                                  <div
                                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                      checked
                                        ? 'bg-primary-500 border-primary-500'
                                        : 'border-earth-300 dark:border-earth-500 bg-white dark:bg-earth-800'
                                    }`}
                                    onClick={() => togglePerm(p.id)}
                                  >
                                    {checked && <Check size={10} className="text-white" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-earth-800 dark:text-earth-200 leading-tight">{p.name}</p>
                                    <p className="text-[10px] text-earth-400 font-mono mt-0.5">{p.codename}</p>
                                  </div>
                                  {checked && (
                                    <CheckSquare size={13} className="text-primary-400 shrink-0" />
                                  )}
                                  {!checked && (
                                    <Square size={13} className="text-earth-200 shrink-0" />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-earth-100 dark:border-earth-700 shrink-0 bg-earth-50/50 dark:bg-earth-900/30 rounded-b-2xl">
              <span className="text-xs text-earth-400">
                {form.permission_ids.length} permission{form.permission_ids.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={closeModal} className="btn-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-60 flex items-center gap-2"
                >
                  {saving ? <><Spinner size="sm" /> Saving…</> : editing ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

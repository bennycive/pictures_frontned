import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import {
  Search, UserCheck, UserX, ShieldPlus, ShieldMinus,
  ChevronDown, ChevronUp, ChevronRight, Pencil, Check, X,
  BadgeCheck, BadgeX, Shield,
} from 'lucide-react';
import { adminUsersApi, rolesApi, permissionsApi } from '../../api';
import { swal } from '../../lib/swal';
import type { AdminUser, Role, Permission } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

/* ── App label metadata (same palette as RolesPage) ─────────────────────── */
const APP_META: Record<string, { label: string; color: string }> = {
  artworks:      { label: 'Artworks',     color: 'bg-amber-100  text-amber-700'   },
  auctions:      { label: 'Auctions',     color: 'bg-primary-100 text-primary-700' },
  orders:        { label: 'Orders',       color: 'bg-emerald-100 text-emerald-700' },
  accounts:      { label: 'Accounts',     color: 'bg-blue-100   text-blue-700'    },
  wallet:        { label: 'Wallet',       color: 'bg-violet-100 text-violet-700'  },
  cart:          { label: 'Cart',         color: 'bg-cyan-100   text-cyan-700'    },
  currencies:    { label: 'Currencies',   color: 'bg-yellow-100 text-yellow-700'  },
  site_config:   { label: 'Site Config',  color: 'bg-pink-100   text-pink-700'    },
  security:      { label: 'Security',     color: 'bg-red-100    text-red-700'     },
  notifications: { label: 'Notifications',color: 'bg-indigo-100 text-indigo-700'  },
  activity_logs: { label: 'Activity Logs',color: 'bg-teal-100   text-teal-700'    },
};
function appMeta(app: string) {
  return APP_META[app] ?? { label: app.replace(/_/g, ' '), color: 'bg-earth-100 text-earth-600' };
}

function StatusDot({ active }: { active: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-earth-300'}`} />;
}

interface EditFields { name: string; email: string; phone: string }

export function UsersPage() {
  const { error } = useToast();
  const { hasPermission } = useAuth();
  const canEdit        = hasPermission('accounts.change_user');
  const canManageRoles = hasPermission('accounts.manage_users');

  /* ── Main data ── */
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [roles, setRoles]   = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  /* ── Row expansion ── */
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);

  /* ── Role assignment ── */
  const [assigningRole, setAssigningRole]   = useState<string | null>(null);
  const [selectedRole, setSelectedRole]     = useState<Record<string, string>>({});

  /* ── Status toggles ── */
  const [togglingUuid, setTogglingUuid]   = useState<string | null>(null);
  const [verifyingUuid, setVerifyingUuid] = useState<string | null>(null);

  /* ── Edit user details ── */
  const [editingUuid, setEditingUuid]   = useState<string | null>(null);
  const [editFields, setEditFields]     = useState<EditFields>({ name: '', email: '', phone: '' });
  const [savingEdit, setSavingEdit]     = useState(false);

  /* ── Direct permissions modal ── */
  const [permModalUser, setPermModalUser]           = useState<AdminUser | null>(null);
  const [allPermissions, setAllPermissions]         = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds]       = useState<number[]>([]);
  const [permSearch, setPermSearch]                 = useState('');
  const [permCollapsed, setPermCollapsed]           = useState<Record<string, boolean>>({});
  const [savingPerms, setSavingPerms]               = useState(false);
  const [loadingPerms, setLoadingPerms]             = useState(false);

  /* ── Load data ── */
  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([adminUsersApi.list(), rolesApi.list()]);
      setUsers(u.data);
      setRoles(r.data);
    } catch { error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      u.roles.join(' ').toLowerCase().includes(q)
    );
  });

  /* ── Edit details ── */
  const startEdit  = (user: AdminUser) => {
    setEditingUuid(user.uuid);
    setEditFields({ name: user.name, email: user.email || '', phone: user.phone || '' });
  };
  const cancelEdit = () => { setEditingUuid(null); };

  const handleSaveEdit = async (uuid: string) => {
    setSavingEdit(true);
    try {
      const payload = {
        name:  editFields.name,
        email: editFields.email || null,
        phone: editFields.phone || null,
      };
      const res = await adminUsersApi.update(uuid, payload);
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      setEditingUuid(null);
      swal.success('User details updated');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { email?: string[]; phone?: string[]; name?: string[] } } })
        ?.response?.data;
      if (msg?.email)      error(msg.email[0]);
      else if (msg?.phone) error(msg.phone[0]);
      else                 error('Failed to save changes');
    } finally { setSavingEdit(false); }
  };

  /* ── Role management ── */
  const handleAssignRole = async (uuid: string) => {
    const roleName = selectedRole[uuid];
    if (!roleName) return;
    setAssigningRole(uuid);
    try {
      const res = await adminUsersApi.assignRole(uuid, roleName);
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      setSelectedRole(prev => ({ ...prev, [uuid]: '' }));
      swal.success(`Role "${roleName}" assigned`);
    } catch { error('Failed to assign role'); }
    finally { setAssigningRole(null); }
  };

  const handleRemoveRole = async (uuid: string, roleName: string) => {
    const ok = await swal.confirm({
      title: `Remove "${roleName}"?`,
      text: 'The user will lose all permissions granted by this role.',
      confirmText: 'Remove',
    });
    if (!ok) return;
    setAssigningRole(uuid + roleName);
    try {
      const res = await adminUsersApi.removeRole(uuid, roleName);
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      swal.success(`Role "${roleName}" removed`);
    } catch { error('Failed to remove role'); }
    finally { setAssigningRole(null); }
  };

  /* ── Account flags ── */
  const handleToggle = async (uuid: string, field: 'is_active' | 'is_staff', value: boolean, userName: string) => {
    if (field === 'is_active' && !value) {
      const ok = await swal.confirm({
        title: `Deactivate ${userName}?`,
        text: 'The user will not be able to log in until reactivated.',
        confirmText: 'Deactivate',
      });
      if (!ok) return;
    }
    setTogglingUuid(uuid + field);
    try {
      const res = await adminUsersApi.update(uuid, { [field]: value });
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      swal.success('User updated');
    } catch { error('Failed to update user'); }
    finally { setTogglingUuid(null); }
  };

  const handleVerify = async (uuid: string, isVerified: boolean, userName: string) => {
    if (isVerified) {
      const ok = await swal.confirm({
        title: `Revoke verification for ${userName}?`,
        text: 'The user will be marked as unverified and may need to re-verify their account.',
        confirmText: 'Revoke',
      });
      if (!ok) return;
    }
    setVerifyingUuid(uuid);
    try {
      const res = isVerified
        ? await adminUsersApi.unverifyUser(uuid)
        : await adminUsersApi.verifyUser(uuid);
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      swal.success(isVerified ? 'Verification revoked.' : `${userName} verified successfully.`);
    } catch { error('Failed to update verification status.'); }
    finally { setVerifyingUuid(null); }
  };

  /* ── Direct permissions modal ── */
  const openPermModal = async (user: AdminUser) => {
    setPermModalUser(user);
    setSelectedPermIds((user.direct_permissions ?? []).map(p => p.id));
    setPermSearch('');
    setPermCollapsed({});

    if (allPermissions.length === 0) {
      setLoadingPerms(true);
      try {
        const res = await permissionsApi.list();
        setAllPermissions(res.data);
      } catch { error('Failed to load permissions'); }
      finally { setLoadingPerms(false); }
    }
  };
  const closePermModal = () => setPermModalUser(null);

  const handleSavePerms = async () => {
    if (!permModalUser) return;
    setSavingPerms(true);
    try {
      const res = await adminUsersApi.setDirectPermissions(permModalUser.uuid, selectedPermIds);
      setUsers(prev => prev.map(u => u.uuid === permModalUser.uuid ? res.data : u));
      closePermModal();
      swal.success('Direct permissions updated');
    } catch { error('Failed to update permissions'); }
    finally { setSavingPerms(false); }
  };

  /* ── Permission picker helpers ── */
  const togglePerm = (id: number) =>
    setSelectedPermIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleGroup = (ids: number[]) => {
    const allSelected = ids.every(id => selectedPermIds.includes(id));
    setSelectedPermIds(prev =>
      allSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  /* ── Grouped permissions for the modal ── */
  const permGroups = useMemo(() => {
    return allPermissions.reduce<Record<string, Permission[]>>((acc, p) => {
      const app = p.codename.split('.')[0] ?? '';
      (acc[app] ||= []).push(p);
      return acc;
    }, {});
  }, [allPermissions]);

  const filteredPermGroups = useMemo(() => {
    if (!permSearch.trim()) return permGroups;
    const q = permSearch.toLowerCase();
    const result: Record<string, Permission[]> = {};
    for (const [app, perms] of Object.entries(permGroups)) {
      const matched = perms.filter(p =>
        p.name.toLowerCase().includes(q) || p.codename.toLowerCase().includes(q)
      );
      if (matched.length > 0) result[app] = matched;
    }
    return result;
  }, [permGroups, permSearch]);

  /* ── Render ── */
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-earth-900">Users</h2>
          <p className="text-sm text-earth-500 mt-0.5">{users.length} total users</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search by name, email or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <SectionSpinner size="lg" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-earth-400">No users found.</div>
      ) : (
        <div className="bg-white border border-earth-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-earth-100 bg-earth-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wider hidden md:table-cell">Roles</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-earth-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-50">
              {filtered.map(user => {
                const isExpanded = expandedUuid === user.uuid;
                const isEditing  = editingUuid === user.uuid;
                return (
                  <React.Fragment key={user.uuid}>
                    <tr
                      className="hover:bg-earth-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedUuid(isExpanded ? null : user.uuid)}
                    >
                      {/* User info */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-primary-700 font-semibold text-xs">{user.name[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-earth-900 truncate">{user.name}</p>
                            <p className="text-xs text-earth-400 truncate">{user.email || user.phone || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Roles */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? user.roles.map(r => (
                            <span key={r} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{r}</span>
                          )) : (
                            <span className="text-xs text-earth-400">No roles</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 flex-wrap text-xs text-earth-600">
                          <span className="flex items-center gap-1">
                            <StatusDot active={user.is_active} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.verified_at ? (
                            <span className="flex items-center gap-0.5 bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <BadgeCheck size={11} /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                              <BadgeX size={11} /> Unverified
                            </span>
                          )}
                          {user.is_staff && (
                            <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">Staff</span>
                          )}
                        </div>
                      </td>

                      {/* Expand chevron */}
                      <td className="px-4 py-3 text-right">
                        {isExpanded
                          ? <ChevronUp size={15} className="text-earth-400 inline" />
                          : <ChevronDown size={15} className="text-earth-400 inline" />}
                      </td>
                    </tr>

                    {/* ── Expanded panel ── */}
                    {isExpanded && (
                      <tr className="bg-earth-50/60">
                        <td colSpan={4} className="px-6 py-5">
                          <div className="space-y-5">

                            {/* Account Details */}
                            <div className="bg-white border border-earth-100 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-earth-600 uppercase tracking-wide">Account Details</p>
                                {canEdit && !isEditing ? (
                                  <button
                                    onClick={e => { e.stopPropagation(); startEdit(user); }}
                                    className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
                                  >
                                    <Pencil size={13} /> Edit
                                  </button>
                                ) : isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={e => { e.stopPropagation(); handleSaveEdit(user.uuid); }}
                                      disabled={savingEdit}
                                      className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                      {savingEdit ? <Spinner size="sm" /> : <Check size={13} />}
                                      Save
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); cancelEdit(); }}
                                      className="flex items-center gap-1 text-xs text-earth-500 hover:text-earth-700 px-2 py-1.5 rounded-lg transition-colors"
                                    >
                                      <X size={13} /> Cancel
                                    </button>
                                  </div>
                                ) : null}
                              </div>

                              {isEditing ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" onClick={e => e.stopPropagation()}>
                                  <div>
                                    <label className="block text-xs text-earth-500 mb-1">Full Name</label>
                                    <input className="input w-full text-sm" value={editFields.name}
                                      onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-earth-500 mb-1">Email</label>
                                    <input type="email" className="input w-full text-sm" value={editFields.email}
                                      onChange={e => setEditFields(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-earth-500 mb-1">Phone</label>
                                    <input type="tel" className="input w-full text-sm" value={editFields.phone}
                                      onChange={e => setEditFields(f => ({ ...f, phone: e.target.value }))} placeholder="+255 712 345 678" />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <p className="text-xs text-earth-400 mb-0.5">Full Name</p>
                                    <p className="font-medium text-earth-900">{user.name}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-earth-400 mb-0.5">Email</p>
                                    <p className="font-medium text-earth-900">{user.email || <span className="text-earth-300">—</span>}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-earth-400 mb-0.5">Phone</p>
                                    <p className="font-medium text-earth-900">{user.phone || <span className="text-earth-300">—</span>}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-earth-400 mb-0.5">Joined</p>
                                    <p className="font-medium text-earth-900">
                                      {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-earth-400 mb-0.5">Verified</p>
                                    {user.verified_at ? (
                                      <p className="flex items-center gap-1 text-sm font-medium text-green-700">
                                        <BadgeCheck size={14} />
                                        {new Date(user.verified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                      </p>
                                    ) : (
                                      <p className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                        <BadgeX size={13} /> Not verified
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Roles & Direct Permissions */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                              {/* Assign role */}
                              {canManageRoles && (
                                <div>
                                  <p className="text-xs font-semibold text-earth-600 mb-2">Assign Role</p>
                                  <div className="flex gap-2">
                                    <select
                                      value={selectedRole[user.uuid] || ''}
                                      onChange={e => setSelectedRole(prev => ({ ...prev, [user.uuid]: e.target.value }))}
                                      onClick={e => e.stopPropagation()}
                                      className="flex-1 appearance-none pl-3 pr-7 py-2 text-sm bg-white border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                    >
                                      <option value="">Select a role…</option>
                                      {roles.filter(r => !user.roles.includes(r.name)).map(r => (
                                        <option key={r.id} value={r.name}>{r.name}</option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={e => { e.stopPropagation(); handleAssignRole(user.uuid); }}
                                      disabled={!selectedRole[user.uuid] || assigningRole === user.uuid}
                                      className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                                    >
                                      {assigningRole === user.uuid ? <Spinner size="sm" /> : <><ShieldPlus size={13} /> Assign</>}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Current roles */}
                              <div>
                                <p className="text-xs font-semibold text-earth-600 mb-2">Current Roles</p>
                                {user.roles.length === 0 ? (
                                  <p className="text-xs text-earth-400">No roles assigned</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {user.roles.map(roleName => (
                                      canManageRoles ? (
                                        <button
                                          key={roleName}
                                          onClick={e => { e.stopPropagation(); handleRemoveRole(user.uuid, roleName); }}
                                          disabled={assigningRole === user.uuid + roleName}
                                          className="flex items-center gap-1 text-xs bg-white border border-earth-200 hover:border-red-300 hover:text-red-500 text-earth-700 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                                          title={`Remove ${roleName}`}
                                        >
                                          {assigningRole === user.uuid + roleName ? <Spinner size="sm" /> : <ShieldMinus size={11} />}
                                          {roleName}
                                        </button>
                                      ) : (
                                        <span key={roleName} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{roleName}</span>
                                      )
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Direct Permissions */}
                              <div className="sm:col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-semibold text-earth-600 uppercase tracking-wide">
                                    Direct Permissions
                                    <span className="ml-1.5 text-[10px] font-medium text-earth-400 normal-case tracking-normal">
                                      ({(user.direct_permissions ?? []).length} assigned)
                                    </span>
                                  </p>
                                  {canManageRoles && (
                                    <button
                                      onClick={e => { e.stopPropagation(); openPermModal(user); }}
                                      className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-400 hover:bg-primary-50 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                      <Shield size={12} /> Manage
                                    </button>
                                  )}
                                </div>
                                {(user.direct_permissions ?? []).length === 0 ? (
                                  <p className="text-xs text-earth-400 italic">No direct permissions assigned</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {user.direct_permissions.map(p => {
                                      const app  = p.codename.split('.')[0] ?? '';
                                      const meta = appMeta(app);
                                      return (
                                        <span key={p.id} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                                          {p.codename}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Account flags */}
                            {(canManageRoles || canEdit) && (
                              <div className="flex flex-wrap gap-3 pt-3 border-t border-earth-100">
                                {canManageRoles && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleVerify(user.uuid, !!user.verified_at, user.name); }}
                                    disabled={verifyingUuid === user.uuid}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                      user.verified_at
                                        ? 'border-earth-200 text-earth-500 hover:bg-earth-100'
                                        : 'border-green-200 text-green-600 hover:bg-green-50'
                                    }`}
                                  >
                                    {verifyingUuid === user.uuid
                                      ? <Spinner size="sm" />
                                      : user.verified_at
                                        ? <><BadgeX size={13} /> Revoke Verification</>
                                        : <><BadgeCheck size={13} /> Verify Account</>}
                                  </button>
                                )}

                                {canEdit && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleToggle(user.uuid, 'is_active', !user.is_active, user.name); }}
                                    disabled={togglingUuid === user.uuid + 'is_active'}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                      user.is_active
                                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                                        : 'border-green-200 text-green-600 hover:bg-green-50'
                                    }`}
                                  >
                                    {togglingUuid === user.uuid + 'is_active' ? <Spinner size="sm" /> : user.is_active ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
                                  </button>
                                )}

                                {canEdit && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleToggle(user.uuid, 'is_staff', !user.is_staff, user.name); }}
                                    disabled={togglingUuid === user.uuid + 'is_staff'}
                                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                      user.is_staff
                                        ? 'border-violet-200 text-violet-600 hover:bg-violet-50'
                                        : 'border-earth-200 text-earth-600 hover:bg-earth-100'
                                    }`}
                                  >
                                    {togglingUuid === user.uuid + 'is_staff' ? <Spinner size="sm" /> : null}
                                    {user.is_staff ? 'Remove Staff' : 'Make Staff'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Direct Permissions Modal ── */}
      {permModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-earth-800 rounded-2xl shadow-2xl w-full max-w-2xl my-4 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-earth-100 dark:border-earth-700 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <Shield size={16} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-earth-900 dark:text-earth-100 text-base leading-tight">
                    Direct Permissions
                  </h3>
                  <p className="text-xs text-earth-400 mt-0.5">{permModalUser.name}</p>
                </div>
              </div>
              <button onClick={closePermModal} className="p-1.5 hover:bg-earth-100 dark:hover:bg-earth-700 rounded-lg transition-colors">
                <X size={17} className="text-earth-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {loadingPerms ? (
                <div className="flex items-center justify-center py-16">
                  <SectionSpinner size="lg" />
                </div>
              ) : (
                <>
                  {/* Counter + select/clear all */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-earth-400">
                      {selectedPermIds.length} of {allPermissions.length} selected
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPermIds(allPermissions.map(p => p.id))}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 px-2.5 py-1 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setSelectedPermIds([])}
                        className="text-xs font-medium text-earth-500 hover:text-earth-700 px-2.5 py-1 rounded-lg border border-earth-200 hover:bg-earth-50 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
                    <input
                      className="input pl-9 pr-4 w-full text-sm"
                      placeholder="Search permissions…"
                      value={permSearch}
                      onChange={e => setPermSearch(e.target.value)}
                    />
                    {permSearch && (
                      <button onClick={() => setPermSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Permission groups */}
                  <div className="border border-earth-200 dark:border-earth-600 rounded-xl overflow-hidden divide-y divide-earth-100 dark:divide-earth-700">
                    {Object.entries(filteredPermGroups).length === 0 ? (
                      <p className="text-sm text-earth-400 text-center py-8">No permissions match your search.</p>
                    ) : Object.entries(filteredPermGroups).map(([app, perms]) => {
                      const meta      = appMeta(app);
                      const allIds    = perms.map(p => p.id);
                      const allCheck  = allIds.every(id => selectedPermIds.includes(id));
                      const someCheck = allIds.some(id => selectedPermIds.includes(id));
                      const isOpen    = !permCollapsed[app];
                      return (
                        <div key={app}>
                          {/* Group header */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-earth-50 dark:bg-earth-900/40 hover:bg-earth-100 dark:hover:bg-earth-700/50 transition-colors select-none">
                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGroup(allIds)}>
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                allCheck
                                  ? 'bg-violet-500 border-violet-500'
                                  : someCheck
                                    ? 'bg-violet-200 border-violet-400'
                                    : 'border-earth-300 bg-white dark:bg-earth-800'
                              }`}>
                                {allCheck ? (
                                  <Check size={10} className="text-white" />
                                ) : someCheck ? (
                                  <div className="w-2 h-0.5 bg-violet-600 rounded" />
                                ) : null}
                              </div>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                              <span className="text-[11px] text-earth-400">
                                {allIds.filter(id => selectedPermIds.includes(id)).length}/{perms.length}
                              </span>
                            </div>
                            <button
                              onClick={() => setPermCollapsed(c => ({ ...c, [app]: !c[app] }))}
                              className="p-1 text-earth-400 hover:text-earth-600 transition-colors"
                            >
                              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          </div>

                          {/* Permission rows */}
                          {isOpen && (
                            <div className="divide-y divide-earth-50 dark:divide-earth-700/50">
                              {perms.map(p => {
                                const checked = selectedPermIds.includes(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-earth-50 dark:hover:bg-earth-700/30 cursor-pointer transition-colors"
                                  >
                                    <div
                                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                        checked
                                          ? 'bg-violet-500 border-violet-500'
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
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-earth-100 dark:border-earth-700 shrink-0 bg-earth-50/50 dark:bg-earth-900/30 rounded-b-2xl">
              <span className="text-xs text-earth-400">
                {selectedPermIds.length} permission{selectedPermIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={closePermModal} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
                <button
                  onClick={handleSavePerms}
                  disabled={savingPerms}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {savingPerms ? <><Spinner size="sm" /> Saving…</> : 'Save Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

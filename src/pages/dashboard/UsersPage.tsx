import { useEffect, useState } from 'react';
import React from 'react';
import { Search, UserCheck, UserX, ShieldPlus, ShieldMinus, ChevronDown, ChevronUp } from 'lucide-react';
import { adminUsersApi, rolesApi } from '../../api';
import type { AdminUser, Role } from '../../api/types';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-earth-300'}`} />
  );
}

export function UsersPage() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUuid, setExpandedUuid] = useState<string | null>(null);
  const [assigningRole, setAssigningRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Record<string, string>>({});
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([adminUsersApi.list(), rolesApi.list()]);
      setUsers(u.data);
      setRoles(r.data);
    } catch { error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      u.roles.join(' ').toLowerCase().includes(q)
    );
  });

  const handleAssignRole = async (uuid: string) => {
    const roleName = selectedRole[uuid];
    if (!roleName) return;
    setAssigningRole(uuid);
    try {
      const res = await adminUsersApi.assignRole(uuid, roleName);
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      setSelectedRole(prev => ({ ...prev, [uuid]: '' }));
      success(`Role "${roleName}" assigned`);
    } catch { error('Failed to assign role'); }
    finally { setAssigningRole(null); }
  };

  const handleRemoveRole = async (uuid: string, roleName: string) => {
    setAssigningRole(uuid + roleName);
    try {
      const res = await adminUsersApi.removeRole(uuid, roleName);
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      success(`Role "${roleName}" removed`);
    } catch { error('Failed to remove role'); }
    finally { setAssigningRole(null); }
  };

  const handleToggle = async (uuid: string, field: 'is_active' | 'is_staff', value: boolean) => {
    setTogglingUuid(uuid + field);
    try {
      const res = await adminUsersApi.update(uuid, { [field]: value });
      setUsers(prev => prev.map(u => u.uuid === uuid ? res.data : u));
      success('User updated');
    } catch { error('Failed to update user'); }
    finally { setTogglingUuid(null); }
  };

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
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
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
                return (
                  <React.Fragment key={user.uuid}>
                    <tr
                      className="hover:bg-earth-50 cursor-pointer transition-colors"
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
                        <div className="flex items-center gap-3 text-xs text-earth-600">
                          <span className="flex items-center gap-1">
                            <StatusDot active={user.is_active} />
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {user.is_staff && (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">Staff</span>
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

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr key={user.uuid + '-expanded'} className="bg-earth-50">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* Assign role */}
                            <div>
                              <p className="text-xs font-semibold text-earth-600 mb-2">Assign Role</p>
                              <div className="flex gap-2">
                                <select
                                  value={selectedRole[user.uuid] || ''}
                                  onChange={e => setSelectedRole(prev => ({ ...prev, [user.uuid]: e.target.value }))}
                                  className="flex-1 appearance-none pl-3 pr-7 py-2 text-sm bg-white border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                >
                                  <option value="">Select a role…</option>
                                  {roles
                                    .filter(r => !user.roles.includes(r.name))
                                    .map(r => (
                                      <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                </select>
                                <button
                                  onClick={() => handleAssignRole(user.uuid)}
                                  disabled={!selectedRole[user.uuid] || assigningRole === user.uuid}
                                  className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                                >
                                  {assigningRole === user.uuid
                                    ? <Spinner size="sm" />
                                    : <><ShieldPlus size={13} /> Assign</>}
                                </button>
                              </div>
                            </div>

                            {/* Current roles + remove */}
                            <div>
                              <p className="text-xs font-semibold text-earth-600 mb-2">Current Roles</p>
                              {user.roles.length === 0 ? (
                                <p className="text-xs text-earth-400">No roles assigned</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {user.roles.map(roleName => (
                                    <button
                                      key={roleName}
                                      onClick={() => handleRemoveRole(user.uuid, roleName)}
                                      disabled={assigningRole === user.uuid + roleName}
                                      className="flex items-center gap-1 text-xs bg-white border border-earth-200 hover:border-red-300 hover:text-red-500 text-earth-700 px-2 py-1 rounded-full transition-colors disabled:opacity-50"
                                      title={`Remove ${roleName}`}
                                    >
                                      {assigningRole === user.uuid + roleName
                                        ? <Spinner size="sm" />
                                        : <ShieldMinus size={11} />}
                                      {roleName}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Permissions */}
                            {user.permissions.length > 0 && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-semibold text-earth-600 mb-2">
                                  Permissions ({user.permissions.length})
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {user.permissions.map(perm => (
                                    <span key={perm} className="text-[10px] bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full">
                                      {perm}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Toggles */}
                            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1 border-t border-earth-200">
                              <button
                                onClick={() => handleToggle(user.uuid, 'is_active', !user.is_active)}
                                disabled={togglingUuid === user.uuid + 'is_active'}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                  user.is_active
                                    ? 'border-red-200 text-red-500 hover:bg-red-50'
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                }`}
                              >
                                {togglingUuid === user.uuid + 'is_active'
                                  ? <Spinner size="sm" />
                                  : user.is_active
                                    ? <><UserX size={13} /> Deactivate</>
                                    : <><UserCheck size={13} /> Activate</>}
                              </button>

                              <button
                                onClick={() => handleToggle(user.uuid, 'is_staff', !user.is_staff)}
                                disabled={togglingUuid === user.uuid + 'is_staff'}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                  user.is_staff
                                    ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                                    : 'border-earth-200 text-earth-600 hover:bg-earth-100'
                                }`}
                              >
                                {togglingUuid === user.uuid + 'is_staff' ? <Spinner size="sm" /> : null}
                                {user.is_staff ? 'Remove Staff' : 'Make Staff'}
                              </button>

                              <span className="text-xs text-earth-400 self-center">
                                Joined {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                {user.verified_at ? ' · Verified' : ' · Unverified'}
                              </span>
                            </div>
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
    </div>
  );
}

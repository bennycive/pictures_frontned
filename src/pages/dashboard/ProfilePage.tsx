import { useEffect, useState, useRef } from 'react';
import { User, Camera, Trash2, Pencil, Check, X } from 'lucide-react';
import { profileApi, authApi } from '../../api';
import type { Profile } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { error } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ bio: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Account details edit state
  const [editingAccount, setEditingAccount] = useState(false);
  const [accountFields, setAccountFields] = useState({ name: '', email: '', phone: '' });
  const [savingAccount, setSavingAccount] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await profileApi.get();
      setProfile(data);
      setForm({ bio: data.bio || '', address: data.address || '', city: data.city || '' });
    } catch { /* profile might not exist yet */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('bio', form.bio);
      fd.append('address', form.address);
      fd.append('city', form.city);
      if (avatarFile) fd.append('avatar', avatarFile);
      await profileApi.update(fd);
      swal.success('Profile updated!');
      setAvatarFile(null);
      setAvatarPreview(null);
      load();
      refreshUser();
    } catch { error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleRemoveAvatar = async () => {
    try { await profileApi.removeAvatar(); swal.success('Avatar removed'); load(); }
    catch { error('Failed to remove avatar'); }
  };

  const startEditAccount = () => {
    setAccountFields({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setEditingAccount(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      await authApi.updateMe({
        name: accountFields.name,
        email: accountFields.email || null,
        phone: accountFields.phone || null,
      });
      await refreshUser();
      setEditingAccount(false);
      swal.success('Account details updated');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { email?: string[]; phone?: string[]; name?: string[] } } })?.response?.data;
      if (msg?.email) error(msg.email[0]);
      else if (msg?.phone) error(msg.phone[0]);
      else error('Failed to update account details');
    } finally { setSavingAccount(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  const avatarUrl = avatarPreview || profile?.avatar_url;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-earth-900">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white rounded-xl border border-earth-100 p-6">
        <h3 className="font-semibold text-earth-900 mb-4">Profile Picture</h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-earth-100 overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-earth-300" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera size={14} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div>
            <p className="font-semibold text-earth-900 text-lg">{user?.name}</p>
            <p className="text-earth-500 text-sm">{user?.email || user?.phone}</p>
            <p className="text-xs text-earth-400 mt-1">{user?.roles?.join(' · ')}</p>
            {profile?.avatar_url && (
              <button onClick={handleRemoveAvatar} className="mt-2 text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <Trash2 size={12} /> Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-xl border border-earth-100 p-6">
        <h3 className="font-semibold text-earth-900 mb-4">Profile Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Bio</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Tell us about yourself..."
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">City</label>
              <input className="input" placeholder="Dar es Salaam" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Address</label>
              <input className="input" placeholder="Mikocheni B" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto px-8">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-xl border border-earth-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-earth-900">Account Details</h3>
          {!editingAccount ? (
            <button
              onClick={startEditAccount}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              <Pencil size={14} /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                form="account-form"
                type="submit"
                disabled={savingAccount}
                className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {savingAccount ? <Spinner size="sm" /> : <Check size={13} />} Save
              </button>
              <button
                onClick={() => setEditingAccount(false)}
                className="flex items-center gap-1 text-xs text-earth-500 hover:text-earth-700 px-2 py-1.5 rounded-lg transition-colors"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          )}
        </div>

        {editingAccount ? (
          <form id="account-form" onSubmit={handleSaveAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-earth-500 mb-1">Full Name</label>
              <input
                className="input w-full"
                value={accountFields.name}
                onChange={e => setAccountFields(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-earth-500 mb-1">Email</label>
              <input
                type="email"
                className="input w-full"
                value={accountFields.email}
                onChange={e => setAccountFields(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-earth-500 mb-1">Phone</label>
              <input
                type="tel"
                className="input w-full"
                value={accountFields.phone}
                onChange={e => setAccountFields(f => ({ ...f, phone: e.target.value }))}
                placeholder="+255 712 345 678"
              />
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Name',     value: user?.name || '—' },
              { label: 'Email',    value: user?.email || '—' },
              { label: 'Phone',    value: user?.phone || '—' },
              { label: 'Roles',    value: user?.roles?.join(', ') || '—' },
              { label: 'Verified', value: user?.verified_at ? new Date(user.verified_at).toLocaleDateString() : 'Not verified' },
            ].map(row => (
              <div key={row.label}>
                <p className="text-earth-400 text-xs">{row.label}</p>
                <p className="font-medium text-earth-800 mt-0.5">{row.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { User, Camera, Trash2 } from 'lucide-react';
import { profileApi } from '../../api';
import type { Profile } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ bio: '', address: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      success('Profile updated!');
      setAvatarFile(null);
      setAvatarPreview(null);
      load();
      refreshUser();
    } catch { error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleRemoveAvatar = async () => {
    try { await profileApi.removeAvatar(); success('Avatar removed'); load(); }
    catch { error('Failed to remove avatar'); }
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

      {/* Account info */}
      <div className="bg-white rounded-xl border border-earth-100 p-6">
        <h3 className="font-semibold text-earth-900 mb-4">Account Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Email', value: user?.email || '—' },
            { label: 'Phone', value: user?.phone || '—' },
            { label: 'Roles', value: user?.roles?.join(', ') || '—' },
            { label: 'Verified', value: user?.verified_at ? new Date(user.verified_at).toLocaleDateString() : 'Not verified' },
          ].map(row => (
            <div key={row.label}>
              <p className="text-earth-400">{row.label}</p>
              <p className="font-medium text-earth-800 mt-0.5">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

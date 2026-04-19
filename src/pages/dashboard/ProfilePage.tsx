import { useEffect, useState, useRef, useCallback } from 'react';
import {
  User, Camera, Trash2, Pencil, Check, X,
  MapPin, Plus, Star, Mail, Phone, ShieldCheck,
  CalendarDays, BadgeCheck,
} from 'lucide-react';
import { profileApi, authApi, addressesApi } from '../../api';
import { Logo } from '../../components/ui/Logo';
import type { Profile, Address } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';

// ── Address form modal ────────────────────────────────────────────────────────

type AddrFields = { label: string; full_name: string; phone: string; address: string; city: string; country: string };
const EMPTY: AddrFields = { label: '', full_name: '', phone: '', address: '', city: '', country: 'Tanzania' };

function AddressModal({ initial, onClose, onSaved }: {
  initial?: Address | null; onClose: () => void; onSaved: () => void;
}) {
  const { success, error } = useToast();
  const [form, setForm] = useState<AddrFields>(
    initial
      ? { label: initial.label, full_name: initial.full_name, phone: initial.phone, address: initial.address, city: initial.city, country: initial.country }
      : EMPTY
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof AddrFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) await addressesApi.update(initial.id, form);
      else await addressesApi.create(form);
      success(initial ? 'Address updated.' : 'Address added.');
      onSaved();
      onClose();
    } catch { error('Failed to save address.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Logo variant="light" className="h-5 w-auto" />
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><X size={18} /></button>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-white/70" />
            <h3 className="font-bold text-white text-sm">
              {initial ? 'Edit Address' : 'New Delivery Address'}
            </h3>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1.5">Label</label>
              <input className="input w-full text-sm" placeholder="Home, Work, Other…" value={form.label} onChange={set('label')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1.5">
                Recipient Name <span className="text-red-400">*</span>
              </label>
              <input className="input w-full text-sm" required placeholder="Full name" value={form.full_name} onChange={set('full_name')} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1.5">Phone</label>
            <input className="input w-full text-sm" placeholder="+255 712 345 678" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1.5">
              Street Address <span className="text-red-400">*</span>
            </label>
            <textarea required className="input w-full text-sm resize-none h-16" placeholder="Street, house number, area…" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1.5">
                City <span className="text-red-400">*</span>
              </label>
              <input className="input w-full text-sm" required placeholder="Dar es Salaam" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="text-xs font-semibold text-earth-500 uppercase tracking-wide block mb-1.5">Country</label>
              <input className="input w-full text-sm" placeholder="Tanzania" value={form.country} onChange={set('country')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-earth-100">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-sm disabled:opacity-50 flex items-center gap-2">
              {saving && <Spinner size="sm" />}
              {saving ? 'Saving…' : initial ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, action }: {
  icon: React.ElementType; title: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <Icon size={15} className="text-primary-600" />
        </div>
        <h3 className="font-semibold text-earth-900">{title}</h3>
      </div>
      {action}
    </div>
  );
}

// ── Field row (read mode) ─────────────────────────────────────────────────────

function Field({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-earth-50 last:border-0">
      {Icon && (
        <div className="w-7 h-7 rounded-md bg-earth-50 flex items-center justify-center shrink-0 mt-0.5">
          <Icon size={13} className="text-earth-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-earth-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-earth-800 mt-0.5 break-words">{value || <span className="text-earth-300 font-normal">Not set</span>}</p>
      </div>
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────────────────

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

  const [editingAccount, setEditingAccount] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [accountFields, setAccountFields] = useState({ name: '', email: '', phone: '' });
  const [savingAccount, setSavingAccount] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addrModal, setAddrModal] = useState<{ open: boolean; editing: Address | null }>({ open: false, editing: null });
  const [settingDefault, setSettingDefault] = useState<number | null>(null);
  const [deletingAddr, setDeletingAddr] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await profileApi.get();
      setProfile(data);
      setForm({ bio: data.bio || '', address: data.address || '', city: data.city || '' });
    } catch { /* profile might not exist yet */ }
    finally { setLoading(false); }
  };

  const loadAddresses = useCallback(async () => {
    try { const { data } = await addressesApi.list(); setAddresses(data); }
    catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); loadAddresses(); }, []); // eslint-disable-line

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveBio = async (e: React.FormEvent) => {
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
      setEditingBio(false);
      load();
      refreshUser();
    } catch { error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleRemoveAvatar = async () => {
    const ok = await swal.confirm({ title: 'Remove photo?', text: 'Your profile picture will be deleted.', confirmText: 'Remove' });
    if (!ok) return;
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

  const handleSetDefault = async (id: number) => {
    setSettingDefault(id);
    try {
      const { data } = await addressesApi.setDefault(id);
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === data.id })));
      success('Default address updated.');
    } catch { error('Failed to update default address.'); }
    finally { setSettingDefault(null); }
  };

  const handleDeleteAddress = async (addr: Address) => {
    const ok = await swal.confirm({ title: 'Delete this address?', text: `${addr.address}, ${addr.city}`, confirmText: 'Delete' });
    if (!ok) return;
    setDeletingAddr(addr.id);
    try {
      await addressesApi.delete(addr.id);
      setAddresses(prev => prev.filter(a => a.id !== addr.id));
      success('Address deleted.');
    } catch { error('Failed to delete address.'); }
    finally { setDeletingAddr(null); }
  };

  if (loading) return <SectionSpinner />;

  const avatarUrl = avatarPreview || profile?.avatar_url;
  const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-amber-600 rounded-2xl overflow-hidden shadow-lg">
        {/* subtle texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative px-6 py-8 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 group">
            <div className="relative w-24 h-24 rounded-2xl bg-white/20 ring-4 ring-white/40 overflow-hidden flex items-center justify-center shadow-xl">
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-white">{initials}</span>
              }
              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg backdrop-blur-sm transition-colors"
                >
                  <Camera size={11} /> Change
                </button>
                {(avatarUrl || profile?.avatar_url) && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1 text-[10px] font-bold text-red-200 hover:text-white bg-red-500/60 hover:bg-red-500/80 px-2 py-1 rounded-lg backdrop-blur-sm transition-colors"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Identity */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              {user?.verified_at && (
                <BadgeCheck size={20} className="text-white/80" title="Verified account" />
              )}
            </div>
            <p className="text-white/70 text-sm">{user?.email || user?.phone || 'No contact info'}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              {user?.roles?.map(r => (
                <span key={r} className="text-xs font-semibold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {r}
                </span>
              ))}
              {user?.is_staff && (
                <span className="text-xs font-semibold bg-amber-400/30 text-amber-100 border border-amber-300/30 px-2.5 py-1 rounded-full">
                  Staff
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 text-center shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <p className="text-2xl font-bold text-white">{addresses.length}</p>
              <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Addresses</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5">
              <p className="text-sm font-bold text-white">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
              </p>
              <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">Joined</p>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar pending save notice */}
      {avatarFile && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-700 font-medium">New photo selected — save your profile to apply it.</p>
          <div className="flex gap-2">
            <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="text-xs text-earth-500 hover:text-earth-700 px-2 py-1 rounded">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Left column ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Account Details */}
          <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-earth-100">
              <SectionHeader
                icon={User}
                title="Account Details"
                action={
                  !editingAccount ? (
                    <button onClick={startEditAccount} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Pencil size={12} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button form="account-form" type="submit" disabled={savingAccount}
                        className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors">
                        {savingAccount ? <Spinner size="sm" /> : <Check size={12} />} Save
                      </button>
                      <button onClick={() => setEditingAccount(false)}
                        className="flex items-center gap-1 text-xs border border-earth-200 text-earth-500 hover:bg-earth-50 px-2.5 py-1.5 rounded-lg transition-colors">
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  )
                }
              />
            </div>

            <div className="px-5 pb-5">
              {editingAccount ? (
                <form id="account-form" onSubmit={handleSaveAccount} className="space-y-3 pt-1">
                  {[
                    { key: 'name',  label: 'Full Name', type: 'text',  placeholder: 'Your name',        required: true },
                    { key: 'email', label: 'Email',     type: 'email', placeholder: 'email@example.com', required: false },
                    { key: 'phone', label: 'Phone',     type: 'tel',   placeholder: '+255 712 345 678',  required: false },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-earth-500 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        required={f.required}
                        className="input w-full text-sm"
                        value={accountFields[f.key as keyof typeof accountFields]}
                        onChange={e => setAccountFields(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
                </form>
              ) : (
                <div className="divide-y divide-earth-50">
                  <Field icon={User}        label="Full Name" value={user?.name} />
                  <Field icon={Mail}        label="Email"     value={user?.email} />
                  <Field icon={Phone}       label="Phone"     value={user?.phone} />
                  <Field icon={ShieldCheck} label="Roles"     value={user?.roles?.join(', ')} />
                  <Field
                    icon={BadgeCheck}
                    label="Verified"
                    value={
                      user?.verified_at
                        ? <span className="flex items-center gap-1 text-green-700"><BadgeCheck size={13} /> {new Date(user.verified_at).toLocaleDateString()}</span>
                        : <span className="text-amber-500 text-xs font-semibold">Not verified</span>
                    }
                  />
                  <Field
                    icon={CalendarDays}
                    label="Member Since"
                    value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bio & Profile Info */}
          <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-earth-100">
              <SectionHeader
                icon={Pencil}
                title="About"
                action={
                  !editingBio ? (
                    <button onClick={() => setEditingBio(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                      <Pencil size={12} /> Edit
                    </button>
                  ) : null
                }
              />
            </div>
            <div className="px-5 pb-5">
              {editingBio ? (
                <form onSubmit={handleSaveBio} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs text-earth-500 mb-1">Bio</label>
                    <textarea className="input w-full resize-none h-24 text-sm" placeholder="Tell us about yourself…" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-earth-500 mb-1">City</label>
                    <input className="input w-full text-sm" placeholder="Dar es Salaam" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-earth-500 mb-1">Area / Street</label>
                    <input className="input w-full text-sm" placeholder="Mikocheni B" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 transition-colors">
                      {saving ? <Spinner size="sm" /> : <Check size={14} />} Save
                    </button>
                    <button type="button" onClick={() => setEditingBio(false)} className="px-4 text-sm border border-earth-200 text-earth-500 hover:bg-earth-50 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 pt-1">
                  {form.bio ? (
                    <p className="text-sm text-earth-700 leading-relaxed">{form.bio}</p>
                  ) : (
                    <p className="text-sm text-earth-300 italic">No bio yet. Tell people about yourself.</p>
                  )}
                  {(form.city || form.address) && (
                    <p className="flex items-center gap-1.5 text-sm text-earth-500">
                      <MapPin size={13} className="text-earth-400 shrink-0" />
                      {[form.address, form.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {!form.bio && !form.city && !form.address && (
                    <button onClick={() => setEditingBio(true)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      + Add your bio and location
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Right column: Delivery Addresses ───────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-earth-100">
              <SectionHeader
                icon={MapPin}
                title="Delivery Addresses"
                action={
                  <button
                    onClick={() => setAddrModal({ open: true, editing: null })}
                    className="flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus size={12} /> Add Address
                  </button>
                }
              />
              {addresses.length > 0 && (
                <p className="text-xs text-earth-400 -mt-2">
                  {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'} · default is pre-filled at checkout
                </p>
              )}
            </div>

            <div className="p-5">
              {addresses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-earth-50 rounded-2xl flex items-center justify-center mb-4">
                    <MapPin size={28} className="text-earth-300" />
                  </div>
                  <p className="font-medium text-earth-600 mb-1">No delivery addresses</p>
                  <p className="text-sm text-earth-400 mb-4">Add an address to speed up checkout</p>
                  <button
                    onClick={() => setAddrModal({ open: true, editing: null })}
                    className="flex items-center gap-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-xl transition-colors"
                  >
                    <Plus size={14} /> Add your first address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map(addr => (
                    <div
                      key={addr.id}
                      className={`relative rounded-xl border-2 p-4 transition-all ${
                        addr.is_default
                          ? 'border-primary-300 bg-gradient-to-br from-primary-50/60 to-amber-50/30 shadow-sm'
                          : 'border-earth-100 hover:border-earth-200 hover:shadow-sm'
                      }`}
                    >
                      {/* Default badge */}
                      {addr.is_default && (
                        <div className="absolute -top-2.5 left-3">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-white border border-primary-200 shadow-sm px-2 py-0.5 rounded-full">
                            <Star size={8} fill="currentColor" /> Default
                          </span>
                        </div>
                      )}

                      {/* Label chip */}
                      {addr.label && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-earth-500 bg-earth-100 px-2 py-0.5 rounded mb-2">
                          {addr.label}
                        </span>
                      )}

                      <p className="font-semibold text-earth-900 text-sm leading-tight">{addr.full_name}</p>
                      {addr.phone && <p className="text-xs text-earth-500 mt-0.5">{addr.phone}</p>}

                      <div className="mt-2 flex items-start gap-1.5">
                        <MapPin size={11} className="text-earth-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-earth-700 leading-snug">{addr.address}</p>
                          <p className="text-xs text-earth-500">{addr.city}, {addr.country}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-earth-100/60">
                        {!addr.is_default && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            disabled={settingDefault === addr.id}
                            className="flex items-center gap-1 text-[11px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {settingDefault === addr.id ? <Spinner size="sm" /> : <Star size={10} />}
                            Set default
                          </button>
                        )}
                        <button
                          onClick={() => setAddrModal({ open: true, editing: addr })}
                          className="flex items-center gap-1 text-[11px] font-semibold text-earth-500 hover:text-earth-700 bg-earth-50 hover:bg-earth-100 border border-earth-200 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Pencil size={10} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(addr)}
                          disabled={deletingAddr === addr.id}
                          className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ml-auto"
                        >
                          {deletingAddr === addr.id ? <Spinner size="sm" /> : <Trash2 size={10} />}
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add more card */}
                  <button
                    onClick={() => setAddrModal({ open: true, editing: null })}
                    className="rounded-xl border-2 border-dashed border-earth-200 hover:border-primary-300 hover:bg-primary-50/30 p-4 flex flex-col items-center justify-center gap-2 text-earth-400 hover:text-primary-600 transition-all min-h-[120px]"
                  >
                    <Plus size={20} />
                    <span className="text-xs font-medium">Add address</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address modal */}
      {addrModal.open && (
        <AddressModal
          initial={addrModal.editing}
          onClose={() => setAddrModal({ open: false, editing: null })}
          onSaved={loadAddresses}
        />
      )}
    </div>
  );
}

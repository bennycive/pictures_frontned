import { useEffect, useRef, useState } from 'react';
import {
  Upload, Save, Mail, Phone, MapPin, Image, MessageSquare,
  Type, User, Plus, Pencil, Trash2, Settings2, Check, X, Eye, EyeOff,
} from 'lucide-react';
import { siteApi } from '../../api';
import type { ArtistProfile, ContactInfo, Exhibition, HeroContent, LandingHero } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { Logo } from '../../components/ui/Logo';

// ── Section header (same pattern as ProfilePage) ──────────────────────────────

function SectionHeader({ icon: Icon, title, action }: {
  icon: React.ElementType; title: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-earth-100">
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

// ── Hero Image section ────────────────────────────────────────────────────────

function HeroImageCard() {
  const { error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hero, setHero] = useState<LandingHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    siteApi.getHero().then(r => setHero(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowPreview(true);
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await siteApi.updateHero(fd);
      setHero(res.data);
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      swal.success('Hero image updated!');
    } catch { error('Failed to update hero image.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SectionSpinner />;

  const src = preview ?? hero?.image_url ?? null;

  return (
    <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
      <SectionHeader
        icon={Image}
        title="Hero Image"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-earth-500 hover:text-earth-700 border border-earth-200 hover:border-earth-300 hover:bg-earth-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showPreview ? <><EyeOff size={12} /> Hide</> : <><Eye size={12} /> Preview</>}
            </button>
            {file ? (
              <>
                <button
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="flex items-center gap-1 text-xs border border-earth-200 text-earth-500 hover:bg-earth-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <X size={12} /> Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {saving ? <Spinner size="sm" /> : <Save size={12} />}
                  {saving ? 'Saving…' : 'Save Image'}
                </button>
              </>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Upload size={12} /> Change Image
              </button>
            )}
          </div>
        }
      />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Pending file notice */}
      {file && !showPreview && (
        <div className="mx-5 mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <p className="text-sm text-amber-700 font-medium">New image selected — click Preview to review or Save to apply.</p>
        </div>
      )}

      {/* Collapsible preview */}
      {showPreview && (
        <div className="p-5">
          <div className="rounded-xl overflow-hidden border border-earth-100 bg-earth-50 aspect-[16/6] relative">
            {src ? (
              <img src={src} alt="Hero" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-earth-300">
                <Image size={40} strokeWidth={1.2} />
                <span className="text-sm">No hero image set</span>
              </div>
            )}
            {preview && (
              <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                Preview — not saved yet
              </span>
            )}
          </div>
          {hero?.updated_at && (
            <p className="text-xs text-earth-400 mt-3">
              Last updated: {new Date(hero.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hero Text section ─────────────────────────────────────────────────────────

function HeroTextCard() {
  const { error } = useToast();
  const [form, setForm] = useState<Omit<HeroContent, 'updated_at'>>({
    tagline: '', title: '', subtitle: '', cta_text: '', cta_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.getHeroContent()
      .then(r => setForm({ tagline: r.data.tagline, title: r.data.title, subtitle: r.data.subtitle, cta_text: r.data.cta_text, cta_link: r.data.cta_link }))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await siteApi.updateHeroContent(form);
      swal.success('Hero text updated!');
      setEditing(false);
    } catch { error('Failed to update hero text.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SectionSpinner />;

  return (
    <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
      <SectionHeader
        icon={Type}
        title="Hero Text"
        action={
          !editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button form="hero-text-form" type="submit" disabled={saving}
                className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors">
                {saving ? <Spinner size="sm" /> : <Check size={12} />} Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs border border-earth-200 text-earth-500 hover:bg-earth-50 px-2.5 py-1.5 rounded-lg transition-colors">
                <X size={12} /> Cancel
              </button>
            </div>
          )
        }
      />

      <div className="p-5">
        {editing ? (
          <form id="hero-text-form" onSubmit={handleSubmit} className="space-y-3">
            {([
              { key: 'tagline'  as const, label: 'Tagline',     placeholder: 'Welcome to',       hint: 'Small line above the title.' },
              { key: 'title'    as const, label: 'Title',        placeholder: 'Afristudio',        hint: 'Main large heading.' },
              { key: 'cta_text' as const, label: 'Button Text',  placeholder: 'Explore Gallery',   hint: 'Call-to-action label.' },
              { key: 'cta_link' as const, label: 'Button Link',  placeholder: '/artworks',         hint: 'Where the button links.' },
            ] as { key: keyof typeof form; label: string; placeholder: string; hint: string }[]).map(({ key, label, placeholder, hint }) => (
              <div key={key}>
                <label className="block text-xs text-earth-500 mb-1">{label}</label>
                <input className="input w-full text-sm" placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                <p className="text-[11px] text-earth-400 mt-0.5">{hint}</p>
              </div>
            ))}
            <div>
              <label className="block text-xs text-earth-500 mb-1">Subtitle</label>
              <textarea className="input w-full text-sm resize-none h-20" placeholder="Discover the soul of Africa…" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Tagline',     value: form.tagline },
              { label: 'Title',       value: form.title },
              { label: 'Subtitle',    value: form.subtitle },
              { label: 'Button Text', value: form.cta_text },
              { label: 'Button Link', value: form.cta_link },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2.5 border-b border-earth-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-earth-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-earth-800 mt-0.5 break-words">{value || <span className="text-earth-300 font-normal">Not set</span>}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Contact Info section ──────────────────────────────────────────────────────

function ContactInfoCard() {
  const { error } = useToast();
  const [form, setForm] = useState<Omit<ContactInfo, 'updated_at'>>({ email: '', phone: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.getContactInfo()
      .then(r => setForm({ email: r.data.email, phone: r.data.phone, location: r.data.location }))
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await siteApi.updateContactInfo(form);
      swal.success('Contact info updated!');
      setEditing(false);
    } catch { error('Failed to update contact info.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SectionSpinner />;

  const fields: { key: keyof typeof form; label: string; icon: React.ElementType; type?: string; placeholder: string }[] = [
    { key: 'email',    label: 'Email Address', icon: Mail,   type: 'email', placeholder: 'hello@afristudio.art' },
    { key: 'phone',    label: 'Phone Number',  icon: Phone,                 placeholder: '+255 712 345 678' },
    { key: 'location', label: 'Location',      icon: MapPin,                placeholder: 'Dar es Salaam, Tanzania' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
      <SectionHeader
        icon={MessageSquare}
        title="Contact Info"
        action={
          !editing ? (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
              <Pencil size={12} /> Edit
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button form="contact-form" type="submit" disabled={saving}
                className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors">
                {saving ? <Spinner size="sm" /> : <Check size={12} />} Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1 text-xs border border-earth-200 text-earth-500 hover:bg-earth-50 px-2.5 py-1.5 rounded-lg transition-colors">
                <X size={12} /> Cancel
              </button>
            </div>
          )
        }
      />

      <div className="p-5">
        {editing ? (
          <form id="contact-form" onSubmit={handleSubmit} className="space-y-3">
            {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-earth-500 mb-1">{label}</label>
                <div className="relative">
                  <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
                  <input type={type ?? 'text'} className="input pl-8 w-full text-sm" placeholder={placeholder} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              </div>
            ))}
          </form>
        ) : (
          <div className="divide-y divide-earth-50">
            {fields.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-start gap-3 py-3 last:pb-0">
                <div className="w-7 h-7 rounded-md bg-earth-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-earth-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-earth-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-earth-800 mt-0.5">{form[key] || <span className="text-earth-300 font-normal">Not set</span>}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Artist Profile section ────────────────────────────────────────────────────

function ArtistCard() {
  const { error } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: '', location: '', biography: '', story: '', philosophy: '', statement: '' });

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [exForm, setExForm] = useState({ date_label: '', title: '', location: '', order: 0 });
  const [editingEx, setEditingEx] = useState<Exhibition | null>(null);
  const [showExForm, setShowExForm] = useState(false);
  const [savingEx, setSavingEx] = useState(false);

  useEffect(() => {
    Promise.all([siteApi.getArtistProfile(), siteApi.listExhibitions()])
      .then(([p, e]) => {
        setProfile(p.data);
        setForm({ name: p.data.name, location: p.data.location, biography: p.data.biography, story: p.data.story, philosophy: p.data.philosophy, statement: p.data.statement });
        setExhibitions(e.data);
      })
      .catch(() => error('Failed to load artist data.'))
      .finally(() => setLoading(false));
  }, []);  // eslint-disable-line

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('photo', photoFile);
      const res = await siteApi.updateArtistProfile(fd);
      setProfile(res.data);
      setPhotoFile(null);
      setPhotoPreview(null);
      setEditing(false);
      swal.success('Artist profile updated!');
    } catch { error('Failed to update artist profile.'); }
    finally { setSaving(false); }
  };

  const loadEx = () => siteApi.listExhibitions().then(r => setExhibitions(r.data)).catch(() => {});

  const openNewEx = () => {
    setEditingEx(null);
    setExForm({ date_label: '', title: '', location: '', order: exhibitions.length });
    setShowExForm(true);
  };

  const openEditEx = (ex: Exhibition) => {
    setEditingEx(ex);
    setExForm({ date_label: ex.date_label, title: ex.title, location: ex.location, order: ex.order });
    setShowExForm(true);
  };

  const handleSaveEx = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEx(true);
    try {
      if (editingEx) { await siteApi.updateExhibition(editingEx.id, exForm); swal.success('Exhibition updated!'); }
      else { await siteApi.createExhibition(exForm); swal.success('Exhibition added!'); }
      setShowExForm(false);
      loadEx();
    } catch { error('Failed to save exhibition.'); }
    finally { setSavingEx(false); }
  };

  const handleDeleteEx = async (ex: Exhibition) => {
    const ok = await swal.confirmDelete(`Delete "${ex.title}"?`);
    if (!ok) return;
    try { await siteApi.deleteExhibition(ex.id); swal.success('Exhibition deleted.'); loadEx(); }
    catch { error('Failed to delete exhibition.'); }
  };

  if (loading) return <SectionSpinner />;

  const currentPhoto = photoPreview ?? profile?.photo_url ?? null;

  return (
    <div className="space-y-6">
      {/* Artist profile card */}
      <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
        <SectionHeader
          icon={User}
          title="Artist Profile"
          action={
            !editing ? (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors">
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <div className="flex gap-1.5">
                <button form="artist-form" type="submit" disabled={saving}
                  className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors">
                  {saving ? <Spinner size="sm" /> : <Check size={12} />} Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1 text-xs border border-earth-200 text-earth-500 hover:bg-earth-50 px-2.5 py-1.5 rounded-lg transition-colors">
                  <X size={12} /> Cancel
                </button>
              </div>
            )
          }
        />

        <div className="p-5">
          {/* Photo row — always visible */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-earth-50">
            <div className="relative group shrink-0">
              <div className="w-20 h-24 rounded-xl bg-earth-100 border border-earth-200 overflow-hidden flex items-center justify-center">
                {currentPhoto
                  ? <img src={currentPhoto} alt="artist" className="w-full h-full object-cover" />
                  : <User size={24} className="text-earth-300" />}
                <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg backdrop-blur-sm transition-colors">
                    <Upload size={11} />
                  </button>
                </div>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-earth-900 text-base">{form.name || <span className="text-earth-300">No name set</span>}</p>
              <p className="text-sm text-earth-500 mt-0.5 flex items-center gap-1">
                <MapPin size={12} className="text-earth-400 shrink-0" />
                {form.location || <span className="text-earth-300">No location</span>}
              </p>
              {photoFile && <p className="text-xs text-amber-600 mt-1 font-medium">New photo selected — save to apply</p>}
            </div>
          </div>

          {editing ? (
            <form id="artist-form" onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-earth-500 mb-1">Artist Name</label>
                  <input className="input w-full text-sm" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-earth-500 mb-1">Location</label>
                  <input className="input w-full text-sm" placeholder="Arusha, Tanzania" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              {([
                { key: 'biography'   as const, label: 'Biography',                            rows: 3 },
                { key: 'story'       as const, label: 'Story (blank line = paragraph break)',  rows: 4 },
                { key: 'philosophy'  as const, label: 'Artistic Philosophy (shown as quote)',  rows: 3 },
                { key: 'statement'   as const, label: 'Artist Statement',                      rows: 3 },
              ]).map(({ key, label, rows }) => (
                <div key={key}>
                  <label className="block text-xs text-earth-500 mb-1">{label}</label>
                  <textarea className="input w-full text-sm resize-y" rows={rows} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </form>
          ) : (
            <div className="space-y-3">
              {([
                { label: 'Biography',   value: form.biography },
                { label: 'Story',       value: form.story },
                { label: 'Philosophy',  value: form.philosophy },
                { label: 'Statement',   value: form.statement },
              ]).map(({ label, value }) => (
                <div key={label} className="py-2.5 border-b border-earth-50 last:border-0">
                  <p className="text-[11px] font-semibold text-earth-400 uppercase tracking-wide mb-1">{label}</p>
                  {value
                    ? <p className="text-sm text-earth-700 leading-relaxed line-clamp-3">{value}</p>
                    : <p className="text-sm text-earth-300 italic">Not set</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Exhibitions card */}
      <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
        <SectionHeader
          icon={MapPin}
          title={`Exhibitions · ${exhibitions.length}`}
          action={
            <button onClick={openNewEx} className="flex items-center gap-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={12} /> Add
            </button>
          }
        />

        <div className="p-5 space-y-3">
          {/* Inline form */}
          {showExForm && (
            <form onSubmit={handleSaveEx} className="bg-earth-50 border border-earth-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-earth-700">{editingEx ? 'Edit Exhibition' : 'New Exhibition'}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-earth-500 mb-1">Year / Date</label>
                  <input className="input text-sm w-full" placeholder="2024" required value={exForm.date_label} onChange={e => setExForm(f => ({ ...f, date_label: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-earth-500 mb-1">Order</label>
                  <input type="number" className="input text-sm w-full" value={exForm.order} onChange={e => setExForm(f => ({ ...f, order: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-earth-500 mb-1">Title</label>
                <input className="input text-sm w-full" placeholder="Solo Exhibition — Gallery Name" required value={exForm.title} onChange={e => setExForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-earth-500 mb-1">Location</label>
                <input className="input text-sm w-full" placeholder="Nairobi, Kenya" value={exForm.location} onChange={e => setExForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingEx} className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                  {savingEx ? <Spinner size="sm" /> : <Check size={12} />}
                  {savingEx ? 'Saving…' : editingEx ? 'Update' : 'Add Exhibition'}
                </button>
                <button type="button" onClick={() => setShowExForm(false)} className="text-xs border border-earth-200 text-earth-500 hover:bg-earth-100 px-3 py-1.5 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {exhibitions.length === 0 && !showExForm ? (
            <p className="text-sm text-earth-400 italic text-center py-6">No exhibitions added yet.</p>
          ) : (
            <div className="divide-y divide-earth-50 border border-earth-100 rounded-xl overflow-hidden">
              {exhibitions.map(ex => (
                <div key={ex.id} className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-earth-50 transition-colors">
                  <span className="text-xs font-bold text-primary-600 w-10 shrink-0">{ex.date_label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-earth-900 truncate">{ex.title}</p>
                    {ex.location && <p className="text-xs text-earth-500 truncate">{ex.location}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditEx(ex)} className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors">
                      <Pencil size={13} className="text-earth-400" />
                    </button>
                    <button onClick={() => handleDeleteEx(ex)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SiteConfigPage() {
  return (
    <div className="space-y-6">

      {/* Hero banner */}
      <div className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-amber-600 rounded-2xl overflow-hidden shadow-lg">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative px-6 py-7 flex flex-col sm:flex-row items-center sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/20 ring-4 ring-white/30 flex items-center justify-center shrink-0 shadow-xl">
            <Settings2 size={26} className="text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <Logo variant="light" className="h-6 w-auto mb-1 mx-auto sm:mx-0" />
            <h2 className="text-xl font-bold text-white">Site Configuration</h2>
            <p className="text-white/70 text-sm mt-0.5">Manage the public landing page content, contact info, and artist profile.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            {[
              { label: 'Sections', value: '4' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Image — full width */}
      <HeroImageCard />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <HeroTextCard />
          <ContactInfoCard />
        </div>

        {/* Right column */}
        <div className="lg:col-span-3">
          <ArtistCard />
        </div>
      </div>
    </div>
  );
}

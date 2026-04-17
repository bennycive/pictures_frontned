import { useEffect, useRef, useState } from 'react';
import { Upload, Save, Mail, Phone, MapPin, Image, MessageSquare, Inbox, RefreshCw, Type, User, Plus, Pencil, Trash2 } from 'lucide-react';
import { siteApi } from '../../api';
import type { ArtistProfile, ContactInfo, ContactMessage, Exhibition, HeroContent, LandingHero } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner, SectionSpinner } from '../../components/ui/Spinner';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

type Tab = 'hero' | 'hero-text' | 'contact-info' | 'messages' | 'artist';

// ─── Hero Tab ────────────────────────────────────────────────────────────────
function HeroTab() {
  const { error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hero, setHero] = useState<LandingHero | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.getHero()
      .then(res => setHero(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
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
    } catch {
      error('Failed to update hero image.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionSpinner />;

  const currentSrc = preview ?? hero?.image_url ?? null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-earth-900 mb-1">Landing Hero Image</h2>
        <p className="text-sm text-earth-500">This image is displayed as the hero background on the public landing page.</p>
      </div>

      {/* Current / Preview image */}
      <div className="rounded-2xl overflow-hidden border border-earth-200 bg-earth-100 aspect-[16/7] relative">
        {currentSrc ? (
          <img src={currentSrc} alt="Hero" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-earth-400">
            <Image size={40} strokeWidth={1.2} />
            <span className="text-sm">No hero image set</span>
          </div>
        )}
        {preview && (
          <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Preview — not saved yet
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary flex items-center gap-2"
        >
          <Upload size={16} /> Choose Image
        </button>
        {file && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Hero Image'}
          </button>
        )}
      </div>

      {hero?.updated_at && (
        <p className="text-xs text-earth-400">
          Last updated: {new Date(hero.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

// ─── Hero Text Tab ────────────────────────────────────────────────────────────
function HeroTextTab() {
  const { error } = useToast();
  const [form, setForm] = useState<Omit<HeroContent, 'updated_at'>>({
    tagline: '', title: '', subtitle: '', cta_text: '', cta_link: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.getHeroContent()
      .then(res => setForm({
        tagline: res.data.tagline,
        title: res.data.title,
        subtitle: res.data.subtitle,
        cta_text: res.data.cta_text,
        cta_link: res.data.cta_link,
      }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await siteApi.updateHeroContent(form);
      swal.success('Hero text updated!');
    } catch {
      error('Failed to update hero text.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionSpinner />;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-base font-semibold text-earth-900 mb-1">Hero Text Content</h2>
        <p className="text-sm text-earth-500">Controls the text displayed in the landing page hero section.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { key: 'tagline' as const,  label: 'Tagline',      placeholder: 'Welcome to',          hint: 'Small italic line above the title.' },
          { key: 'title' as const,    label: 'Title',        placeholder: 'Afristudio',           hint: 'Large script heading.' },
          { key: 'cta_text' as const, label: 'Button Text',  placeholder: 'Explore Gallery',      hint: 'Call-to-action button label.' },
          { key: 'cta_link' as const, label: 'Button Link',  placeholder: '/artworks',            hint: 'Where the button navigates.' },
        ].map(({ key, label, placeholder, hint }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">{label}</label>
            <input
              className="input"
              value={form[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
            />
            <p className="text-xs text-earth-400 mt-1">{hint}</p>
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Subtitle</label>
          <textarea
            className="input min-h-[90px] resize-y"
            value={form.subtitle}
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
            placeholder="Discover the soul of Africa..."
          />
          <p className="text-xs text-earth-400 mt-1">Paragraph shown below the title.</p>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}


// ─── Contact Info Tab ─────────────────────────────────────────────────────────
function ContactInfoTab() {
  const { error } = useToast();
  const [form, setForm] = useState<Omit<ContactInfo, 'updated_at'>>({ email: '', phone: '', location: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.getContactInfo()
      .then(res => setForm({ email: res.data.email, phone: res.data.phone, location: res.data.location }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await siteApi.updateContactInfo(form);
      swal.success('Contact info updated!');
    } catch {
      error('Failed to update contact info.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SectionSpinner />;

  const fields: { key: keyof typeof form; label: string; icon: React.ElementType; type?: string; placeholder: string }[] = [
    { key: 'email',    label: 'Email Address', icon: Mail,   type: 'email', placeholder: 'hello@afristudio.art' },
    { key: 'phone',    label: 'Phone Number',  icon: Phone,                 placeholder: '+255 712 345 678' },
    { key: 'location', label: 'Location',      icon: MapPin,                placeholder: 'Dar es Salaam, Tanzania' },
  ];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-base font-semibold text-earth-900 mb-1">Contact Information</h2>
        <p className="text-sm text-earth-500">Displayed on the public contact page.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1.5">
              {label}
            </label>
            <div className="relative">
              <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
              <input
                type={type ?? 'text'}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="input pl-9"
              />
            </div>
          </div>
        ))}

        <div className="pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Messages Tab ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<ContactMessage['status'], string> = {
  new:    'blue',
  read:   'green',
  unread: 'yellow',
};

function MessagesTab() {
  const { error } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    siteApi.listMessages()
      .then(res => setMessages(res.data.results ?? (res.data as unknown as ContactMessage[])))
      .catch(() => error('Failed to load messages.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (msg: ContactMessage, status: ContactMessage['status']) => {
    setUpdating(msg.id);
    try {
      const res = await siteApi.updateMessageStatus(msg.id, status);
      setMessages(prev => prev.map(m => m.id === msg.id ? res.data : m));
      swal.success('Status updated.');
    } catch {
      error('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const columns = [
    {
      key: 'status',
      header: 'Status',
      render: (m: ContactMessage) => (
        <Badge label={m.status} color={STATUS_COLORS[m.status] as 'blue' | 'green' | 'yellow'} />
      ),
    },
    {
      key: 'name',
      header: 'Sender',
      render: (m: ContactMessage) => (
        <div>
          <p className="font-medium text-earth-900 text-sm">{m.name}</p>
          <p className="text-xs text-earth-500">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (m: ContactMessage) => (
        <span className="text-sm text-earth-700 line-clamp-1">{m.subject}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Received',
      render: (m: ContactMessage) => (
        <span className="text-xs text-earth-500 whitespace-nowrap">
          {new Date(m.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m: ContactMessage) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            className="text-xs text-primary-600 hover:underline"
          >
            {expanded === m.id ? 'Hide' : 'Read'}
          </button>
          <select
            value={m.status}
            disabled={updating === m.id}
            onChange={e => handleStatusChange(m, e.target.value as ContactMessage['status'])}
            className="text-xs border border-earth-200 rounded-lg px-2 py-1 bg-white text-earth-700 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
          >
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      ),
    },
  ];

  if (loading) return <SectionSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-earth-900 mb-0.5">Contact Messages</h2>
          <p className="text-sm text-earth-500">{messages.length} message{messages.length !== 1 ? 's' : ''} received.</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <Table
        columns={columns}
        data={messages}
        keyField="id"
        emptyMessage="No contact messages yet."
      />

      {/* Expanded message body */}
      {expanded !== null && (() => {
        const msg = messages.find(m => m.id === expanded);
        if (!msg) return null;
        return (
          <div className="bg-white border border-earth-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-earth-900">{msg.subject}</p>
                <p className="text-xs text-earth-500">From {msg.name} &lt;{msg.email}&gt; · {new Date(msg.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setExpanded(null)} className="text-earth-400 hover:text-earth-700 text-xs">Close</button>
            </div>
            <p className="text-sm text-earth-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Artist Tab ───────────────────────────────────────────────────────────────
function ArtistTab() {
  const { error } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: '', location: '', biography: '', story: '', philosophy: '', statement: '' });

  // Exhibitions
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [exForm, setExForm] = useState({ date_label: '', title: '', location: '', order: 0 });
  const [editingEx, setEditingEx] = useState<Exhibition | null>(null);
  const [showExForm, setShowExForm] = useState(false);
  const [savingEx, setSavingEx] = useState(false);

  useEffect(() => {
    Promise.all([siteApi.getArtistProfile(), siteApi.listExhibitions()])
      .then(([p, e]) => {
        setProfile(p.data);
        setForm({
          name: p.data.name,
          location: p.data.location,
          biography: p.data.biography,
          story: p.data.story,
          philosophy: p.data.philosophy,
          statement: p.data.statement,
        });
        setExhibitions(e.data);
      })
      .catch(() => error('Failed to load artist data.'))
      .finally(() => setLoading(false));
  }, []);

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
      swal.success('Artist profile updated!');
    } catch {
      error('Failed to update artist profile.');
    } finally {
      setSaving(false);
    }
  };

  const loadExhibitions = () => {
    siteApi.listExhibitions().then(r => setExhibitions(r.data)).catch(() => {});
  };

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
      if (editingEx) {
        await siteApi.updateExhibition(editingEx.id, exForm);
        swal.success('Exhibition updated!');
      } else {
        await siteApi.createExhibition(exForm);
        swal.success('Exhibition added!');
      }
      setShowExForm(false);
      loadExhibitions();
    } catch {
      error('Failed to save exhibition.');
    } finally {
      setSavingEx(false);
    }
  };

  const handleDeleteEx = async (ex: Exhibition) => {
    const ok = await swal.confirmDelete(`Delete "${ex.title}"?`);
    if (!ok) return;
    try {
      await siteApi.deleteExhibition(ex.id);
      swal.success('Exhibition deleted.');
      loadExhibitions();
    } catch {
      error('Failed to delete exhibition.');
    }
  };

  if (loading) return <SectionSpinner />;

  const currentPhoto = photoPreview ?? profile?.photo_url ?? null;

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Profile form */}
      <div>
        <h2 className="text-base font-semibold text-earth-900 mb-1">Artist Profile</h2>
        <p className="text-sm text-earth-500 mb-6">Displayed on the public About page.</p>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Photo */}
          <div>
            <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-2">Artist Photo</label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-28 bg-earth-100 border border-earth-200 rounded-xl overflow-hidden shrink-0">
                {currentPhoto
                  ? <img src={currentPhoto} alt="artist" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-earth-400"><User size={28} /></div>}
              </div>
              <div className="space-y-2 pt-1">
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                <button type="button" onClick={() => photoInputRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm">
                  <Upload size={14} /> {photoFile ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoFile && <p className="text-xs text-amber-600">Preview — save to apply</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Artist Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Location</label>
              <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Arusha, Tanzania" />
            </div>
          </div>

          {[
            { key: 'biography' as const, label: 'Biography', rows: 3 },
            { key: 'story' as const, label: 'My Story (use blank line to separate paragraphs)', rows: 5 },
            { key: 'philosophy' as const, label: 'Artistic Philosophy (displayed as quote)', rows: 3 },
            { key: 'statement' as const, label: 'Artist Statement', rows: 3 },
          ].map(({ key, label, rows }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">{label}</label>
              <textarea
                className="input resize-y"
                rows={rows}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}

          <div className="pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Exhibitions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-earth-900">Exhibitions</h2>
            <p className="text-sm text-earth-500">{exhibitions.length} exhibition{exhibitions.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openNewEx} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Exhibition
          </button>
        </div>

        {showExForm && (
          <form onSubmit={handleSaveEx} className="bg-earth-50 border border-earth-200 rounded-xl p-5 space-y-4 mb-4">
            <h3 className="text-sm font-semibold text-earth-900">{editingEx ? 'Edit Exhibition' : 'New Exhibition'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Year / Date</label>
                <input className="input" placeholder="2024" value={exForm.date_label} onChange={e => setExForm(f => ({ ...f, date_label: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Order</label>
                <input type="number" className="input" value={exForm.order} onChange={e => setExForm(f => ({ ...f, order: +e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Exhibition Title</label>
              <input className="input" placeholder="Solo Exhibition — Gallery Name" value={exForm.title} onChange={e => setExForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-earth-700 uppercase tracking-wide mb-1">Location</label>
              <input className="input" placeholder="Nairobi, Kenya" value={exForm.location} onChange={e => setExForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setShowExForm(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button type="submit" disabled={savingEx} className="btn-primary text-sm px-4 py-2">{savingEx ? 'Saving...' : editingEx ? 'Save Changes' : 'Add Exhibition'}</button>
            </div>
          </form>
        )}

        {exhibitions.length === 0 ? (
          <p className="text-sm text-earth-400 italic py-4">No exhibitions added yet.</p>
        ) : (
          <div className="divide-y divide-earth-100 border border-earth-200 rounded-xl overflow-hidden">
            {exhibitions.map(ex => (
              <div key={ex.id} className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-earth-50 transition-colors">
                <span className="text-xs font-bold text-primary-600 w-10 shrink-0">{ex.date_label}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-earth-900 truncate">{ex.title}</p>
                  {ex.location && <p className="text-xs text-earth-500 truncate">{ex.location}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEditEx(ex)} className="p-1.5 hover:bg-earth-100 rounded-lg" title="Edit">
                    <Pencil size={13} className="text-earth-500" />
                  </button>
                  <button onClick={() => handleDeleteEx(ex)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Delete">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'hero',         label: 'Hero Image',    icon: Image },
  { id: 'hero-text',    label: 'Hero Text',     icon: Type },
  { id: 'contact-info', label: 'Contact Info',  icon: MessageSquare },
  { id: 'messages',     label: 'Messages',      icon: Inbox },
  { id: 'artist',       label: 'Artist',        icon: User },
];

export function SiteConfigPage() {
  const [tab, setTab] = useState<Tab>('hero');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-earth-900">Site Configuration</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-white text-earth-900 shadow-sm'
                : 'text-earth-500 hover:text-earth-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'hero'         && <HeroTab />}
        {tab === 'hero-text'    && <HeroTextTab />}
        {tab === 'contact-info' && <ContactInfoTab />}
        {tab === 'messages'     && <MessagesTab />}
        {tab === 'artist'       && <ArtistTab />}
      </div>
    </div>
  );
}

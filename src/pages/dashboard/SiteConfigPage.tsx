import { useEffect, useRef, useState } from 'react';
import { Upload, Save, Mail, Phone, MapPin, Image, MessageSquare, Inbox, RefreshCw, Type } from 'lucide-react';
import { siteApi } from '../../api';
import type { ContactInfo, ContactMessage, HeroContent, LandingHero } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { Spinner } from '../../components/ui/Spinner';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';

type Tab = 'hero' | 'hero-text' | 'contact-info' | 'messages';

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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

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
        <Badge color={STATUS_COLORS[m.status] as 'blue' | 'green' | 'yellow'}>
          {m.status}
        </Badge>
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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>;

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

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'hero',         label: 'Hero Image',    icon: Image },
  { id: 'hero-text',    label: 'Hero Text',     icon: Type },
  { id: 'contact-info', label: 'Contact Info',  icon: MessageSquare },
  { id: 'messages',     label: 'Messages',      icon: Inbox },
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
      </div>
    </div>
  );
}

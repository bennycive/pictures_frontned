import { useEffect, useRef, useState } from 'react';
import {
  Upload, Save, Mail, Phone, MapPin, Image, MessageSquare,
  Type, User, Plus, Pencil, Trash2, Settings2, Check, X, Eye, EyeOff, Globe,
  Download, Wand2,
} from 'lucide-react';
import { siteApi } from '../../api';
import type { ArtistProfile, ContactInfo, Exhibition, HeroContent, LandingHero, LanguageConfig } from '../../api/types';
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

// ── Favicon logo SVG (icon emblem only, viewBox 0 0 43 41) ───────────────────

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43 41">
  <polygon fill="#ec6b1f" points="27.44 11.49 41.97 16.66 39.93 31.17 25.66 33.66 20.43 21.06 27.44 11.49"/>
  <polygon fill="#462718" points="21.29 4.38 0 12.2 10.07 31.53 24.98 25.21 21.29 4.38"/>
  <path fill="#f28e1c" d="M16.59,37.9c-.23.06-11.72-23.74-11.72-23.74L38.26,4.48l-.42,23.7-21.26,9.73h.01Z"/>
  <polygon fill="#f28e1c" points="35.07 3.32 40.3 1.83 39.76 9.63 42.22 0 35.07 3.32"/>
  <polygon fill="#f28e1c" points="41.35 6.98 40.32 10.78 42.97 9.69 41.35 6.98"/>
  <polygon fill="#462718" points="14.74 5.34 10.42 7.12 7.45 6.33 14.74 5.34"/>
  <polygon fill="#f28e1c" points="5.62 6.7 9.02 7.5 5.89 9.14 5.62 6.7"/>
  <polygon fill="#ec6b1f" points="25.95 34.94 31.42 34.1 27.04 36.84 25.95 34.94"/>
  <polygon fill="#ec6b1f" points="29.91 36.89 32.77 34.13 32.78 36.02 29.91 36.89"/>
  <polygon fill="#462718" points="7.46 29.21 9.41 33.18 14.17 31.77 8.63 34.11 7.46 29.21"/>
  <polyline fill="#ec6b1f" points="16.71 39.13 24.67 36.33 18.81 40.34"/>
  <polygon fill="#f28e1c" points="25.19 36.43 23.65 38.26 25.02 37.78 25.19 36.43"/>
  <path fill="#462718" d="M24.44,11.29s-.68-.44-1.31-.3c-.6,1.01-.4,2.83-.4,2.83,0,0,.27-.17.37-.15.15-1.33,1.34-2.37,1.34-2.37h0Z"/>
  <path fill="#462718" d="M25.22,11.75c-1.02.38-1.85,1.95-1.85,1.95,0,0,.3.05.38.14.84-.95,2.35-.95,2.35-.95,0,0-.3-.82-.87-1.15h-.01Z"/>
  <path fill="#462718" d="M24.12,14.01s.24.21.27.33c1.14-.36,2.46.48,2.46.48,0,0,.1-.88-.26-1.48-1.06-.24-2.47.67-2.47.67h0Z"/>
  <path fill="#462718" d="M30.4,29.91c.12-.06-2.23-8.1-3.89-9.69,1.46.17,3.12.13,3.12.13l-.82-4.6.17,3.92s-3.44-.76-4.38-.89c-.2-.17-.45-.6-.58-.84.65-1.17,1.03-2.52.34-3.21-1.22-1.21-2.68-.52-3,1.25-.25,1.37-.12,4.37.77,4.12.31-.09.85-.61,1.36-1.32l.51.65-3.13,3.32-.72-5.36s0,5.7.34,6.61c.57.04,3.64-2.67,3.64-2.67,0,0,1.81,2.52,1.95,4.24-1.49.8-4.41,2.59-4.78,3.16-.34.52,4.9,3.34,5.74,3.87-.59-.54-3.28-3.43-3.28-3.43l3.81-1.59,1.64,2.69s-.55,1.03-1.15,2.39l1.18-.54c.63-1.24,1.13-2.19,1.18-2.21h-.02Z"/>
  <path fill="#462718" d="M27.02,32.61c.07.06.11.1.11.09,0,0-.04-.04-.11-.09Z"/>
</svg>`;

/** Renders the logo emblem SVG to a square PNG canvas blob at the given size. */
function renderLogoToPng(size: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([FAVICON_SVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('no ctx')); return; }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')); };
    img.src = url;
  });
}

// ── Favicon section ───────────────────────────────────────────────────────────

function FaviconCard() {
  const { error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [favicon, setFavicon]   = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [preview, setPreview]   = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [saving, setSaving]     = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    siteApi.getFavicon()
      .then(r => setFavicon(r.data.favicon_url))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async (blob?: Blob) => {
    const target = blob ?? file;
    if (!target) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('favicon', target, 'favicon.png');
      const res = await siteApi.updateFavicon(fd);
      setFavicon(res.data.favicon_url);
      setPreview(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      swal.success('Favicon updated!');
    } catch { error('Failed to update favicon.'); }
    finally { setSaving(false); }
  };

  /** Generate 64×64 PNG from the logo emblem, preview it in-card */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await renderLogoToPng(64);
      const url  = URL.createObjectURL(blob);
      setPreview(url);
      setFile(new File([blob], 'favicon.png', { type: 'image/png' }));
    } catch { error('Failed to generate favicon from logo.'); }
    finally { setGenerating(false); }
  };

  /** Download 256×256 PNG to disk */
  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await renderLogoToPng(256);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'afristudio-favicon.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch { error('Failed to download favicon.'); }
    finally { setGenerating(false); }
  };

  const discard = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const src = preview ?? favicon ?? null;

  if (loading) return <SectionSpinner />;

  return (
    <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
      <SectionHeader
        icon={Globe}
        title="Site Favicon"
        action={
          <div className="flex flex-wrap gap-2">
            {/* Generate from logo */}
            {!file && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {generating ? <Spinner size="sm" /> : <Wand2 size={12} />}
                {generating ? 'Generating…' : 'From Logo'}
              </button>
            )}

            {/* Download high-res */}
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs font-medium text-earth-500 hover:text-earth-700 border border-earth-200 hover:border-earth-300 hover:bg-earth-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {generating ? <Spinner size="sm" /> : <Download size={12} />}
              Download
            </button>

            {/* Upload custom */}
            {!file && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Upload size={12} /> Upload
              </button>
            )}

            {/* Discard / Save after selection */}
            {file && (
              <>
                <button onClick={discard} className="flex items-center gap-1 text-xs border border-earth-200 text-earth-500 hover:bg-earth-50 px-2.5 py-1.5 rounded-lg transition-colors">
                  <X size={12} /> Discard
                </button>
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {saving ? <Spinner size="sm" /> : <Save size={12} />}
                  {saving ? 'Saving…' : 'Save Favicon'}
                </button>
              </>
            )}
          </div>
        }
      />
      <input ref={fileInputRef} type="file" accept="image/*,.ico" className="hidden" onChange={handleFileChange} />

      <div className="p-5">
        <div className="flex items-end gap-6 flex-wrap">

          {/* Size previews on checkered background */}
          {(['16', '32', '64'] as const).map(sz => {
            const n = Number(sz);
            const box = n === 16 ? 'w-9 h-9' : n === 32 ? 'w-12 h-12' : 'w-16 h-16';
            const img = n === 16 ? 'w-4 h-4' : n === 32 ? 'w-8 h-8' : 'w-14 h-14';
            return (
              <div key={sz} className="flex flex-col items-center gap-1.5">
                <div
                  className={`${box} rounded-lg border border-earth-200 flex items-center justify-center overflow-hidden`}
                  style={{ backgroundImage: 'repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%)', backgroundSize: '8px 8px' }}
                >
                  {src
                    ? <img src={src} alt={`${sz}px`} className={`${img} object-contain`} />
                    : <Globe size={n === 16 ? 13 : n === 32 ? 18 : 26} className="text-earth-300" />}
                </div>
                <span className="text-[10px] text-earth-400">{sz} px</span>
              </div>
            );
          })}

          {/* Browser tab mockup */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="rounded-t-lg border border-b-0 border-earth-300 bg-white px-3 py-1.5 flex items-center gap-1.5 min-w-[130px] shadow-sm">
              {src
                ? <img src={src} alt="tab" className="w-4 h-4 object-contain shrink-0" />
                : <Globe size={14} className="text-earth-400 shrink-0" />}
              <span className="text-[11px] text-earth-700 font-medium truncate flex-1">AfriStudio</span>
              <X size={10} className="text-earth-400 shrink-0" />
            </div>
            <div className="w-full h-px bg-earth-200" />
            <span className="text-[10px] text-earth-400">Tab preview</span>
          </div>

          {/* Status info */}
          <div className="ml-auto text-right shrink-0 hidden sm:block">
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
              favicon ? 'bg-emerald-100 text-emerald-700' : 'bg-earth-100 text-earth-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${favicon ? 'bg-emerald-500' : 'bg-earth-400'}`} />
              {favicon ? 'Favicon active' : 'No favicon set'}
            </div>
            <p className="text-[11px] text-earth-400 mt-1.5">PNG or ICO · 64 × 64 px recommended</p>
            {preview && <p className="text-[11px] text-amber-500 font-semibold mt-1">● Unsaved preview</p>}
          </div>
        </div>

        {/* Generated preview notice */}
        {file && preview && (
          <div className="mt-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
            <Wand2 size={13} className="text-violet-500 shrink-0" />
            <p className="text-xs text-violet-700 font-medium">
              Favicon generated from the AfriStudio logo — click <strong>Save Favicon</strong> to apply, or <strong>Download</strong> to save the file.
            </p>
          </div>
        )}
      </div>
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

// ── Language Config section ──────────────────────────────────────────────────

function LanguageConfigCard() {
  const { error } = useToast();
  const [config, setConfig] = useState<LanguageConfig | null>(null);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [defaultLanguage, setDefaultLanguage] = useState('EN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    siteApi.getLanguages()
      .then(r => {
        setConfig(r.data);
        setEnabled(r.data.enabled_languages);
        setDefaultLanguage(r.data.default_language);
      })
      .catch(() => error('Failed to load languages.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const toggleLanguage = (code: string) => {
    setEnabled(current => {
      if (current.includes(code)) {
        const next = current.filter(item => item !== code);
        if (next.length === 0) return current;
        if (defaultLanguage === code) setDefaultLanguage(next[0]);
        return next;
      }
      return [...current, code];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await siteApi.updateLanguages({ enabled_languages: enabled, default_language: defaultLanguage });
      setConfig(res.data);
      setEnabled(res.data.enabled_languages);
      setDefaultLanguage(res.data.default_language);
      swal.success('Languages updated!');
    } catch { error('Failed to update languages.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SectionSpinner />;
  if (!config) return null;

  return (
    <div className="bg-white rounded-2xl border border-earth-100 shadow-sm overflow-hidden">
      <SectionHeader
        icon={Globe}
        title="Languages"
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {saving ? <Spinner size="sm" /> : <Save size={12} />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        }
      />
      <div className="p-5 space-y-4">
        <div>
          <label className="block text-xs text-earth-500 mb-1">Default Language</label>
          <select
            className="input w-full text-sm"
            value={defaultLanguage}
            onChange={e => setDefaultLanguage(e.target.value)}
          >
            {config.available_languages
              .filter(lang => enabled.includes(lang.code))
              .map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name} - {lang.code}</option>
              ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {config.available_languages.map(lang => {
            const checked = enabled.includes(lang.code);
            return (
              <label
                key={lang.code}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                  checked ? 'border-primary-200 bg-primary-50' : 'border-earth-100 bg-earth-50 hover:border-earth-200'
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-earth-800 truncate">{lang.name}</span>
                  <span className="block text-[11px] font-semibold text-earth-400 uppercase">{lang.code}</span>
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLanguage(lang.code)}
                  className="w-4 h-4 rounded accent-primary-600 shrink-0"
                />
              </label>
            );
          })}
        </div>

        <p className="text-xs text-earth-400">
          Enabled: {enabled.length} of {config.available_languages.length}
        </p>
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
            <p className="text-white/70 text-sm mt-0.5">Manage the public landing page content, contact info, languages, and artist profile.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            {[
              { label: 'Sections', value: '5' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-[11px] text-white/60 font-medium uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Image + Favicon — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeroImageCard />
        <FaviconCard />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <HeroTextCard />
          <ContactInfoCard />
          <LanguageConfigCard />
        </div>

        {/* Right column */}
        <div className="lg:col-span-3">
          <ArtistCard />
        </div>
      </div>
    </div>
  );
}

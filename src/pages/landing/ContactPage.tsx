import { useEffect, useState } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';
import { siteApi } from '../../api';
import type { ContactInfo } from '../../api/types';
import { useToast } from '../../components/ui/Toast';
import { SliderCaptcha } from '../../components/ui/SliderCaptcha';

const DEFAULT_INFO: ContactInfo = {
  email: 'hello@afristudio.art',
  phone: '+255 712 345 678',
  location: 'Dar es Salaam, Tanzania',
  updated_at: '',
};

export function ContactPage() {
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [humanVerified, setHumanVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [info, setInfo] = useState<ContactInfo>(DEFAULT_INFO);

  useEffect(() => {
    siteApi.getContactInfo()
      .then(res => setInfo(res.data))
      .catch(() => {/* use defaults */});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!humanVerified) {
      error('Please complete the slider verification first.');
      setLoading(false);
      return;
    }
    try {
      await siteApi.submitContact(form);
      setSent(true);
      success('Message sent!');
    } catch {
      error('Failed to send message. Please try again.');
      // Reset captcha so user must re-verify on retry
      setHumanVerified(false);
      setCaptchaKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const contactItems = [
    { icon: Mail,    label: 'Email',    value: info.email },
    { icon: Phone,   label: 'Phone',    value: info.phone },
    { icon: MapPin,  label: 'Location', value: info.location },
  ];

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950 transition-colors duration-300 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-earth-900 dark:bg-earth-950 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            We'd Love to<br />
            <span className="text-primary-400">Hear From You</span>
          </h1>
          <p className="text-earth-300 text-lg leading-relaxed">
            Have a question about an artwork, an auction, or our platform? Our team is happy to help.
          </p>
        </div>
      </section>

      {/* Contact content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Info panel */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-earth-900 dark:text-earth-100 mb-6">Contact Information</h2>
              <div className="space-y-5">
                {contactItems.map(item => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <div className="w-10 h-10 shrink-0 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
                      <item.icon size={18} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-xs text-earth-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                      <p className="text-earth-800 dark:text-earth-200 font-medium text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary-600/10 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 rounded-2xl p-6">
              <MessageSquare size={22} className="text-primary-600 dark:text-primary-400 mb-3" />
              <h3 className="font-semibold text-earth-900 dark:text-earth-100 mb-2">Artist Support</h3>
              <p className="text-sm text-earth-500 dark:text-earth-400 leading-relaxed">
                Are you an artist looking to list your work? We offer a dedicated onboarding process. Reach out and we'll guide you through it.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-earth-800 rounded-2xl border border-earth-100 dark:border-earth-700 p-8 shadow-sm">
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={28} className="text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-earth-900 dark:text-earth-100 mb-2">Message Sent!</h3>
                  <p className="text-earth-500 dark:text-earth-400 text-sm">We'll get back to you within 24 hours.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); setHumanVerified(false); setCaptchaKey(k => k + 1); }}
                    className="mt-6 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 uppercase tracking-wide mb-1.5">Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Your full name"
                        className="w-full border border-earth-200 dark:border-earth-600 rounded-lg px-3 py-2.5 text-sm text-earth-900 dark:text-earth-100 bg-earth-50 dark:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-earth-400 dark:placeholder-earth-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 uppercase tracking-wide mb-1.5">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full border border-earth-200 dark:border-earth-600 rounded-lg px-3 py-2.5 text-sm text-earth-900 dark:text-earth-100 bg-earth-50 dark:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-earth-400 dark:placeholder-earth-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 uppercase tracking-wide mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="How can we help?"
                      className="w-full border border-earth-200 dark:border-earth-600 rounded-lg px-3 py-2.5 text-sm text-earth-900 dark:text-earth-100 bg-earth-50 dark:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-earth-400 dark:placeholder-earth-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-earth-700 dark:text-earth-300 uppercase tracking-wide mb-1.5">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us more..."
                      className="w-full border border-earth-200 dark:border-earth-600 rounded-lg px-3 py-2.5 text-sm text-earth-900 dark:text-earth-100 bg-earth-50 dark:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder-earth-400 dark:placeholder-earth-500 resize-none"
                    />
                  </div>
                  <SliderCaptcha
                    resetKey={captchaKey}
                    onVerified={() => setHumanVerified(true)}
                  />
                  <button
                    type="submit"
                    disabled={loading || !humanVerified}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Send size={16} /> {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="flex-1" />
      <Footer />
    </div>
  );
}

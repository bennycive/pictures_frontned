import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';

export function RegisterPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'email' | 'phone'>('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: { name: string; email?: string; phone?: string; password: string } = { name: form.name, password: form.password };
      if (tab === 'email') payload.email = form.email;
      else payload.phone = form.phone;
      await authApi.register(payload);
      success('Account created! Please check your email/phone for the verification code.');
      navigate('/verify', { state: { identifier: tab === 'email' ? form.email : form.phone } });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = data ? Object.values(data).flat()[0] : 'Registration failed.';
      error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold">AS</div>
            <span className="font-display font-bold text-xl text-earth-900">AfriStudio</span>
          </Link>
          <h1 className="text-2xl font-bold text-earth-900">Create account</h1>
          <p className="text-earth-500 mt-1">Join AfriStudio today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-earth-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Full Name</label>
              <input type="text" className="input" placeholder="Jane Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>

            {/* Email/Phone tabs */}
            <div>
              <div className="flex rounded-lg border border-earth-200 p-1 mb-3">
                {(['email', 'phone'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'text-earth-500 hover:text-earth-700'}`}>
                    {t === 'email' ? 'Email' : 'Phone'}
                  </button>
                ))}
              </div>
              {tab === 'email' ? (
                <input type="email" className="input" placeholder="jane@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              ) : (
                <input type="tel" className="input" placeholder="+255712345678" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min. 8 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-earth-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

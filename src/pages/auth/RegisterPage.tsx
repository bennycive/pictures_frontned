import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Logo } from '../../components/ui/Logo';
import { PhoneInput } from '../../components/ui/PhoneInput';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.6-4.2 7.3-10.5 7.3-17.5z" fill="#4285F4"/>
      <path d="M24 48c6.6 0 12.2-2.2 16.2-5.9l-7.9-6c-2.2 1.5-5 2.3-8.3 2.3-6.4 0-11.8-4.3-13.7-10.1H2.1v6.2C6.1 42.6 14.5 48 24 48z" fill="#34A853"/>
      <path d="M10.3 28.3c-.5-1.5-.8-3-.8-4.8s.3-3.3.8-4.8v-6.2H2.1C.8 15.6 0 19.7 0 24s.8 8.4 2.1 11.5l8.2-7.2z" fill="#FBBC04"/>
      <path d="M24 9.5c3.6 0 6.8 1.2 9.3 3.6l7-7C36.2 2.2 30.6 0 24 0 14.5 0 6.1 5.4 2.1 13.3l8.2 6.2C12.2 13.8 17.6 9.5 24 9.5z" fill="#EA4335"/>
    </svg>
  );
}

export function RegisterPage() {
  const { success, error, info } = useToast();
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

  const handleGoogle = () => {
    info('Google sign-in is coming soon. Please use email or phone to register.');
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center">
            <Logo variant="dark" className="h-9 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-primary-100 overflow-hidden">
          {/* Card header */}
          <div className="bg-primary-50 px-8 pt-8 pb-6 text-center">
            <div className="w-14 h-14 bg-primary-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={22} className="text-primary-700" />
            </div>
            <h1 className="font-script text-3xl text-earth-900">Create Account</h1>
            <p className="text-earth-500 text-sm mt-1">Join AfriStudio today</p>
          </div>

          <div className="px-8 py-6 space-y-4">
            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-earth-200 rounded-xl bg-white hover:bg-earth-50 text-earth-700 font-medium text-sm transition-colors"
            >
              <GoogleIcon />
              Sign up with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-earth-100" />
              <span className="text-xs text-earth-400">or</span>
              <div className="flex-1 h-px bg-earth-100" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Full Name</label>
                <input type="text" className="input" placeholder="Jane Doe"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus required />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Sign up with</label>
                <div className="flex rounded-xl border border-earth-200 p-1 mb-2">
                  {(['email', 'phone'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTab(t)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-primary-600 text-white' : 'text-earth-500 hover:text-earth-700'}`}>
                      {t === 'email' ? 'Email' : 'Phone'}
                    </button>
                  ))}
                </div>
                {tab === 'email'
                  ? <input type="email" className="input" placeholder="jane@example.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  : <PhoneInput
                      value={form.phone}
                      onChange={phone => setForm(f => ({ ...f, phone }))}
                      required
                    />
                }
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10"
                    placeholder="Min. 8 characters" minLength={8}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-earth-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

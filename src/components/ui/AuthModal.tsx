import React, { useState } from 'react';
import { X, Eye, EyeOff, Gavel, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { useToast } from './Toast';

type Tab = 'login' | 'register' | 'verify';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful login or account verification */
  onSuccess?: () => void;
  /** Pre-selected tab when the modal opens */
  defaultTab?: 'login' | 'register';
  /** Context hint shown at the top, e.g. "Sign in to place your bid" */
  hint?: string;
}

export function AuthModal({ open, onClose, onSuccess, defaultTab = 'login', hint }: AuthModalProps) {
  const { login } = useAuth();
  const { success, error } = useToast();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [regTab, setRegTab] = useState<'email' | 'phone'>('email');
  const [pendingIdentifier, setPendingIdentifier] = useState('');

  // Form states
  const [loginForm, setLoginForm] = useState({ login: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [verifyForm, setVerifyForm] = useState({ identifier: '', code: '' });

  if (!open) return null;

  const reset = () => {
    setTab(defaultTab);
    setLoginForm({ login: '', password: '' });
    setRegForm({ name: '', email: '', phone: '', password: '' });
    setVerifyForm({ identifier: '', code: '' });
    setShowPass(false);
    setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  /* ── Login ─────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginForm.login, loginForm.password);
      success('Welcome back!');
      reset();
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if ((err as { response?: { status?: number } })?.response?.status === 403) {
        // Account not verified — jump to verify tab
        setPendingIdentifier(loginForm.login);
        setVerifyForm(v => ({ ...v, identifier: loginForm.login }));
        setTab('verify');
        error('Account not verified. Please enter the code sent to you.');
      } else {
        error(msg || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ───────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: { name: string; email?: string; phone?: string; password: string } = {
        name: regForm.name, password: regForm.password,
      };
      if (regTab === 'email') payload.email = regForm.email;
      else payload.phone = regForm.phone;
      await authApi.register(payload);
      const identifier = regTab === 'email' ? regForm.email : regForm.phone;
      setPendingIdentifier(identifier);
      setVerifyForm({ identifier, code: '' });
      success('Account created! Enter the verification code sent to you.');
      setTab('verify');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
      const msg = data ? Object.values(data).flat()[0] : 'Registration failed.';
      error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  /* ── Verify ─────────────────────────────────────────────────── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyAccount(verifyForm);
      // Auto-login after verification if we have credentials
      if (loginForm.password && (loginForm.login || pendingIdentifier)) {
        try {
          await login(loginForm.login || pendingIdentifier, loginForm.password || regForm.password);
        } catch { /* ignore – user can log in manually */ }
      }
      success('Account verified! You can now use AfriStudio.');
      reset();
      onClose();
      onSuccess?.();
    } catch {
      error('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-earth-900 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">AS</div>
            <span className="text-white font-bold">AfriStudio</span>
          </div>
          <button onClick={handleClose} className="text-earth-400 hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Hint */}
        {hint && tab !== 'verify' && (
          <div className="bg-primary-50 border-b border-primary-100 px-6 py-3 flex items-center gap-2 text-sm text-primary-700">
            <Gavel size={15} className="shrink-0" />
            {hint}
          </div>
        )}

        {/* Tab switcher */}
        {tab !== 'verify' && (
          <div className="flex border-b border-earth-100">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  tab === t
                    ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-earth-500 hover:text-earth-700'
                }`}
              >
                {t === 'login' ? <><LogIn size={15} /> Sign In</> : <><UserPlus size={15} /> Register</>}
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          {/* ── Login form ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
                <input
                  type="text"
                  className="input"
                  placeholder="jane@example.com or +255..."
                  value={loginForm.login}
                  onChange={e => setLoginForm(f => ({ ...f, login: e.target.value }))}
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-xs text-earth-400">
                Don't have an account?{' '}
                <button type="button" onClick={() => setTab('register')} className="text-primary-600 hover:underline font-medium">
                  Register
                </button>
              </p>
            </form>
          )}

          {/* ── Register form ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Full Name</label>
                <input type="text" className="input" placeholder="Jane Doe"
                  value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus required />
              </div>
              <div>
                <div className="flex rounded-lg border border-earth-200 p-1 mb-2">
                  {(['email', 'phone'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setRegTab(t)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${regTab === t ? 'bg-primary-600 text-white' : 'text-earth-500 hover:text-earth-700'}`}>
                      {t === 'email' ? 'Email' : 'Phone'}
                    </button>
                  ))}
                </div>
                {regTab === 'email'
                  ? <input type="email" className="input" placeholder="jane@example.com"
                      value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} required />
                  : <input type="tel" className="input" placeholder="+255712345678"
                      value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} required />
                }
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10"
                    placeholder="Min. 8 characters" minLength={8}
                    value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="text-center text-xs text-earth-400">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-primary-600 hover:underline font-medium">
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* ── Verify form ── */}
          {tab === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-center mb-2">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📬</span>
                </div>
                <h3 className="font-bold text-earth-900">Check your {pendingIdentifier.includes('@') ? 'email' : 'phone'}</h3>
                <p className="text-sm text-earth-500 mt-1">We sent a 6-digit code to <strong>{pendingIdentifier}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input text-center text-3xl tracking-[0.5em] font-bold"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyForm.code}
                  onChange={e => setVerifyForm(v => ({ ...v, code: e.target.value.replace(/\D/g, '') }))}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" disabled={loading || verifyForm.code.length !== 6} className="btn-primary w-full py-3">
                {loading ? 'Verifying…' : 'Verify Account'}
              </button>
              <button type="button" onClick={() => setTab('login')}
                className="w-full text-center text-sm text-earth-400 hover:text-earth-600 transition-colors">
                ← Back to Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

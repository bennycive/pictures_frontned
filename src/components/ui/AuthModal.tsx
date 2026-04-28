import React, { useState } from 'react';
import { X, Eye, EyeOff, Gavel, Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import { useToast } from './Toast';
import { OtpInput } from './OtpInput';
import { Logo } from './Logo';

type Tab = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: 'login' | 'register';
  hint?: string;
}

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

const HEADINGS: Record<Tab, string> = {
  login:    'Welcome Back',
  register: 'Create Account',
  verify:   'Verify Account',
  forgot:   'Forgot Password?',
  reset:    'Enter New Password',
};

const SUBTITLES: Record<Tab, string> = {
  login:    'Sign in to continue',
  register: 'Join AfriStudio today',
  verify:   'Enter the code sent to you',
  forgot:   "We'll send a reset code to your email or phone",
  reset:    'Enter the code and choose a new password',
};

const ICONS: Record<Tab, typeof Lock> = {
  login:    Lock,
  register: Lock,
  verify:   ShieldCheck,
  forgot:   KeyRound,
  reset:    Lock,
};

export function AuthModal({ open, onClose, onSuccess, defaultTab = 'login', hint }: AuthModalProps) {
  const { login } = useAuth();
  const { success, error, info } = useToast();
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [resendingVerify, setResendingVerify] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regTab, setRegTab] = useState<'email' | 'phone'>('email');
  const [pendingIdentifier, setPendingIdentifier] = useState('');

  // Form states
  const [loginForm, setLoginForm]   = useState({ login: '', password: '' });
  const [regForm, setRegForm]       = useState({ name: '', email: '', phone: '', password: '' });
  const [verifyDigits, setVerifyDigits] = useState<string[]>(Array(6).fill(''));
  const [verifyId, setVerifyId]     = useState('');
  const [forgotLogin, setForgotLogin] = useState('');
  const [resetLogin, setResetLogin] = useState('');
  const [resetDigits, setResetDigits] = useState<string[]>(Array(6).fill(''));
  const [resetPassword, setResetPassword]   = useState('');
  const [resetConfirm, setResetConfirm]     = useState('');

  if (!open) return null;

  const reset = () => {
    setTab(defaultTab);
    setLoginForm({ login: '', password: '' });
    setRegForm({ name: '', email: '', phone: '', password: '' });
    setVerifyDigits(Array(6).fill(''));
    setVerifyId('');
    setForgotLogin('');
    setResetLogin('');
    setResetDigits(Array(6).fill(''));
    setResetPassword('');
    setResetConfirm('');
    setShowPass(false);
    setShowConfirm(false);
    setLoading(false);
    setResendingVerify(false);
  };

  const handleClose = () => { reset(); onClose(); };

  /* ── Login ── */
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
        setPendingIdentifier(loginForm.login);
        setVerifyId(loginForm.login);
        setTab('verify');
        error('Account not verified. Please enter the code sent to you.');
      } else {
        error(msg || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ── */
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
      setVerifyId(identifier);
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

  /* ── Verify ── */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verifyDigits.join('');
    setLoading(true);
    try {
      await authApi.verifyAccount({ identifier: verifyId, code });
      if (loginForm.password && (loginForm.login || pendingIdentifier)) {
        try { await login(loginForm.login || pendingIdentifier, loginForm.password || regForm.password); } catch { /* ignore */ }
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

  const handleResendVerification = async () => {
    if (!verifyId.trim()) {
      error('Enter your email or phone first.');
      return;
    }
    setResendingVerify(true);
    try {
      await authApi.resendVerification({ identifier: verifyId.trim() });
      setVerifyDigits(Array(6).fill(''));
      success('A new verification code has been sent.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      error(msg || 'Could not resend the code. Please try again.');
    } finally {
      setResendingVerify(false);
    }
  };

  /* ── Forgot password ── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ login: forgotLogin });
      success('If the account exists, a reset code has been sent.');
      setResetLogin(forgotLogin);
      setTab('reset');
    } catch {
      error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Reset password ── */
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirm) { error('Passwords do not match.'); return; }
    const code = resetDigits.join('');
    setLoading(true);
    try {
      await authApi.resetPassword({ login: resetLogin, code, password: resetPassword, password_confirmation: resetConfirm });
      success('Password reset! Please sign in with your new password.');
      reset();
      setTab('login');
    } catch {
      error('Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    info('Google sign-in is coming soon. Please use email or phone to sign in.');
  };

  const verifyComplete = verifyDigits.every(d => d !== '');
  const resetComplete  = resetDigits.every(d => d !== '');
  const Icon = ICONS[tab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-white dark:bg-earth-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 transition-colors p-1.5 rounded-full hover:bg-earth-100 dark:hover:bg-earth-800 z-10"
        >
          <X size={18} />
        </button>

        {/* Cream header */}
        <div className="bg-primary-50 dark:bg-earth-800 px-6 pt-8 pb-6 text-center">
          <div className="flex items-center justify-center mb-5">
            <Logo variant="dark" className="h-8 w-auto" />
          </div>
          <div className="w-14 h-14 bg-primary-200 dark:bg-primary-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon size={22} className="text-primary-700 dark:text-primary-300" />
          </div>
          <h2 className="font-script text-3xl text-earth-900 dark:text-earth-100">{HEADINGS[tab]}</h2>
          <p className="text-earth-500 dark:text-earth-400 text-sm mt-1">
            {tab === 'verify' ? `Code sent to ${pendingIdentifier}` : SUBTITLES[tab]}
          </p>
        </div>

        {/* Hint */}
        {hint && tab === 'login' && (
          <div className="bg-primary-50 border-b border-primary-100 px-6 py-3 flex items-center gap-2 text-sm text-primary-700">
            <Gavel size={15} className="shrink-0" />
            {hint}
          </div>
        )}

        {/* Login / Register tab switcher */}
        {(tab === 'login' || tab === 'register') && (
          <div className="flex border-b border-earth-100 dark:border-earth-700">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-primary-700 dark:text-primary-400 border-b-2 border-primary-600'
                    : 'text-earth-500 dark:text-earth-400 hover:text-earth-700 dark:hover:text-earth-200'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 space-y-4">

          {/* Google button — login & register only */}
          {(tab === 'login' || tab === 'register') && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-earth-200 dark:border-earth-700 rounded-xl bg-white dark:bg-earth-800 hover:bg-earth-50 dark:hover:bg-earth-700 text-earth-700 dark:text-earth-200 font-medium text-sm transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-earth-100 dark:bg-earth-700" />
                <span className="text-xs text-earth-400">or</span>
                <div className="flex-1 h-px bg-earth-100 dark:bg-earth-700" />
              </div>
            </>
          )}

          {/* ── Login form ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Email or Phone</label>
                <input
                  type="text" className="input" placeholder="jane@example.com or +255..."
                  value={loginForm.login} onChange={e => setLoginForm(f => ({ ...f, login: e.target.value }))}
                  autoFocus required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-earth-700 dark:text-earth-300">Password</label>
                  <button type="button" onClick={() => setTab('forgot')}
                    className="text-xs text-primary-600 hover:text-primary-700 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} className="input pr-10"
                    placeholder="Your password"
                    value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="text-center text-xs text-earth-400">
                Don't have an account?{' '}
                <button type="button" onClick={() => setTab('register')} className="text-primary-600 hover:underline font-medium">Register</button>
              </p>
            </form>
          )}

          {/* ── Register form ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Full Name</label>
                <input type="text" className="input" placeholder="Jane Doe"
                  value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus required />
              </div>
              <div>
                <div className="flex rounded-lg border border-earth-200 dark:border-earth-700 p-1 mb-2">
                  {(['email', 'phone'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setRegTab(t)}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${regTab === t ? 'bg-primary-600 text-white' : 'text-earth-500 hover:text-earth-700 dark:text-earth-400'}`}>
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
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Password</label>
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
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="text-center text-xs text-earth-400">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('login')} className="text-primary-600 hover:underline font-medium">Sign In</button>
              </p>
            </form>
          )}

          {/* ── Verify form ── */}
          {tab === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Email or Phone</label>
                <input type="text" className="input"
                  value={verifyId} onChange={e => setVerifyId(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-3">Verification Code</label>
                <OtpInput value={verifyDigits} onChange={setVerifyDigits} autoFocus disabled={loading} />
              </div>
              <button type="submit" disabled={loading || !verifyComplete} className="btn-primary w-full py-2.5">
                {loading ? 'Verifying…' : 'Verify Account'}
              </button>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading || resendingVerify}
                className="btn-secondary w-full py-2.5"
              >
                {resendingVerify ? 'Sending new code…' : "Didn't get a code? Resend"}
              </button>
              <button type="button" onClick={() => setTab('login')}
                className="w-full text-center text-sm text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 transition-colors">
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* ── Forgot password form ── */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Email or Phone</label>
                <input
                  type="text" className="input" placeholder="jane@example.com or +255..."
                  value={forgotLogin} onChange={e => setForgotLogin(e.target.value)}
                  autoFocus required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
              <button type="button" onClick={() => setTab('login')}
                className="w-full text-center text-sm text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 transition-colors">
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* ── Reset password form ── */}
          {tab === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Email or Phone</label>
                <input type="text" className="input"
                  value={resetLogin} onChange={e => setResetLogin(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-3">Reset Code</label>
                <OtpInput value={resetDigits} onChange={setResetDigits} autoFocus disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} className="input pr-10"
                    placeholder="Min. 8 characters" minLength={8}
                    value={resetPassword} onChange={e => setResetPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 dark:text-earth-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} className="input pr-10"
                    placeholder="Repeat new password"
                    value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} required />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || !resetComplete} className="btn-primary w-full py-2.5">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setTab('forgot')}
                className="w-full text-center text-sm text-earth-400 hover:text-earth-600 dark:hover:text-earth-200 transition-colors">
                ← Request new code
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

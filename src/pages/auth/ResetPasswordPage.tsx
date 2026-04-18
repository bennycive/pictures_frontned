import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { OtpInput } from '../../components/ui/OtpInput';
import { Logo } from '../../components/ui/Logo';

const CODE_LENGTH = 6;

export function ResetPasswordPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillLogin = (location.state as { login?: string })?.login || '';

  const [loginVal, setLoginVal] = useState(prefillLogin);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const code = digits.join('');
  const isCodeComplete = code.length === CODE_LENGTH && digits.every(d => d !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) { error('Passwords do not match.'); return; }
    if (!isCodeComplete) { error('Please enter the full 6-digit code.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({ login: loginVal, code, password, password_confirmation: passwordConfirm });
      success('Password reset successfully. Please sign in with your new password.');
      navigate('/login');
    } catch {
      error('Invalid or expired code. Please request a new one.');
    } finally {
      setLoading(false);
    }
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
              <Lock size={22} className="text-primary-700" />
            </div>
            <h1 className="font-script text-3xl text-earth-900">Enter New Password</h1>
            <p className="text-earth-500 text-sm mt-1">Enter the code sent to you and set a new password</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
                <input
                  type="text" className="input"
                  value={loginVal}
                  onChange={e => setLoginVal(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-3">Reset Code</label>
                <OtpInput value={digits} onChange={setDigits} autoFocus={!prefillLogin} disabled={loading} />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} className="input pr-10"
                    placeholder="Min. 8 characters"
                    value={password} onChange={e => setPassword(e.target.value)}
                    minLength={8} required
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600">
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Confirm Password</label>
                <input
                  type="password" className="input"
                  placeholder="Repeat your new password"
                  value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required
                />
              </div>

              <button type="submit" disabled={loading || !isCodeComplete} className="btn-primary w-full py-3">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-earth-500 mt-6">
          <Link to="/" className="text-primary-600 hover:text-primary-700 font-medium">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}

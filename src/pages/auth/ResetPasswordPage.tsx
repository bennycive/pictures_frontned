import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';

export function ResetPasswordPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillLogin = (location.state as { login?: string })?.login || '';
  const [form, setForm] = useState({ login: prefillLogin, code: '', password: '', password_confirmation: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) { error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(form);
      success('Password reset successfully. Please login with your new password.');
      navigate('/login');
    } catch {
      error('Invalid or expired code.');
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
          <h1 className="text-2xl font-bold text-earth-900">Set new password</h1>
          <p className="text-earth-500 mt-1">Enter the code sent to you</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-earth-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
              <input type="text" className="input" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Reset Code</label>
              <input type="text" className="input text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.replace(/\D/g, '') }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="input pr-10" placeholder="Min. 8 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={8} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Confirm Password</label>
              <input type="password" className="input" placeholder="Repeat your new password" value={form.password_confirmation}
                onChange={e => setForm(f => ({ ...f, password_confirmation: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-earth-500 mt-6">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}

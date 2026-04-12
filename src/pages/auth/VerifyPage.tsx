import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';

export function VerifyPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = (location.state as { identifier?: string })?.identifier || '';
  const [form, setForm] = useState({ identifier, code: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyAccount(form);
      success('Account verified! You can now login.');
      navigate('/login');
    } catch {
      error('Invalid or expired code. Please try again.');
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
          <h1 className="text-2xl font-bold text-earth-900">Verify your account</h1>
          <p className="text-earth-500 mt-1">Enter the 6-digit code sent to you</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-earth-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
              <input type="text" className="input" value={form.identifier} onChange={e => setForm(f => ({ ...f, identifier: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Verification Code</label>
              <input type="text" className="input text-center text-2xl tracking-widest" placeholder="000000" maxLength={6} value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.replace(/\D/g, '') }))} required />
            </div>
            <button type="submit" disabled={loading || form.code.length !== 6} className="btn-primary w-full py-3">
              {loading ? 'Verifying...' : 'Verify Account'}
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

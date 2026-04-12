import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';

export function ForgotPasswordPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ login });
      success('If the account exists, a reset code has been sent.');
      navigate('/reset-password', { state: { login } });
    } catch {
      error('Something went wrong. Please try again.');
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
          <h1 className="text-2xl font-bold text-earth-900">Reset password</h1>
          <p className="text-earth-500 mt-1">We'll send a reset code to your email or phone</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-earth-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
              <input type="text" className="input" placeholder="jane@example.com" value={login} onChange={e => setLogin(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Sending...' : 'Send Reset Code'}
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

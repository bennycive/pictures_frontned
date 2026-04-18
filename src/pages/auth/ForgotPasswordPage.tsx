import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Logo } from '../../components/ui/Logo';

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
              <KeyRound size={22} className="text-primary-700" />
            </div>
            <h1 className="font-script text-3xl text-earth-900">Forgot Password?</h1>
            <p className="text-earth-500 text-sm mt-1">We'll send a reset code to your email or phone</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
                <input
                  type="text" className="input"
                  placeholder="jane@example.com or +255..."
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  autoFocus required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Sending…' : 'Send Reset Code'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-earth-500 mt-6">
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}

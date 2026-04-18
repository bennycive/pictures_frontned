import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { OtpInput } from '../../components/ui/OtpInput';
import { Logo } from '../../components/ui/Logo';

const CODE_LENGTH = 6;

export function VerifyPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = (location.state as { identifier?: string })?.identifier || '';

  const [identifierValue, setIdentifierValue] = useState(identifier);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && digits.every(d => d !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyAccount({ identifier: identifierValue, code });
      success('Account verified! You can now sign in.');
      navigate('/login');
    } catch {
      error('Invalid or expired code. Please try again.');
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
              <ShieldCheck size={22} className="text-primary-700" />
            </div>
            <h1 className="font-script text-3xl text-earth-900">Verify Account</h1>
            <p className="text-earth-500 text-sm mt-1">Enter the 6-digit code sent to you</p>
          </div>

          <div className="px-8 py-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1.5">Email or Phone</label>
                <input
                  type="text" className="input"
                  value={identifierValue}
                  onChange={e => setIdentifierValue(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-3">Verification Code</label>
                <OtpInput value={digits} onChange={setDigits} autoFocus disabled={loading} />
              </div>

              <button
                type="submit"
                disabled={loading || !isComplete}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Verifying…' : 'Verify Account'}
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

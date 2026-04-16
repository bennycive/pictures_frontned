import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api';
import { useToast } from '../../components/ui/Toast';

const CODE_LENGTH = 6;

export function VerifyPage() {
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = (location.state as { identifier?: string })?.identifier || '';

  const [identifierValue, setIdentifierValue] = useState(identifier);
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && digits.every(d => d !== '');

  const updateDigit = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = sanitized;
    setDigits(next);
    if (sanitized && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.verifyAccount({ identifier: identifierValue, code });
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
              <input
                type="text"
                className="input"
                value={identifierValue}
                onChange={e => setIdentifierValue(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-earth-700 mb-3">Verification Code</label>
              <div className="flex gap-2 justify-between">
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => updateDigit(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    onFocus={e => e.target.select()}
                    className={[
                      'w-11 h-12 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors',
                      'text-earth-900 bg-earth-50',
                      digit
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-earth-200 focus:border-primary-400',
                    ].join(' ')}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isComplete}
              className="btn-primary w-full py-3"
            >
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

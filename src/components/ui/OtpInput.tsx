import { useRef } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function OtpInput({ value: digits, onChange, length = 6, autoFocus, disabled }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (i: number, v: string) => {
    const s = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = s;
    onChange(next);
    if (s && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; onChange(n); }
      else if (i > 0) refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    onChange(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] || ''}
          onChange={e => update(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={e => e.target.select()}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          className={[
            'w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl border-2 outline-none transition-all',
            'text-earth-900 dark:text-earth-100',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            digits[i]
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
              : 'border-primary-200 dark:border-earth-600 bg-white dark:bg-earth-800 focus:border-primary-400 focus:bg-primary-50/50',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

import { useState, useEffect } from 'react';

const KEY = 'afristudio-currency';

export function useCurrency() {
  const [currency, setCurrencyState] = useState<string>(
    () => localStorage.getItem(KEY) || 'USD'
  );

  const setCurrency = (code: string) => {
    localStorage.setItem(KEY, code);
    setCurrencyState(code);
  };

  // Keep in sync if another tab changes the value
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) setCurrencyState(e.newValue);
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { currency, setCurrency };
}

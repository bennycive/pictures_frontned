import { useEffect, useState } from 'react';
import { currenciesPublicApi } from '../api';
import type { Currency } from '../api/types';

// Shown when the API is unavailable
const FALLBACK: Currency[] = [
  { uuid: 'usd', code: 'USD', symbol: '$', rate: '1' },
];

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    currenciesPublicApi.list()
      .then(res => {
        const results = res.data.results || [];
        setCurrencies(results.length > 0 ? results : FALLBACK);
      })
      .catch(() => setCurrencies(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  return { currencies, loaded };
}

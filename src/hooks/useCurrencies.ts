import { useEffect, useState } from 'react';
import { currenciesApi } from '../api';
import type { Currency } from '../api/types';

// Shown when the API is unavailable (e.g. unauthenticated guest)
const FALLBACK: Currency[] = [
  { uuid: 'usd', code: 'USD', symbol: '$', rate: '1' },
];

/**
 * Fetches the currency list. Falls back to [USD] if the API returns an error
 * (e.g. the endpoint requires authentication and the user is a guest).
 */
export function useCurrencies() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    currenciesApi.list()
      .then(res => {
        const results = res.data.results || [];
        setCurrencies(results.length > 0 ? results : FALLBACK);
      })
      .catch(() => setCurrencies(FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  return { currencies, loaded };
}

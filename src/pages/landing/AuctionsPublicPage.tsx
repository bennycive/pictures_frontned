import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Image, ChevronDown } from 'lucide-react';
import { auctionsApi } from '../../api';
import type { Auction, Currency } from '../../api/types';
import { useCurrency } from '../../hooks/useCurrency';
import { useCurrencies } from '../../hooks/useCurrencies';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

/** Convert an amount from one currency to another using exchange rates relative to USD. */
function convertPrice(
  amount: string,
  fromCode: string,
  toCode: string,
  currencies: Currency[]
): string {
  if (!amount || fromCode === toCode) {
    const sym = currencies.find(c => c.code === toCode)?.symbol ?? toCode;
    return `${sym} ${parseFloat(amount || '0').toLocaleString()}`;
  }

  const fromRate = parseFloat(currencies.find(c => c.code === fromCode)?.rate ?? '1');
  const toRate   = parseFloat(currencies.find(c => c.code === toCode)?.rate   ?? '1');
  const sym      = currencies.find(c => c.code === toCode)?.symbol ?? toCode;

  if (!fromRate || !toRate) {
    return `${toCode} ${parseFloat(amount).toLocaleString()}`;
  }

  // amount / fromRate = USD amount; USD amount * toRate = target amount
  const converted = (parseFloat(amount) / fromRate) * toRate;

  return `${sym} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AuctionsPublicPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'live' | 'pending' | 'ended'>('all');
  const { currency, setCurrency } = useCurrency();
  const { currencies } = useCurrencies();

  useEffect(() => {
    auctionsApi.list()
      .then(r => setAuctions(r.data as Auction[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? auctions : auctions.filter(a => a.status === filter);

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-earth-900">Auctions</h1>
            <p className="text-earth-500 text-sm mt-1">{auctions.length} auctions total</p>
          </div>

          {/* Currency selector */}
          {currencies.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-sm bg-white border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.uuid} value={c.code}>{c.code}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'live', 'pending', 'ended'] as const).map(f => {
            const count = f === 'all' ? auctions.length : auctions.filter(a => a.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-earth-200 text-earth-600 hover:border-primary-300'}`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-earth-400">No auctions found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(auction => (
              <AuctionCard
                key={auction.uuid}
                auction={auction}
                displayCurrency={currency}
                currencies={currencies}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

interface AuctionCardProps {
  auction: Auction;
  displayCurrency: string;
  currencies: Currency[];
}

function AuctionCard({ auction, displayCurrency, currencies }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (auction.status !== 'live') return;
    const update = () => {
      const diff = new Date(auction.end_time).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [auction]);

  const rawPrice = auction.current_price || auction.start_price;
  const displayPrice = convertPrice(rawPrice, auction.currency, displayCurrency, currencies);
  const showOriginal = auction.currency !== displayCurrency && currencies.length > 0;

  return (
    <Link to={`/auctions/${auction.uuid}`} className="bg-white rounded-xl overflow-hidden border border-earth-100 hover:shadow-md transition-shadow group">
      <div className="aspect-[4/3] overflow-hidden bg-earth-100 relative">
        {auction.artwork_image ? (
          <img
            src={auction.artwork_image}
            alt={auction.artwork_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={40} className="text-earth-300" />
          </div>
        )}
        <div className="absolute top-3 left-3"><StatusBadge status={auction.status} /></div>
        {auction.status === 'live' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white text-sm font-mono font-bold">{timeLeft}</p>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-earth-900 mb-3">{auction.artwork_name}</h3>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-earth-400 text-xs">{auction.current_price ? 'Current bid' : 'Starting bid'}</p>
            <p className="font-bold text-primary-700">{displayPrice}</p>
            {showOriginal && (
              <p className="text-[10px] text-earth-400 mt-0.5">
                {auction.currency} {parseFloat(rawPrice).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-earth-400 text-xs flex items-center gap-1 justify-end">
              <TrendingUp size={12} /> Bids
            </p>
            <p className="font-semibold text-earth-800">{auction.total_bids}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

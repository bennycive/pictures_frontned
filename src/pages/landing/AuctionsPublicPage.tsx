import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, TrendingUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { auctionsApi } from '../../api';
import type { Auction, Currency } from '../../api/types';
import { useCurrency } from '../../hooks/useCurrency';
import { useCurrencies } from '../../hooks/useCurrencies';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Spinner } from '../../components/ui/Spinner';

function convertPrice(amount: string, fromCode: string, toCode: string, currencies: Currency[]): string {
  const sym = currencies.find(c => c.code === toCode)?.symbol ?? toCode;
  if (!amount || fromCode === toCode) return `${sym} ${parseFloat(amount || '0').toLocaleString()}`;
  const fromRate = parseFloat(currencies.find(c => c.code === fromCode)?.rate ?? '1');
  const toRate   = parseFloat(currencies.find(c => c.code === toCode)?.rate   ?? '1');
  if (!fromRate || !toRate) return `${toCode} ${parseFloat(amount).toLocaleString()}`;
  const converted = (parseFloat(amount) / fromRate) * toRate;
  return `${sym} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type SortKey = 'ending' | 'bids' | 'price_asc' | 'price_desc';
type FilterKey = 'all' | 'live' | 'pending' | 'ended';

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(endTime: string) {
  const calc = () => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, over: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      over: false,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return t;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="bg-primary-600 text-white text-xs font-bold w-9 h-8 flex items-center justify-center rounded-md tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] text-earth-400 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Countdown({ endTime, status }: { endTime: string; status: string }) {
  const { d, h, m, s, over } = useCountdown(endTime);
  if (status !== 'live') return null;
  return (
    <div className="flex items-center gap-1.5 bg-primary-50 rounded-xl px-3 py-2.5">
      <Clock size={13} className="text-primary-500 shrink-0" />
      <div className="flex items-end gap-1">
        <CountdownUnit value={d} label="days" />
        <span className="text-primary-400 font-bold text-sm mb-1.5">:</span>
        <CountdownUnit value={h} label="hrs" />
        <span className="text-primary-400 font-bold text-sm mb-1.5">:</span>
        <CountdownUnit value={m} label="min" />
        <span className="text-primary-400 font-bold text-sm mb-1.5">:</span>
        <CountdownUnit value={s} label="sec" />
      </div>
      {over && <span className="text-xs text-red-500 ml-1">Ended</span>}
    </div>
  );
}

// ── Auction Card ──────────────────────────────────────────────────────────────
function AuctionCard({ auction, displayCurrency, currencies }: {
  auction: Auction; displayCurrency: string; currencies: Currency[];
}) {
  const rawPrice = auction.current_price || auction.start_price;
  const displayPrice = convertPrice(rawPrice, auction.currency, displayCurrency, currencies);
  const year = new Date(auction.created_at).getFullYear();
  const isLive = auction.status === 'live';
  const isTopBidded = auction.total_bids >= 5;

  return (
    <Link
      to={`/auctions/${auction.uuid}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-earth-100 hover:border-primary-200 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-earth-100">
        {auction.artwork_image ? (
          <img
            src={auction.artwork_image}
            alt={auction.artwork_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={40} className="text-earth-300" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE AUCTION
            </span>
          ) : auction.status === 'pending' ? (
            <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              UPCOMING
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-earth-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              ENDED
            </span>
          )}
        </div>

        {/* Featured / top-bidded badge */}
        {isTopBidded && (
          <div className="absolute top-3 right-3">
            <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              FEATURED
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name + year */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-script text-xl text-earth-900 leading-tight">{auction.artwork_name}</h3>
          <span className="shrink-0 text-xs font-semibold text-earth-400 bg-earth-50 px-2 py-1 rounded-md mt-0.5">{year}</span>
        </div>

        {/* Countdown */}
        {isLive && <Countdown endTime={auction.end_time} status={auction.status} />}

        {/* Price + bids */}
        <div className="flex items-center justify-between pt-2 border-t border-earth-100">
          <div>
            <p className="text-[10px] text-earth-400 uppercase tracking-wide font-medium">
              {auction.total_bids > 0 ? 'Current Bid' : 'Starting Bid'}
            </p>
            <p className="font-bold text-primary-700 text-lg leading-tight">{displayPrice}</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              <TrendingUp size={12} className="text-primary-400" />
              <span className="text-sm font-bold text-earth-800">{auction.total_bids}</span>
              <span className="text-xs text-earth-400">bid{auction.total_bids !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-earth-600">{auction.unique_bidders ?? 0}</span>
              <span className="text-xs text-earth-400">bidder{(auction.unique_bidders ?? 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function AuctionsPublicPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterKey>('live');
  const [sort, setSort]         = useState<SortKey>('ending');
  const { currency, setCurrency } = useCurrency();
  const { currencies } = useCurrencies();

  useEffect(() => {
    auctionsApi.list()
      .then(r => setAuctions(r.data as Auction[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Stats for hero
  const liveAuctions  = useMemo(() => auctions.filter(a => a.status === 'live'), [auctions]);
  const highestBid    = useMemo(() => {
    const prices = liveAuctions
      .filter(a => a.total_bids > 0 && a.current_price)
      .map(a => parseFloat(a.current_price));
    return prices.length ? Math.max(...prices) : null;
  }, [liveAuctions]);
  const totalBids     = useMemo(() => liveAuctions.reduce((s, a) => s + (a.total_bids || 0), 0), [liveAuctions]);

  // Filter + sort
  const visible = useMemo(() => {
    let list = filter === 'all' ? auctions : auctions.filter(a => a.status === filter);
    if (sort === 'ending') list = [...list].sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime());
    if (sort === 'bids')   list = [...list].sort((a, b) => b.total_bids - a.total_bids);
    if (sort === 'price_asc')  list = [...list].sort((a, b) => parseFloat(a.current_price || a.start_price) - parseFloat(b.current_price || b.start_price));
    if (sort === 'price_desc') list = [...list].sort((a, b) => parseFloat(b.current_price || b.start_price) - parseFloat(a.current_price || a.start_price));
    return list;
  }, [auctions, filter, sort]);

  const filterCounts: Record<FilterKey, number> = {
    all:     auctions.length,
    live:    liveAuctions.length,
    pending: auctions.filter(a => a.status === 'pending').length,
    ended:   auctions.filter(a => a.status === 'ended').length,
  };

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-earth-950 via-earth-900 to-primary-950 overflow-hidden">
        {/* Decorative blur orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-earth-700/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 text-primary-300 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6">
            <Activity size={13} className="animate-pulse" />
            Live Auctions
          </div>

          {/* Heading */}
          <h1 className="font-script text-5xl sm:text-7xl text-white mb-4 leading-tight">
            Art Auctions
          </h1>
          <p className="text-earth-300 text-base sm:text-lg max-w-xl mx-auto mb-12">
            Bid on unique African artworks and own a piece of cultural heritage
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: liveAuctions.length, label: 'Active Auctions' },
              { value: highestBid !== null ? `$${highestBid.toLocaleString()}` : '—', label: 'Top Live Bid' },
              { value: totalBids || '—', label: 'Live Bids' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-bold text-primary-400">{value}</p>
                <p className="text-[10px] text-earth-400 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'live', 'pending', 'ended'] as FilterKey[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white border border-earth-200 text-earth-600 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-1.5 text-xs ${filter === f ? 'opacity-75' : 'text-earth-400'}`}>
                  ({filterCounts[f]})
                </span>
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-earth-200 rounded-xl text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
              >
                <option value="ending">Ending Soon</option>
                <option value="bids">Most Bids</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
            </div>

            {/* Currency */}
            {currencies.length > 0 && (
              <div className="relative">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-earth-200 rounded-xl text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
                >
                  {currencies.map(c => (
                    <option key={c.uuid} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Count */}
        <p className="text-sm text-earth-500 mb-6">
          {loading ? 'Loading…' : `${visible.length} auction${visible.length !== 1 ? 's' : ''} found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-24"><Spinner size="lg" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-24">
            <Activity size={40} className="mx-auto text-earth-300 mb-3" />
            <p className="text-earth-400">No auctions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map(auction => (
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

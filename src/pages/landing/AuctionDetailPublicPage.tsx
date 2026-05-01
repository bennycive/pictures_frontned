import { useEffect, useState, useCallback, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Gavel, TrendingUp, Clock, LogIn, Image, Wifi, WifiOff, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { auctionsApi } from '../../api';
import type { Auction, Currency } from '../../api/types';
import { useCurrency } from '../../hooks/useCurrency';
import { useCurrencies } from '../../hooks/useCurrencies';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';

/* ── Currency conversion ─────────────────────────────────────────── */
function convertPrice(
  amount: string | null | undefined,
  fromCode: string,
  toCode: string,
  currencies: Currency[]
): { display: string; original: string | null } {
  const raw = parseFloat(amount || '0');
  const originalStr = `${fromCode} ${raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!amount || fromCode === toCode || currencies.length === 0) {
    return { display: originalStr, original: null };
  }

  const fromRate = parseFloat(currencies.find(c => c.code === fromCode)?.rate ?? '1');
  const toRate   = parseFloat(currencies.find(c => c.code === toCode)?.rate   ?? '1');
  const sym      = currencies.find(c => c.code === toCode)?.symbol ?? toCode;

  if (!fromRate || !toRate) return { display: originalStr, original: null };

  const converted = (raw / fromRate) * toRate;
  return {
    display: `${sym} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    original: originalStr,
  };
}

/* ── Types ───────────────────────────────────────────────────────── */
type AuctionBase = Pick<
  Auction,
  'uuid' | 'artwork_uuid' | 'artwork_name' | 'artwork_image' |
  'images' | 'primary_image' |
  'created_by_name' | 'start_time' | 'end_time' |
  'bid_increment' | 'start_price' | 'currency'
>;

type AuctionLive = Pick<
  Auction,
  'status' | 'current_price' | 'minimum_next_bid' |
  'total_bids' | 'top_bids' | 'winner_name'
>;

/* ── Image gallery — memoised ────────────────────────────────────── */
const AuctionGallery = memo(function AuctionGallery({ base }: { base: AuctionBase }) {
  // useState FIRST — before any computed values (React hooks rule)
  const [active, setActive] = useState(0);

  const allImages: string[] = [];
  if (base.primary_image) allImages.push(base.primary_image);
  (base.images ?? []).forEach(img => {
    if (img.image_url && img.image_url !== base.primary_image) allImages.push(img.image_url);
  });
  if (allImages.length === 0 && base.artwork_image) allImages.push(base.artwork_image);

  // Clamp active index if images change
  const safeActive = allImages.length > 0 ? Math.min(active, allImages.length - 1) : 0;

  const prev = () => setActive(i => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActive(i => (i + 1) % allImages.length);

  if (allImages.length === 0) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-earth-100 shadow-sm">
        <div className="w-full aspect-square bg-earth-50 flex items-center justify-center">
          <Image size={80} className="text-earth-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-earth-100 shadow-sm group">
        <img
          src={allImages[active]}
          alt={`${base.artwork_name} — image ${active + 1}`}
          className="w-full aspect-square object-cover"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-earth-100 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft size={18} className="text-earth-700" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white border border-earth-100 rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight size={18} className="text-earth-700" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === active ? 'border-primary-500' : 'border-earth-100 hover:border-earth-300'
              }`}
            >
              <img src={src} alt={`thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

/* ── Countdown ───────────────────────────────────────────────────── */
function Countdown({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-red-600">
        <Clock size={18} />
        <span className="text-sm font-medium">Ends in</span>
      </div>
      <span className="font-bold text-red-700 text-2xl font-mono tracking-widest">{timeLeft}</span>
    </div>
  );
}

/* ── Top bids — memoised, re-renders only when bids or currency changes */
const TopBids = memo(function TopBids({
  topBids,
  nativeCurrency,
  displayCurrency,
  currencies,
}: {
  topBids: Auction['top_bids'];
  nativeCurrency: string;
  displayCurrency: string;
  currencies: Currency[];
}) {
  const bids = topBids;

  if (bids.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-earth-100 p-6">
      <h3 className="font-semibold text-earth-900 mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-primary-600" /> Top Bids
      </h3>
      <div className="space-y-2">
        {bids.map((bid, i) => {
          const { display, original } = convertPrice(bid.amount, nativeCurrency, displayCurrency, currencies);
          return (
            <div
              key={i}
              className={`flex items-center justify-between p-3 rounded-xl ${bid.is_winning ? 'bg-green-50 border border-green-100' : 'bg-earth-50'}`}
            >
              <div className="flex items-center gap-2">
                {bid.is_winning && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 animate-pulse" />}
                <span className="text-sm font-medium text-earth-800">{bid.bidder_name}</span>
                {bid.is_winning && <span className="text-xs text-green-600 font-medium">Winning</span>}
              </div>
              <div className="text-right">
                <span className={`font-bold text-sm ${bid.is_winning ? 'text-green-700' : 'text-earth-700'}`}>
                  {display}
                </span>
                {original && (
                  <p className="text-[10px] text-earth-400">{original}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ── Price card ──────────────────────────────────────────────────── */
function PriceCard({
  label,
  amount,
  nativeCurrency,
  displayCurrency,
  currencies,
  flash = false,
  flashClass = '',
  baseClass = '',
  textClass = '',
}: {
  label: string;
  amount: string | null | undefined;
  nativeCurrency: string;
  displayCurrency: string;
  currencies: Currency[];
  flash?: boolean;
  flashClass?: string;
  baseClass?: string;
  textClass?: string;
}) {
  const { display, original } = convertPrice(amount, nativeCurrency, displayCurrency, currencies);
  return (
    <div className={`rounded-xl p-4 transition-colors duration-700 ${flash ? flashClass : baseClass}`}>
      <p className="text-xs mb-1 opacity-60">{label}</p>
      <p className={`text-xl font-bold transition-colors duration-700 ${flash ? '' : textClass}`}>
        {display}
      </p>
      {original && <p className="text-[10px] opacity-50 mt-0.5">{original}</p>}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export function AuctionDetailPublicPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();
  const { openAuthModal } = useAuthModal();
  const { currency, setCurrency } = useCurrency();
  const { currencies } = useCurrencies();

  const [base, setBase] = useState<AuctionBase | null>(null);
  const [live, setLive] = useState<AuctionLive | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [flash, setFlash] = useState(false);

  const canBid = hasPermission('accounts.place_bids');

  const load = useCallback(async () => {
    if (!uuid) return;
    try {
      const { data } = await auctionsApi.get(uuid);
      setBase({
        uuid: data.uuid,
        artwork_uuid: data.artwork_uuid,
        artwork_name: data.artwork_name,
        artwork_image: data.artwork_image,
        images: data.images ?? [],
        primary_image: data.primary_image ?? null,
        created_by_name: data.created_by_name,
        start_time: data.start_time,
        end_time: data.end_time,
        bid_increment: data.bid_increment,
        start_price: data.start_price,
        currency: data.currency,
      });
      setLive({
        status: data.status,
        current_price: data.current_price,
        minimum_next_bid: data.minimum_next_bid,
        total_bids: data.total_bids,
        top_bids: data.top_bids,
        winner_name: data.winner_name,
      });
      setBidAmount(data.minimum_next_bid);
    } catch {
      error('Failed to load auction');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  const handleSocketUpdate = useCallback((patch: Partial<Auction>) => {
    setConnected(true);
    setLive(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (patch.minimum_next_bid) setBidAmount(patch.minimum_next_bid);
      return next;
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  }, []);

  useAuctionSocket(uuid, {
    onUpdate: handleSocketUpdate,
    onError: useCallback((msg: string) => error(msg), []),
  });

  const handleBidClick = () => {
    if (!user) {
      openAuthModal({ hint: 'Sign in to place your bid', onSuccess: () => setBidModalOpen(true) });
      return;
    }
    setBidModalOpen(true);
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid || !live) return;
    setBidding(true);
    try {
      await auctionsApi.bid(uuid, bidAmount);
      success('Bid placed!');
      setBidModalOpen(false);
      const { data } = await auctionsApi.get(uuid);
      setLive({
        status: data.status,
        current_price: data.current_price,
        minimum_next_bid: data.minimum_next_bid,
        total_bids: data.total_bids,
        top_bids: data.top_bids,
        winner_name: data.winner_name,
      });
      setBidAmount(data.minimum_next_bid);
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to place bid. Check your wallet balance.');
    } finally {
      setBidding(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-earth-50"><Navbar /><PageSpinner /></div>;
  if (!base || !live) return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-earth-400">
        Auction not found.<br />
        <Link to="/auctions" className="text-primary-600 mt-4 inline-block">← Back to auctions</Link>
      </div>
    </div>
  );

  const minBidConverted = convertPrice(live.minimum_next_bid, base.currency, currency, currencies);

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link to="/auctions" className="inline-flex items-center gap-2 text-earth-500 hover:text-earth-700 text-sm transition-colors">
            <ArrowLeft size={16} /> Back to Auctions
          </Link>

          <div className="flex items-center gap-3">
            {/* Currency selector */}
            {currencies.length > 0 && (
              <div className="relative">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-white border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
                >
                  {currencies.map(c => (
                    <option key={c.uuid} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
              </div>
            )}

            {live.status === 'live' && (
              <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                connected ? 'text-green-700 bg-green-50 border-green-200' : 'text-earth-500 bg-earth-100 border-earth-200'
              }`}>
                {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
                {connected ? 'Live' : 'Connecting...'}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Image gallery */}
          <AuctionGallery base={base} />

          {/* Live panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-earth-100 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-display font-bold text-earth-900">{base.artwork_name}</h1>
                <StatusBadge status={live.status} />
              </div>
              <p className="text-sm text-earth-500">
                Listed by <span className="font-medium text-earth-700">{base.created_by_name}</span>
              </p>

              {live.status === 'live' && <Countdown endTime={base.end_time} />}

              {/* Price cards */}
              <div className="grid grid-cols-2 gap-3">
                <PriceCard
                  label="Current Bid"
                  amount={live.current_price || base.start_price}
                  nativeCurrency={base.currency}
                  displayCurrency={currency}
                  currencies={currencies}
                  flash={flash}
                  flashClass="bg-green-100 border border-green-300 text-green-700"
                  baseClass="bg-primary-50"
                  textClass="text-primary-700"
                />
                <PriceCard
                  label="Minimum Next Bid"
                  amount={live.minimum_next_bid}
                  nativeCurrency={base.currency}
                  displayCurrency={currency}
                  currencies={currencies}
                  baseClass="bg-earth-50"
                  textClass="text-earth-800"
                />
                <div className="bg-earth-50 rounded-xl p-4">
                  <p className="text-xs text-earth-400 mb-1">Total Bids</p>
                  <p className="text-lg font-bold text-earth-800 flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-earth-400" /> {live.total_bids}
                  </p>
                </div>
                <PriceCard
                  label="Bid Increment"
                  amount={base.bid_increment}
                  nativeCurrency={base.currency}
                  displayCurrency={currency}
                  currencies={currencies}
                  baseClass="bg-earth-50"
                  textClass="text-earth-800"
                />
              </div>

              {live.status === 'ended' && live.winner_name && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-sm text-green-700">
                    <span className="font-semibold">Winner:</span> {live.winner_name}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                {live.status === 'live' ? (
                  !user ? (
                    <div className="space-y-2">
                      <button onClick={handleBidClick} className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base">
                        <LogIn size={18} /> Sign In to Bid
                      </button>
                      <button
                        onClick={() => openAuthModal({ defaultTab: 'register', hint: 'Create a free account to start bidding', onSuccess: () => setBidModalOpen(true) })}
                        className="w-full btn-secondary py-2.5 text-sm"
                      >
                        New here? Create a free account
                      </button>
                    </div>
                  ) : canBid ? (
                    <button onClick={handleBidClick} className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base">
                      <Gavel size={20} /> Place a Bid
                    </button>
                  ) : (
                    <p className="text-sm text-earth-400 text-center bg-earth-50 rounded-xl p-4">
                      You don't have permission to bid.
                    </p>
                  )
                ) : live.status === 'pending' ? (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                    <p className="text-yellow-700 font-medium text-sm">Auction hasn't started yet</p>
                    <p className="text-yellow-600 text-xs mt-1">Starts {new Date(base.start_time).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="bg-earth-50 border border-earth-100 rounded-xl p-4 text-center">
                    <p className="text-earth-600 font-medium text-sm">This auction has ended</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top bids */}
            <TopBids
              topBids={live.top_bids}
              nativeCurrency={base.currency}
              displayCurrency={currency}
              currencies={currencies}
            />
          </div>
        </div>
      </div>

      {/* Bid modal — bidding is always in the auction's native currency */}
      <Modal open={bidModalOpen} onClose={() => setBidModalOpen(false)} title="Place a Bid" size="sm">
        <form onSubmit={handleBid} className="space-y-4">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-700">
            <p>Minimum bid: <strong>{base.currency} {live.minimum_next_bid}</strong></p>
            {minBidConverted.original && (
              <p className="text-xs text-primary-500 mt-0.5">≈ {minBidConverted.display}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Your Bid ({base.currency})
            </label>
            <input
              type="number"
              step="0.01"
              className="input text-xl font-bold"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              min={live.minimum_next_bid}
              required
            />
            <p className="text-xs text-earth-400 mt-1">
              Enter {base.currency} {live.minimum_next_bid} or more
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setBidModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={bidding} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Gavel size={16} /> {bidding ? 'Placing...' : 'Place Bid'}
            </button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}

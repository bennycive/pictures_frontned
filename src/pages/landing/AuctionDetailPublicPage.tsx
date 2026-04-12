import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Gavel, TrendingUp, Clock, LogIn, Image, Wifi, WifiOff } from 'lucide-react';
import { auctionsApi } from '../../api';
import type { Auction } from '../../api/types';
import { Navbar } from '../../components/layout/Navbar';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';

export function AuctionDetailPublicPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();
  const { openAuthModal } = useAuthModal();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [connected, setConnected] = useState(false);
  const [lastBidFlash, setLastBidFlash] = useState(false);

  const canBid = hasPermission('accounts.place_bids');

  const load = useCallback(async () => {
    if (!uuid) return;
    try {
      const { data } = await auctionsApi.get(uuid);
      setAuction(data);
      setBidAmount(data.minimum_next_bid);
    } catch {
      error('Failed to load auction');
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => { load(); }, [load]);

  // Countdown timer
  useEffect(() => {
    if (!auction || auction.status !== 'live') return;
    const update = () => {
      const end = new Date(auction.end_time).getTime();
      const diff = end - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [auction?.end_time, auction?.status]);

  // WebSocket live updates
  const handleSocketUpdate = useCallback((patch: Partial<Auction>) => {
    setConnected(true);
    setAuction(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      // Keep bid input in sync with minimum_next_bid
      if (patch.minimum_next_bid) setBidAmount(patch.minimum_next_bid);
      return updated;
    });
    // Flash the price card to signal a new bid arrived
    setLastBidFlash(true);
    setTimeout(() => setLastBidFlash(false), 1200);
  }, []);

  const handleSocketError = useCallback((msg: string) => {
    error(msg);
  }, []);

  useAuctionSocket(uuid, {
    onUpdate: handleSocketUpdate,
    onError: handleSocketError,
  });

  // Detect WS connection by checking if we ever got an update; fall back gracefully
  useEffect(() => {
    const t = setTimeout(() => setConnected(c => c), 4000);
    return () => clearTimeout(t);
  }, []);

  const handleBidClick = () => {
    if (!user) {
      openAuthModal({
        hint: 'Sign in to place your bid on this artwork',
        onSuccess: () => setBidModalOpen(true),
      });
      return;
    }
    setBidModalOpen(true);
  };

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) return;
    setBidding(true);
    try {
      await auctionsApi.bid(uuid, bidAmount);
      success('Bid placed successfully!');
      setBidModalOpen(false);
      // REST response will also update state via load(); WS will push to other clients
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to place bid. Check your wallet balance.');
    } finally {
      setBidding(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-earth-50"><Navbar /><PageSpinner /></div>
  );

  if (!auction) return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-earth-400">
        Auction not found.<br />
        <Link to="/auctions" className="text-primary-600 mt-4 inline-block">← Back to auctions</Link>
      </div>
    </div>
  );

  const topBids = (() => {
    try { return JSON.parse(auction.top_bids) as Array<{ bidder_name: string; amount: string; is_winning: boolean }>; }
    catch { return []; }
  })();

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link to="/auctions" className="inline-flex items-center gap-2 text-earth-500 hover:text-earth-700 text-sm transition-colors">
            <ArrowLeft size={16} /> Back to Auctions
          </Link>
          {/* Live indicator */}
          {auction.status === 'live' && (
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${connected ? 'text-green-700 bg-green-50 border-green-200' : 'text-earth-500 bg-earth-100 border-earth-200'}`}>
              {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {connected ? 'Live' : 'Connecting...'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Artwork image */}
          <div className="bg-white rounded-2xl overflow-hidden border border-earth-100 shadow-sm">
            {auction.artwork_image ? (
              <img src={auction.artwork_image} alt={auction.artwork_name} className="w-full aspect-square object-cover" />
            ) : (
              <div className="w-full aspect-square bg-earth-50 flex items-center justify-center">
                <Image size={80} className="text-earth-200" />
              </div>
            )}
          </div>

          {/* Auction info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-earth-100 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-display font-bold text-earth-900">{auction.artwork_name}</h1>
                <StatusBadge status={auction.status} />
              </div>
              <p className="text-sm text-earth-500">Listed by <span className="font-medium text-earth-700">{auction.created_by_name}</span></p>

              {/* Countdown */}
              {auction.status === 'live' && timeLeft && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Ends in</span>
                  </div>
                  <span className="font-bold text-red-700 text-2xl font-mono tracking-widest">{timeLeft}</span>
                </div>
              )}

              {/* Price cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 transition-colors duration-700 ${lastBidFlash ? 'bg-green-100 border border-green-300' : 'bg-primary-50'}`}>
                  <p className="text-xs text-primary-500 mb-1">Current Bid</p>
                  <p className={`text-2xl font-bold transition-colors duration-700 ${lastBidFlash ? 'text-green-700' : 'text-primary-700'}`}>
                    {auction.currency} {auction.current_price || auction.start_price}
                  </p>
                </div>
                <div className="bg-earth-50 rounded-xl p-4">
                  <p className="text-xs text-earth-400 mb-1">Minimum Next Bid</p>
                  <p className="text-2xl font-bold text-earth-800">{auction.currency} {auction.minimum_next_bid}</p>
                </div>
                <div className="bg-earth-50 rounded-xl p-4">
                  <p className="text-xs text-earth-400 mb-1">Total Bids</p>
                  <p className="text-lg font-bold text-earth-800 flex items-center gap-1.5">
                    <TrendingUp size={16} className="text-earth-400" /> {auction.total_bids}
                  </p>
                </div>
                <div className="bg-earth-50 rounded-xl p-4">
                  <p className="text-xs text-earth-400 mb-1">Bid Increment</p>
                  <p className="text-lg font-bold text-earth-800">{auction.currency} {auction.bid_increment}</p>
                </div>
              </div>

              {auction.winner_name && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-sm text-green-700"><span className="font-semibold">Winner:</span> {auction.winner_name}</p>
                </div>
              )}

              {/* Bid action */}
              <div className="pt-2">
                {auction.status === 'live' ? (
                  !user ? (
                    <div className="space-y-2">
                      <button
                        onClick={handleBidClick}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base"
                      >
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
                    <button onClick={handleBidClick}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base">
                      <Gavel size={20} /> Place a Bid
                    </button>
                  ) : (
                    <p className="text-sm text-earth-400 text-center bg-earth-50 rounded-xl p-4">
                      You don't have permission to bid.
                    </p>
                  )
                ) : auction.status === 'pending' ? (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                    <p className="text-yellow-700 font-medium text-sm">Auction hasn't started yet</p>
                    <p className="text-yellow-600 text-xs mt-1">Starts {new Date(auction.start_time).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="bg-earth-50 border border-earth-100 rounded-xl p-4 text-center">
                    <p className="text-earth-600 font-medium text-sm">This auction has ended</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top bids — live-updated via WS */}
            {topBids.length > 0 && (
              <div className="bg-white rounded-2xl border border-earth-100 p-6">
                <h3 className="font-semibold text-earth-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-600" /> Top Bids
                </h3>
                <div className="space-y-2">
                  {topBids.map((bid, i) => (
                    <div key={i}
                      className={`flex items-center justify-between p-3 rounded-xl ${bid.is_winning ? 'bg-green-50 border border-green-100' : 'bg-earth-50'}`}>
                      <div className="flex items-center gap-2">
                        {bid.is_winning && <span className="w-2 h-2 bg-green-500 rounded-full shrink-0 animate-pulse" />}
                        <span className="text-sm font-medium text-earth-800">{bid.bidder_name}</span>
                        {bid.is_winning && <span className="text-xs text-green-600 font-medium">Winning</span>}
                      </div>
                      <span className={`font-bold text-sm ${bid.is_winning ? 'text-green-700' : 'text-earth-700'}`}>
                        {auction.currency} {bid.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bid modal — pre-filled with live minimum_next_bid */}
      <Modal open={bidModalOpen} onClose={() => setBidModalOpen(false)} title="Place a Bid" size="sm">
        <form onSubmit={handleBid} className="space-y-4">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-700">
            Minimum bid: <strong>{auction.currency} {auction.minimum_next_bid}</strong>
          </div>
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Your Bid ({auction.currency})
            </label>
            <input
              type="number"
              step="0.01"
              className="input text-xl font-bold"
              value={bidAmount}
              onChange={e => setBidAmount(e.target.value)}
              min={auction.minimum_next_bid}
              required
            />
            <p className="text-xs text-earth-400 mt-1">
              Enter {auction.currency} {auction.minimum_next_bid} or more
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
    </div>
  );
}

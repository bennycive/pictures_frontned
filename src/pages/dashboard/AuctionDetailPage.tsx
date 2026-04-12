import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Gavel, TrendingUp, Clock, Play, Square, Image, Wifi, WifiOff } from 'lucide-react';
import { auctionsApi } from '../../api';
import type { Auction } from '../../api/types';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useAuctionSocket } from '../../hooks/useAuctionSocket';

export function AuctionDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [connected, setConnected] = useState(false);
  const [lastBidFlash, setLastBidFlash] = useState(false);

  const canBid = hasPermission('accounts.place_bids');
  const canManage = hasPermission('auctions.change_auction');

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

  // Countdown
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
      if (patch.minimum_next_bid) setBidAmount(patch.minimum_next_bid);
      return { ...prev, ...patch };
    });
    setLastBidFlash(true);
    setTimeout(() => setLastBidFlash(false), 1200);
  }, []);

  useAuctionSocket(uuid, {
    onUpdate: handleSocketUpdate,
    onError: (msg) => error(msg),
  });

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid) return;
    setBidding(true);
    try {
      await auctionsApi.bid(uuid, bidAmount);
      success('Bid placed successfully!');
      setBidModalOpen(false);
      load(); // refresh own view; WS pushes to others
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to place bid. Check your wallet balance.');
    } finally {
      setBidding(false);
    }
  };

  const handleStart = async () => {
    if (!uuid) return;
    try { await auctionsApi.start(uuid); success('Auction started!'); load(); }
    catch { error('Failed to start auction'); }
  };

  const handleEnd = async () => {
    if (!uuid) return;
    try { await auctionsApi.end(uuid); success('Auction ended!'); load(); }
    catch { error('Failed to end auction'); }
  };

  if (loading) return <PageSpinner />;
  if (!auction) return <div className="text-center py-20 text-earth-400">Auction not found.</div>;

  const topBids = (() => {
    try { return JSON.parse(auction.top_bids) as Array<{ bidder_name: string; amount: string; is_winning: boolean }>; }
    catch { return []; }
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/auctions" className="inline-flex items-center gap-2 text-earth-500 hover:text-earth-700 text-sm">
          <ArrowLeft size={16} /> Back to Auctions
        </Link>
        {auction.status === 'live' && (
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${connected ? 'text-green-700 bg-green-50 border-green-200' : 'text-earth-500 bg-earth-100 border-earth-200'}`}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'Live' : 'Connecting...'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Artwork image */}
        <div className="bg-white rounded-xl border border-earth-100 overflow-hidden">
          {auction.artwork_image ? (
            <img src={auction.artwork_image} alt={auction.artwork_name} className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-earth-100 flex items-center justify-center">
              <Image size={60} className="text-earth-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-earth-100 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <h1 className="text-xl font-bold text-earth-900">{auction.artwork_name}</h1>
              <StatusBadge status={auction.status} />
            </div>
            <p className="text-sm text-earth-500">By {auction.created_by_name}</p>

            {auction.status === 'live' && timeLeft && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <Clock size={18} />
                  <span className="text-sm font-medium">Time remaining</span>
                </div>
                <span className="font-bold text-red-700 text-xl font-mono tracking-widest">{timeLeft}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 transition-colors duration-700 ${lastBidFlash ? 'bg-green-100 border border-green-300' : 'bg-earth-50'}`}>
                <p className="text-xs text-earth-400 mb-1">Current Bid</p>
                <p className={`text-xl font-bold transition-colors duration-700 ${lastBidFlash ? 'text-green-700' : 'text-primary-700'}`}>
                  {auction.currency} {auction.current_price || auction.start_price}
                </p>
              </div>
              <div className="bg-earth-50 rounded-xl p-4">
                <p className="text-xs text-earth-400 mb-1">Min. Next Bid</p>
                <p className="text-xl font-bold text-earth-800">{auction.currency} {auction.minimum_next_bid}</p>
              </div>
              <div className="bg-earth-50 rounded-xl p-4">
                <p className="text-xs text-earth-400 mb-1">Total Bids</p>
                <p className="text-lg font-bold text-earth-800 flex items-center gap-1">
                  <TrendingUp size={16} /> {auction.total_bids}
                </p>
              </div>
              <div className="bg-earth-50 rounded-xl p-4">
                <p className="text-xs text-earth-400 mb-1">Increment</p>
                <p className="text-lg font-bold text-earth-800">{auction.currency} {auction.bid_increment}</p>
              </div>
            </div>

            {auction.winner_name && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-sm text-green-700"><span className="font-semibold">Winner:</span> {auction.winner_name}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {canBid && auction.status === 'live' && user && (
                <button onClick={() => setBidModalOpen(true)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Gavel size={18} /> Place Bid
                </button>
              )}
              {canManage && auction.status === 'pending' && (
                <button onClick={handleStart}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                  <Play size={16} /> Start Auction
                </button>
              )}
              {canManage && auction.status === 'live' && (
                <button onClick={handleEnd} className="btn-danger flex-1 flex items-center justify-center gap-2">
                  <Square size={16} /> End Auction
                </button>
              )}
            </div>
          </div>

          {/* Top bids */}
          {topBids.length > 0 && (
            <div className="bg-white rounded-xl border border-earth-100 p-6">
              <h3 className="font-semibold text-earth-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-600" /> Top Bids
              </h3>
              <div className="space-y-2">
                {topBids.map((bid, i) => (
                  <div key={i}
                    className={`flex items-center justify-between p-3 rounded-lg ${bid.is_winning ? 'bg-green-50 border border-green-100' : 'bg-earth-50'}`}>
                    <div className="flex items-center gap-2">
                      {bid.is_winning && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
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

      {/* Bid modal */}
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
            <p className="text-xs text-earth-400 mt-1">Enter {auction.currency} {auction.minimum_next_bid} or more</p>
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

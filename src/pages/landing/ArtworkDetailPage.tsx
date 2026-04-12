import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Image, Tag, Ruler, DollarSign, LogIn, Gavel, ChevronDown } from 'lucide-react';
import { artworksApi, cartApi, auctionsApi } from '../../api';
import type { Artwork, Auction } from '../../api/types';
import { useCurrencies } from '../../hooks/useCurrencies';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Badge, StatusBadge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { PageSpinner } from '../../components/ui/Spinner';

export function ArtworkDetailPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { success, error } = useToast();

  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [currency, setCurrency] = useState('USD');
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    Promise.all([artworksApi.get(uuid, currency), auctionsApi.list()])
      .then(([a, au]) => {
        setArtwork(a.data);
        setAuctions((au.data as Auction[]).filter(x => x.artwork_uuid === uuid));
      })
      .catch(() => error('Failed to load artwork'))
      .finally(() => setLoading(false));
  }, [uuid, currency]);

  const doAddToCart = async () => {
    if (!uuid) return;
    setAddingToCart(true);
    try {
      await cartApi.addItem(uuid);
      success('Added to cart!');
      setAddedToCart(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      error(msg || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      openAuthModal({
        hint: 'Sign in to add this artwork to your cart',
        onSuccess: doAddToCart,   // fires immediately after login/verify
      });
      return;
    }
    doAddToCart();
  };

  if (loading) return (
    <div className="min-h-screen bg-earth-50"><Navbar /><PageSpinner /></div>
  );

  if (!artwork) return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-earth-400">
        Artwork not found.<br />
        <Link to="/artworks" className="text-primary-600 mt-4 inline-block">← Back to artworks</Link>
      </div>
    </div>
  );

  const liveAuction = auctions.find(a => a.status === 'live');
  const anyAuction = auctions[0];

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/artworks" className="inline-flex items-center gap-2 text-earth-500 hover:text-earth-700 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Artworks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white rounded-2xl overflow-hidden border border-earth-100 shadow-sm">
            {artwork.image_url
              ? <img src={artwork.image_url} alt={artwork.name} className="w-full aspect-square object-cover" />
              : <div className="w-full aspect-square flex items-center justify-center bg-earth-50"><Image size={80} className="text-earth-200" /></div>
            }
          </div>

          {/* Details */}
          <div className="space-y-5">
            {/* Category + sold */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/artworks?category=${artwork.category?.uuid}`}
                className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                <Tag size={14} />{artwork.category?.name}
              </Link>
              {artwork.is_sold && <Badge label="Sold" color="red" />}
            </div>

            <h1 className="text-3xl font-display font-bold text-earth-900">{artwork.name}</h1>

            <div className="flex items-center gap-2 text-earth-500">
              <Ruler size={16} />
              <span className="text-sm">{artwork.dimensions}</span>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl border border-earth-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-earth-500 text-sm font-medium">
                  <DollarSign size={15} /> Pricing
                </div>
                {/* Currency selector */}
                {currencies.length > 0 && (
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="appearance-none pl-3 pr-7 py-1 text-sm bg-earth-50 border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
                    >
                      {currencies.map(c => (
                        <option key={c.uuid} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                  </div>
                )}
              </div>
              {artwork.pricing ? (
                <>
                  <p className="text-3xl font-bold text-primary-700 mb-1">
                    {artwork.pricing.formatted}
                  </p>
                  <p className="text-xs text-earth-400">
                    Base price: ${artwork.pricing.base_usd} USD
                  </p>
                </>
              ) : (
                <p className="text-earth-400 text-sm">Price unavailable</p>
              )}
            </div>

            {/* Live auction banner */}
            {liveAuction && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Auction Running
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    Current bid: {liveAuction.currency} {liveAuction.current_price || liveAuction.start_price}
                  </p>
                </div>
                <Link to={`/auctions/${liveAuction.uuid}`}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                  <Gavel size={15} /> Bid Now
                </Link>
              </div>
            )}

            {/* Past auction */}
            {!liveAuction && anyAuction && (
              <div className="bg-earth-50 border border-earth-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-earth-600 font-medium flex items-center gap-1.5">
                    <Gavel size={14} /> Auction <StatusBadge status={anyAuction.status} />
                  </p>
                  <p className="text-xs text-earth-400 mt-0.5">{anyAuction.total_bids} bids placed</p>
                </div>
                <Link to={`/auctions/${anyAuction.uuid}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View Auction →
                </Link>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {!artwork.is_sold ? (
                <>
                  {/* Add to cart — always visible, triggers modal for guests */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base"
                  >
                    {user ? (
                      <><ShoppingCart size={20} />{addingToCart ? 'Adding…' : addedToCart ? 'Added to Cart ✓' : 'Add to Cart'}</>
                    ) : (
                      <><LogIn size={20} /> Sign In to Buy</>
                    )}
                  </button>

                  {/* View cart shortcut once added */}
                  {user && addedToCart && (
                    <Link to="/dashboard/cart"
                      className="w-full btn-secondary py-3 flex items-center justify-center gap-2 text-base">
                      View Cart & Checkout →
                    </Link>
                  )}

                  {/* Register nudge for guests */}
                  {!user && (
                    <button
                      onClick={() => openAuthModal({ defaultTab: 'register', hint: 'Create a free account to start collecting African art', onSuccess: doAddToCart })}
                      className="w-full btn-secondary py-2.5 text-sm"
                    >
                      New here? Create a free account
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-red-700 font-semibold">This artwork has been sold</p>
                  <Link to="/artworks" className="text-sm text-red-500 hover:text-red-600 mt-1 inline-block">
                    Browse other artworks →
                  </Link>
                </div>
              )}
            </div>

            <p className="text-xs text-earth-400 pt-2 border-t border-earth-100">
              Listed on {new Date(artwork.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Link to={`/artworks?category=${artwork.category?.uuid}`}
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
            Browse more {artwork.category?.name} artworks →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Image, LogIn, Gavel, Heart, Share2 } from 'lucide-react';
import { artworksApi, cartApi, auctionsApi } from '../../api';
import type { Artwork, Auction } from '../../api/types';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useCurrency } from '../../hooks/useCurrency';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { StatusBadge } from '../../components/ui/Badge';
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
  const { currency, setCurrency } = useCurrency();
  const { currencies } = useCurrencies();
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [saved, setSaved] = useState(false);

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
      openAuthModal({ hint: 'Sign in to add this artwork to your cart', onSuccess: doAddToCart });
      return;
    }
    doAddToCart();
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: artwork?.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      success('Link copied!');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950"><Navbar /><PageSpinner /></div>
  );

  if (!artwork) return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-earth-400">
        Artwork not found.
        <br />
        <Link to="/artworks" className="text-primary-500 mt-4 inline-block hover:text-primary-400">
          ← Back to Gallery
        </Link>
      </div>
    </div>
  );

  const liveAuction = auctions.find(a => a.status === 'live');
  const anyAuction = auctions[0];
  const year = artwork.created_at ? new Date(artwork.created_at).getFullYear() : null;

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 text-xs text-earth-400">
          <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/artworks" className="hover:text-primary-500 transition-colors">Gallery</Link>
          <span>/</span>
          <span className="text-earth-600 dark:text-earth-300 truncate max-w-[200px]">{artwork.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── Left: Image ─────────────────────────────────────── */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden bg-earth-100 dark:bg-earth-800 shadow-lg aspect-[4/5]">
              {artwork.image_url ? (
                <img
                  src={artwork.image_url}
                  alt={artwork.name}
                  className={`w-full h-full object-cover ${artwork.is_sold ? 'brightness-75' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={80} className="text-earth-300" />
                </div>
              )}
              {artwork.is_sold && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-red-400 rounded-xl px-6 py-2 rotate-[-18deg] bg-black/10">
                    <span className="text-red-400 font-bold text-3xl tracking-widest uppercase">Sold</span>
                  </div>
                </div>
              )}
            </div>

            {/* Back link below image on mobile */}
            <Link
              to="/artworks"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-earth-400 hover:text-earth-600 dark:hover:text-earth-300 transition-colors lg:hidden"
            >
              <ArrowLeft size={14} /> Back to Gallery
            </Link>
          </div>

          {/* ── Right: Details ───────────────────────────────────── */}
          <div className="space-y-6">
            {/* Back link on desktop */}
            <Link
              to="/artworks"
              className="hidden lg:inline-flex items-center gap-1.5 text-sm text-earth-400 hover:text-earth-600 dark:hover:text-earth-300 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Gallery
            </Link>

            {/* Category label */}
            <p className="text-xs font-semibold text-earth-400 uppercase tracking-[0.2em]">
              {artwork.category?.name}
            </p>

            {/* Title + Year */}
            <div>
              <h1 className="font-script text-5xl sm:text-6xl text-earth-900 dark:text-earth-100 leading-tight">
                {artwork.name}
              </h1>
              {year && <p className="text-earth-400 text-sm mt-1">{year}</p>}
            </div>

            {/* Medium + Dimensions info boxes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-earth-800 border border-earth-100 dark:border-earth-700 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-earth-400 uppercase tracking-widest mb-1">Medium</p>
                <p className="text-sm font-medium text-earth-800 dark:text-earth-200">{artwork.category?.name}</p>
              </div>
              <div className="bg-white dark:bg-earth-800 border border-earth-100 dark:border-earth-700 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-earth-400 uppercase tracking-widest mb-1">Dimensions</p>
                <p className="text-sm font-medium text-earth-800 dark:text-earth-200">{artwork.dimensions || '—'}</p>
              </div>
            </div>

            {/* Currency pill tabs */}
            {currencies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currencies.map(c => (
                  <button
                    key={c.uuid}
                    onClick={() => setCurrency(c.code)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-150 ${
                      currency === c.code
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-white dark:bg-earth-800 border-earth-200 dark:border-earth-700 text-earth-600 dark:text-earth-400 hover:border-primary-400 hover:text-primary-500'
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            )}

            {/* Price */}
            <div>
              {artwork.pricing ? (
                <p className="font-script text-5xl sm:text-6xl text-earth-900 dark:text-earth-100">
                  {artwork.pricing.formatted}
                </p>
              ) : (
                <p className="text-earth-400 text-sm">Price unavailable</p>
              )}
            </div>

            {/* Live auction banner */}
            {liveAuction && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Auction Running
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                    Current bid: {liveAuction.currency} {liveAuction.current_price || liveAuction.start_price}
                  </p>
                </div>
                <Link
                  to={`/auctions/${liveAuction.uuid}`}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <Gavel size={14} /> Bid Now
                </Link>
              </div>
            )}

            {/* Past auction */}
            {!liveAuction && anyAuction && (
              <div className="bg-earth-100 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-earth-600 dark:text-earth-300 font-medium flex items-center gap-1.5">
                    <Gavel size={14} /> Auction &nbsp;<StatusBadge status={anyAuction.status} />
                  </p>
                  <p className="text-xs text-earth-400 mt-0.5">{anyAuction.total_bids} bids placed</p>
                </div>
                <Link to={`/auctions/${anyAuction.uuid}`} className="text-sm text-primary-500 hover:text-primary-400 font-medium">
                  View →
                </Link>
              </div>
            )}

            {/* Action buttons */}
            {!artwork.is_sold ? (
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-white font-semibold py-3 px-5 rounded-full transition-all duration-200 shadow hover:shadow-lg text-sm"
                >
                  {user ? (
                    <>
                      <ShoppingCart size={16} />
                      {addingToCart ? 'Adding…' : addedToCart ? 'Added ✓' : 'Add to Cart'}
                    </>
                  ) : (
                    <><LogIn size={16} /> Sign In to Buy</>
                  )}
                </button>

                <button
                  onClick={() => setSaved(s => !s)}
                  className={`flex items-center gap-1.5 px-4 py-3 rounded-full border text-sm font-medium transition-all duration-200 ${
                    saved
                      ? 'bg-red-50 border-red-200 text-red-500 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-white dark:bg-earth-800 border-earth-200 dark:border-earth-700 text-earth-600 dark:text-earth-400 hover:border-primary-400 hover:text-primary-500'
                  }`}
                >
                  <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
                  Save
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-full border border-earth-200 dark:border-earth-700 bg-white dark:bg-earth-800 text-earth-600 dark:text-earth-400 hover:border-primary-400 hover:text-primary-500 text-sm font-medium transition-all duration-200"
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>
            ) : (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-4 text-center">
                <p className="text-red-700 dark:text-red-400 font-semibold">This artwork has been sold</p>
                <Link to="/artworks" className="text-sm text-red-500 hover:text-red-400 mt-1 inline-block">
                  Browse other artworks →
                </Link>
              </div>
            )}

            {/* View cart shortcut */}
            {user && addedToCart && (
              <Link
                to="/dashboard/cart"
                className="block text-center text-sm text-primary-500 hover:text-primary-400 font-medium transition-colors"
              >
                View Cart & Checkout →
              </Link>
            )}

            {/* Listed date */}
            <p className="text-xs text-earth-400 pt-2 border-t border-earth-100 dark:border-earth-800">
              Listed on {new Date(artwork.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* ── About the Artwork ────────────────────────────────── */}
        <div className="mt-14 max-w-2xl">
          <h2 className="font-script text-3xl text-earth-900 dark:text-earth-100 mb-4">About the Artwork</h2>
          <div className="h-px bg-earth-200 dark:bg-earth-700 mb-5" />
          <p className="text-earth-600 dark:text-earth-400 leading-relaxed text-sm">
            {artwork.name} is an original work by an AfriStudio artist, created in {year ?? 'recent years'}.
            This piece exemplifies the depth and richness of African artistic tradition, celebrating
            the cultural heritage and contemporary expression that defines the African art scene.
          </p>
          <Link
            to={`/artworks?category=${artwork.category?.uuid}`}
            className="inline-flex items-center gap-1.5 mt-5 text-sm text-primary-500 hover:text-primary-400 font-medium transition-colors"
          >
            Browse more {artwork.category?.name} artworks →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

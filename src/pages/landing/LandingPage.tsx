import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, ShoppingCart, Image, Clock, ChevronDown } from 'lucide-react';
import { Footer } from '../../components/layout/Footer';
import { artworksApi, auctionsApi, categoriesApi } from '../../api';
import type { Artwork, Auction, Category } from '../../api/types';
import { Navbar } from '../../components/layout/Navbar';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useCurrency } from '../../hooks/useCurrency';

/* ─── Social icons ──────────────────────────────────────────────── */
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const IconPinterest = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);
const IconTwitter = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* ─── Artwork card ──────────────────────────────────────────────── */
function ArtworkCard({ artwork, currency }: { artwork: Artwork; currency: string }) {
  void currency;
  return (
    <Link to={`/artworks/${artwork.uuid}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-earth-100">
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.name}
            draggable={false}
            onContextMenu={e => e.preventDefault()}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none ${artwork.is_sold ? 'brightness-50' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={40} className="text-earth-300" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="flex items-center gap-2 bg-white/90 text-earth-900 font-medium text-sm px-4 py-2 rounded-full shadow">
            <Eye size={14} /> View Details
          </span>
        </div>
        {/* Cart icon */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
            <ShoppingCart size={13} className="text-earth-800" />
          </div>
        </div>
        {artwork.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-4 border-red-500 rounded-lg px-4 py-1.5 rotate-[-18deg] bg-black/10">
              <span className="text-red-400 font-bold text-xl tracking-widest uppercase">Sold</span>
            </div>
          </div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-script text-lg text-earth-900 dark:text-earth-100">{artwork.name}</h3>
        <p className="text-xs text-earth-400 mt-0.5">
          {artwork.created_at ? new Date(artwork.created_at).getFullYear() : ''} • {artwork.dimensions}
        </p>
        <p className="text-primary-500 font-semibold mt-1 text-sm">{artwork.pricing?.formatted ?? '—'}</p>
      </div>
    </Link>
  );
}

/* ─── Auction card ──────────────────────────────────────────────── */
function AuctionCard({ auction }: { auction: Auction }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      if (auction.status !== 'live') { setTimeLeft(''); return; }
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

  return (
    <Link to={`/auctions/${auction.uuid}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-earth-100">
        {auction.artwork_image ? (
          <img
            src={auction.artwork_image}
            alt={auction.artwork_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={40} className="text-earth-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="flex items-center gap-2 bg-white/90 text-earth-900 font-medium text-sm px-4 py-2 rounded-full shadow">
            <Eye size={14} /> View Details
          </span>
        </div>
        <div className="absolute top-3 left-3"><StatusBadge status={auction.status} /></div>
        {auction.status === 'live' && timeLeft && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded-lg flex items-center gap-1">
            <Clock size={11} /> {timeLeft}
          </div>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-script text-lg text-earth-900 dark:text-earth-100">{auction.artwork_name}</h3>
        <p className="text-xs text-earth-400 mt-0.5">{auction.total_bids} bids</p>
        <p className="text-primary-500 font-semibold mt-1 text-sm">
          {auction.currency} {auction.current_price || auction.start_price}
        </p>
      </div>
    </Link>
  );
}

/* ─── Landing Page ──────────────────────────────────────────────── */
export function LandingPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [heroArtworks, setHeroArtworks] = useState<Artwork[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { currency, setCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const { currencies } = useCurrencies();

  useEffect(() => {
    artworksApi.list()
      .then(res => {
        const imgs = (res.data.results || []).filter((a: Artwork) => a.image_url);
        setHeroArtworks(imgs.slice(0, 1));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    Promise.allSettled([auctionsApi.list(), categoriesApi.list()])
      .then(([au, c]) => {
        if (au.status === 'fulfilled') setAuctions((au.value.data as Auction[]).slice(0, 6));
        if (c.status === 'fulfilled') setCategories((c.value.data.results || []).slice(0, 8));
      }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setArtworksLoading(true);
    artworksApi.list({ currency })
      .then(res => setArtworks((res.data.results || []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setArtworksLoading(false));
  }, [currency]);

  const liveAuctions = auctions.filter(a => a.status === 'live');
  const heroImage = heroArtworks[0]?.image_url ?? null;

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950 transition-colors duration-300">
      <Navbar scrollAware />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        className="relative -mt-16 h-screen min-h-[600px] max-h-[1000px] flex items-center overflow-hidden"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(to right, rgba(10,5,2,0.75) 0%, rgba(10,5,2,0.45) 60%, rgba(10,5,2,0.20) 100%), url(${heroImage})`
            : 'linear-gradient(135deg, #2a1c12 0%, #3d2914 60%, #5c3c1e 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-xl">
            <p className="text-primary-300 italic text-lg mb-1 animate-fade-in">Welcome to</p>
            <h1 className="font-script text-7xl sm:text-8xl lg:text-9xl text-white leading-none mb-6 animate-fade-up">
              Afristudio
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed mb-8 max-w-sm animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Discover the soul of Africa through exceptional artworks that celebrate tradition,
              modernity, and the enduring spirit of the continent.
            </p>
            <Link
              to="/artworks"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-lg hover:shadow-primary-500/40 hover:scale-105 animate-fade-up"
              style={{ animationDelay: '0.3s' }}
            >
              Explore Gallery <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right — Social icons */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 hidden md:flex">
          {[
            { icon: IconInstagram, href: '#', label: 'Instagram' },
            { icon: IconPinterest, href: '#', label: 'Pinterest' },
            { icon: IconTwitter, href: '#', label: 'Twitter' },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              className="w-9 h-9 bg-white/10 hover:bg-primary-500 border border-white/20 hover:border-primary-500 rounded-full flex items-center justify-center text-white transition-all duration-200"
            >
              <s.icon />
            </a>
          ))}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 animate-bounce">
          <ChevronDown size={28} />
        </div>
      </section>

      {/* ── FEATURED WORKS ───────────────────────────────────────── */}
      <section className="py-20 bg-earth-50 dark:bg-earth-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-earth-400 uppercase tracking-[0.25em] mb-2">Curated Collection</p>
            <h2 className="font-script text-5xl sm:text-6xl text-earth-900 dark:text-earth-100 mb-3">Featured Works</h2>
            <p className="text-earth-500 dark:text-earth-400 text-sm max-w-sm mx-auto">
              Handpicked pieces that represent the depth and diversity of African artistry
            </p>
          </div>

          {/* Currency + View all row */}
          <div className="flex items-center justify-between mb-8">
            {currencies.length > 0 && (
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-lg text-earth-700 dark:text-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
              >
                {currencies.map(c => (
                  <option key={c.uuid} value={c.code}>{c.code} ({c.symbol})</option>
                ))}
              </select>
            )}
            <Link
              to="/artworks"
              className="ml-auto text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors flex items-center gap-1"
            >
              View all artworks <ArrowRight size={14} />
            </Link>
          </div>

          {artworksLoading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {artworks.map(a => <ArtworkCard key={a.uuid} artwork={a} currency={currency} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── LIVE AUCTIONS ─────────────────────────────────────────── */}
      {liveAuctions.length > 0 && (
        <section className="py-20 bg-white dark:bg-earth-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs font-semibold text-green-600 uppercase tracking-[0.25em]">Live Now</p>
              </div>
              <h2 className="font-script text-5xl sm:text-6xl text-earth-900 dark:text-earth-100 mb-3">Active Auctions</h2>
              <p className="text-earth-500 dark:text-earth-400 text-sm max-w-sm mx-auto">
                Bid on exclusive African artworks in real time
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Spinner size="lg" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {liveAuctions.slice(0, 4).map(a => <AuctionCard key={a.uuid} auction={a} />)}
              </div>
            )}

            <div className="text-center mt-10">
              <Link
                to="/auctions"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-7 py-3 rounded-full transition-all duration-200"
              >
                View All Auctions <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT / ARTIST ────────────────────────────────────────── */}
      <section className="py-20 bg-earth-50 dark:bg-earth-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Photo */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-earth-200 dark:bg-earth-800 shadow-xl">
                {heroImage ? (
                  <img src={heroImage} alt="African Art" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-earth-200 to-earth-300 flex items-center justify-center">
                    <Image size={60} className="text-earth-400" />
                  </div>
                )}
              </div>
              {/* Decorative orange border accent */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-4 border-primary-400 rounded-2xl -z-10" />
            </div>

            {/* Content */}
            <div className="lg:pl-6 border-l-0 lg:border-l-4 border-primary-500">
              <p className="text-xs font-semibold text-earth-400 uppercase tracking-[0.25em] mb-2">The Studio</p>
              <h2 className="font-script text-5xl sm:text-6xl text-earth-900 dark:text-earth-100 mb-2">AfriStudio</h2>
              <p className="text-primary-500 font-medium mb-5">Africa's Premier Art Marketplace</p>
              <p className="text-earth-600 dark:text-earth-400 leading-relaxed mb-4">
                AfriStudio is a curated marketplace celebrating the rich tapestry of African visual art.
                We connect passionate collectors with Africa's finest artists — from Dar es Salaam to Lagos,
                Nairobi to Accra — through a transparent, real-time auction platform.
              </p>
              <p className="text-earth-600 dark:text-earth-400 leading-relaxed mb-8">
                Every piece in our collection is handpicked to represent the depth, diversity, and
                enduring spirit of African creativity — bridging ancestral wisdom with contemporary expression.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow hover:shadow-lg"
              >
                Read Full Story <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 bg-white dark:bg-earth-900/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-earth-400 uppercase tracking-[0.25em] mb-2">Browse</p>
              <h2 className="font-script text-4xl sm:text-5xl text-earth-900 dark:text-earth-100">Art Categories</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map(cat => (
                <Link
                  key={cat.uuid}
                  to={`/artworks?category=${cat.uuid}`}
                  className="px-5 py-2.5 bg-earth-50 dark:bg-earth-800 hover:bg-primary-500 dark:hover:bg-primary-600 border border-earth-200 dark:border-earth-700 hover:border-primary-500 rounded-full text-sm font-medium text-earth-700 dark:text-earth-300 hover:text-white transition-all duration-200"
                >
                  {cat.name}
                  <span className="ml-2 text-xs text-earth-400 group-hover:text-white/70">{cat.artworks_count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-earth-50 dark:bg-earth-950">
        <div className="max-w-2xl mx-auto text-center px-4">
          <p className="text-earth-500 dark:text-earth-400 text-base leading-relaxed mb-8">
            Each artwork tells a story. Let these extraordinary pieces become part of your
            collection and your story.
          </p>
          <Link
            to="/artworks"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-400 text-white font-semibold px-8 py-3.5 rounded-full transition-all duration-200 shadow-lg hover:shadow-primary-500/30 hover:scale-105"
          >
            Start Exploring <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

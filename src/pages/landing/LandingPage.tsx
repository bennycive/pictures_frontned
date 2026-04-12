import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Gavel, Image, Shield, Globe, ChevronRight,
  Clock, TrendingUp, Tag, Sparkles
} from 'lucide-react';
import { Footer } from '../../components/layout/Footer';
import { artworksApi, auctionsApi, categoriesApi } from '../../api';
import type { Artwork, Auction, Category } from '../../api/types';
import { Navbar } from '../../components/layout/Navbar';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { useCurrencies } from '../../hooks/useCurrencies';

/* ─── Artwork card ─────────────────────────────────────────────── */
function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <Link
      to={`/artworks/${artwork.uuid}`}
      className="group relative bg-white dark:bg-earth-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-earth-100 dark:border-earth-700"
    >
      <div className="aspect-[4/3] bg-earth-100 dark:bg-earth-700 overflow-hidden">
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={40} className="text-earth-300" />
          </div>
        )}
      </div>
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-earth-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="p-4">
        <p className="text-xs text-primary-600 font-semibold mb-1 uppercase tracking-wide">{artwork.category?.name}</p>
        <h3 className="font-display font-semibold text-earth-900 dark:text-earth-100 truncate">{artwork.name}</h3>
        <p className="text-xs text-earth-400 mt-0.5">{artwork.dimensions}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">
            {artwork.pricing?.formatted ?? '—'}
          </span>
          {artwork.is_sold && (
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">Sold</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Auction card ─────────────────────────────────────────────── */
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
    <Link
      to={`/auctions/${auction.uuid}`}
      className="group relative bg-white dark:bg-earth-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-earth-100 dark:border-earth-700"
    >
      <div className="aspect-[4/3] bg-earth-100 dark:bg-earth-700 overflow-hidden relative">
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
        <div className="absolute top-3 left-3"><StatusBadge status={auction.status} /></div>
        {auction.status === 'live' && timeLeft && (
          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded-lg flex items-center gap-1">
            <Clock size={11} /> {timeLeft}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-earth-900 dark:text-earth-100 truncate">{auction.artwork_name}</h3>
        <div className="mt-2 flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-earth-400 mb-0.5">Current bid</p>
            <p className="font-bold text-primary-600 dark:text-primary-400">
              {auction.currency} {auction.current_price || auction.start_price}
            </p>
          </div>
          <div className="text-right text-xs text-earth-400 flex items-center gap-1">
            <TrendingUp size={12} className="text-earth-400" />
            {auction.total_bids} bids
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Landing Page ─────────────────────────────────────────────── */
export function LandingPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [heroArtworks, setHeroArtworks] = useState<Artwork[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState(() => localStorage.getItem('afristudio-currency') || 'USD');
  const [loading, setLoading] = useState(true);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const { currencies } = useCurrencies();

  // Hero images fetched immediately on mount — no currency param, just need image_url
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

  // Persist selected currency
  useEffect(() => { localStorage.setItem('afristudio-currency', currency); }, [currency]);

  // Featured artworks re-fetch when currency changes
  useEffect(() => {
    setArtworksLoading(true);
    artworksApi.list({ currency })
      .then(res => setArtworks((res.data.results || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setArtworksLoading(false));
  }, [currency]);

  const liveAuctions = auctions.filter(a => a.status === 'live');

  // First artwork image for the hero
  const heroImage = heroArtworks[0]?.image_url ?? null;

  return (
    <div className="min-h-screen bg-earth-50 dark:bg-earth-950 transition-colors duration-300">
      <Navbar scrollAware />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        className="hero-grain relative -mt-16 h-screen min-h-[600px] max-h-[1000px] flex items-center overflow-hidden"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(105deg, rgba(10,5,2,0.93) 0%, rgba(10,5,2,0.70) 45%, rgba(10,5,2,0.25) 100%), url(${heroImage})`
            : 'linear-gradient(105deg, #0a0502 0%, #1a0e08 60%, #2a1c12 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Warm amber glow behind text */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(180,100,20,0.14) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <div className="max-w-2xl">
            {/* Live badge */}
            {liveAuctions.length > 0 && (
              <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/40 rounded-full px-4 py-1.5 text-primary-300 text-sm mb-8 animate-fade-in">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                {liveAuctions.length} Live Auction{liveAuctions.length !== 1 ? 's' : ''} Now
              </div>
            )}

            <h1 className="font-display font-bold leading-[1.1] mb-6">
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-white animate-fade-up">
                Discover &amp;
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-primary-400 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                Bid on African
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-white animate-fade-up" style={{ animationDelay: '0.2s' }}>
                Digital Art
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-earth-300 mb-10 leading-relaxed max-w-xl animate-fade-up" style={{ animationDelay: '0.3s' }}>
              AfriStudio connects collectors with Africa's finest artists through transparent,
              real-time auctions. Own a piece of African creativity.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <Link
                to="/auctions"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-primary-600/30 hover:scale-105"
              >
                <Gavel size={18} /> Browse Auctions <ArrowRight size={15} />
              </Link>
              <Link
                to="/artworks"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/40"
              >
                <Sparkles size={18} /> View Artworks
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-8 mt-14 animate-fade-up" style={{ animationDelay: '0.5s' }}>
              {[
                { n: '500+', l: 'Artworks' },
                { n: `${categories.length}+`, l: 'Categories' },
                { n: `${liveAuctions.length}`, l: 'Live Now' },
                { n: '1.2K+', l: 'Collectors' },
              ].map(s => (
                <div key={s.l}>
                  <p className="text-2xl font-bold text-primary-400 font-display">{s.n}</p>
                  <p className="text-xs text-earth-400 mt-0.5 uppercase tracking-widest">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <div className="w-5 h-8 border-2 border-white rounded-full flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* ── LIVE AUCTIONS ─────────────────────────────────────────── */}
      {liveAuctions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-widest">Live Now</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-earth-900 dark:text-earth-100">Active Auctions</h2>
            </div>
            <Link to="/auctions" className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-semibold group">
              View all <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveAuctions.slice(0, 6).map(a => <AuctionCard key={a.uuid} auction={a} />)}
            </div>
          )}
        </section>
      )}

      {/* ── FEATURED ARTWORKS ─────────────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-earth-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Collection</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-earth-900 dark:text-earth-100">Featured Artworks</h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency selector */}
              {currencies.length > 0 && (
                <div className="relative">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-earth-50 dark:bg-earth-800 border border-earth-200 dark:border-earth-700 rounded-lg text-earth-700 dark:text-earth-300 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
                  >
                    {currencies.map(c => (
                      <option key={c.uuid} value={c.code}>{c.code} ({c.symbol})</option>
                    ))}
                  </select>
                  <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-earth-400 pointer-events-none" />
                </div>
              )}
              <Link to="/artworks" className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-semibold group">
                View all <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {artworksLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {artworks.map(a => <ArtworkCard key={a.uuid} artwork={a} />)}
            </div>
          )}

          <div className="text-center mt-10 sm:hidden">
            <Link to="/artworks" className="btn-primary inline-flex items-center gap-2">
              Browse all artworks <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-2">Explore</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-earth-900 dark:text-earth-100">Browse by Category</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat.uuid}
                to={`/artworks?category=${cat.uuid}`}
                className="group relative flex flex-col items-center p-6 bg-white dark:bg-earth-800 hover:bg-primary-50 dark:hover:bg-earth-700 rounded-2xl border border-earth-100 dark:border-earth-700 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 group-hover:bg-primary-200 dark:group-hover:bg-primary-800/60 rounded-xl flex items-center justify-center mb-3 transition-colors">
                  <Tag size={22} className="text-primary-600 dark:text-primary-400" />
                </div>
                <p className="font-semibold text-earth-800 dark:text-earth-200 text-sm text-center leading-tight">{cat.name}</p>
                <p className="text-xs text-earth-400 dark:text-earth-500 mt-1">{cat.artworks_count} artworks</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── WHY AFRISTUDIO ────────────────────────────────────────── */}
      <section className="bg-earth-900 dark:bg-earth-950 py-24 relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-800/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary-400 uppercase tracking-widest mb-2">Why choose us</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">Built for Art Lovers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Gavel,
                title: 'Real-Time Bidding',
                desc: 'Experience live, transparent auctions with instant bid updates via WebSocket — every bid reflected instantly across all devices.',
              },
              {
                icon: Shield,
                title: 'Secure & Trusted',
                desc: 'Every purchase is protected with our wallet-based payment system, escrow-style transfers, and full buyer guarantee.',
              },
              {
                icon: Globe,
                title: 'African Heritage',
                desc: 'Curated artworks celebrating the rich diversity of African art — from Nairobi to Lagos, Accra to Dar es Salaam.',
              },
            ].map((f, i) => (
              <div key={f.title} className="relative p-8 bg-white/5 hover:bg-white/8 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-14 h-14 bg-primary-600/20 rounded-xl flex items-center justify-center mb-5">
                  <f.icon size={26} className="text-primary-400" />
                </div>
                <h3 className="font-display font-bold text-xl text-white mb-3">{f.title}</h3>
                <p className="text-earth-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)' }} />
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Ready to Start<br />Collecting?
          </h2>
          <p className="text-primary-100 text-lg mb-10 leading-relaxed">
            Join thousands of collectors and artists on Africa's premier digital art platform.
            Your next masterpiece is waiting.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link
              to="/auctions"
              className="inline-flex items-center gap-2 border-2 border-white/40 hover:border-white/80 text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:bg-white/10"
            >
              Explore Auctions
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

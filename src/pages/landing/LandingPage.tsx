import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gavel, Image, Shield, Globe, ChevronRight, Clock, TrendingUp, Tag, ChevronDown } from 'lucide-react';
import { artworksApi, auctionsApi, categoriesApi } from '../../api';
import type { Artwork, Auction, Category } from '../../api/types';
import { useCurrencies } from '../../hooks/useCurrencies';
import { Navbar } from '../../components/layout/Navbar';
import { StatusBadge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

function ArtworkCard({ artwork }: { artwork: Artwork }) {
  return (
    <Link to={`/artworks/${artwork.uuid}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-earth-100">
      <div className="aspect-[4/3] bg-earth-100 overflow-hidden">
        {artwork.image_url ? (
          <img src={artwork.image_url} alt={artwork.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={40} className="text-earth-300" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-primary-600 font-medium mb-1">{artwork.category?.name}</p>
        <h3 className="font-semibold text-earth-900 truncate">{artwork.name}</h3>
        <p className="text-sm text-earth-500 mt-1">{artwork.dimensions}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-primary-700">
            {artwork.pricing?.formatted ?? '—'}
          </span>
          {artwork.is_sold && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Sold</span>}
        </div>
      </div>
    </Link>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      if (auction.status !== 'live') { setTimeLeft(''); return; }
      const end = new Date(auction.end_time).getTime();
      const diff = end - Date.now();
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
    <Link to={`/auctions/${auction.uuid}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-earth-100">
      <div className="aspect-[4/3] bg-earth-100 overflow-hidden relative">
        {auction.artwork_image ? (
          <img src={auction.artwork_image} alt={auction.artwork_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Image size={40} className="text-earth-300" /></div>
        )}
        <div className="absolute top-3 left-3">
          <StatusBadge status={auction.status} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-earth-900 truncate">{auction.artwork_name}</h3>
        <div className="mt-2 flex items-center justify-between text-sm">
          <div>
            <p className="text-earth-500">Current bid</p>
            <p className="font-bold text-primary-700">
              {auction.current_price ? `${auction.currency} ${auction.current_price}` : `${auction.currency} ${auction.start_price}`}
            </p>
          </div>
          {auction.status === 'live' && timeLeft && (
            <div className="text-right">
              <p className="text-earth-500 flex items-center gap-1"><Clock size={12} />Ends in</p>
              <p className="font-semibold text-red-600 text-xs">{timeLeft}</p>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-earth-400">
          <TrendingUp size={12} />
          {auction.total_bids} bids
        </div>
      </div>
    </Link>
  );
}

export function LandingPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [artworksLoading, setArtworksLoading] = useState(false);
  const { currencies } = useCurrencies();

  // Load auctions + categories once
  useEffect(() => {
    Promise.allSettled([
      auctionsApi.list(),
      categoriesApi.list(),
    ]).then(([au, c]) => {
      if (au.status === 'fulfilled') setAuctions((au.value.data as Auction[]).slice(0, 6));
      if (c.status === 'fulfilled') setCategories((c.value.data.results || []).slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  // Reload artworks whenever currency changes
  useEffect(() => {
    setArtworksLoading(true);
    artworksApi.list({ currency })
      .then(res => setArtworks((res.data.results || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setArtworksLoading(false));
  }, [currency]);

  const liveAuctions = auctions.filter(a => a.status === 'live');

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-earth-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #d4881e 0%, transparent 60%), radial-gradient(circle at 70% 30%, #8b5e32 0%, transparent 50%)' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 rounded-full px-4 py-1.5 text-primary-300 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {liveAuctions.length} Live Auctions Now
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6">
              Discover & Bid on<br />
              <span className="text-primary-400">African Digital Art</span>
            </h1>
            <p className="text-xl text-earth-300 mb-8 leading-relaxed">
              AfriStudio connects collectors with Africa's finest digital artists through transparent, real-time auctions. Own a piece of African creativity.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auctions" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                <Gavel size={20} /> Browse Auctions <ArrowRight size={16} />
              </Link>
              <Link to="/artworks" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors border border-white/20">
                <Image size={20} /> View Artworks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Artworks Listed', value: '500+' },
              { label: 'Categories', value: `${categories.length}+` },
              { label: 'Live Auctions', value: `${liveAuctions.length}` },
              { label: 'Happy Collectors', value: '1,200+' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary-200">{s.value}</p>
                <p className="text-sm text-primary-300 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Auctions */}
      {liveAuctions.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600 font-medium">Live Now</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-earth-900">Active Auctions</h2>
            </div>
            <Link to="/auctions" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all <ChevronRight size={16} />
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

      {/* Featured Artworks */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-bold text-earth-900">Featured Artworks</h2>
          <div className="flex items-center gap-3">
            {/* Currency selector */}
            {currencies.length > 0 && (
              <div className="relative">
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-white border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
                >
                  {currencies.map(c => (
                    <option key={c.uuid} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
              </div>
            )}
            <Link to="/artworks" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all <ChevronRight size={16} />
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
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-display font-bold text-earth-900 mb-8 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map(cat => (
                <Link
                  key={cat.uuid}
                  to={`/artworks?category=${cat.uuid}`}
                  className="group flex flex-col items-center p-6 bg-earth-50 hover:bg-primary-50 rounded-xl border border-earth-100 hover:border-primary-200 transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 group-hover:bg-primary-200 rounded-xl flex items-center justify-center mb-3 transition-colors">
                    <Tag size={24} className="text-primary-600" />
                  </div>
                  <p className="font-semibold text-earth-800 text-sm text-center">{cat.name}</p>
                  <p className="text-xs text-earth-400 mt-1">{cat.artworks_count} artworks</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-display font-bold text-earth-900 text-center mb-12">Why AfriStudio?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Gavel, title: 'Real-Time Bidding', desc: 'Experience live, transparent auctions with instant bid updates and fair competition.' },
            { icon: Shield, title: 'Secure Transactions', desc: 'Every purchase is protected with our wallet-based payment system and buyer guarantee.' },
            { icon: Globe, title: 'African Heritage', desc: 'Curated artworks celebrating the rich diversity of African art, culture, and creativity.' },
          ].map(f => (
            <div key={f.title} className="text-center p-8 bg-white rounded-xl border border-earth-100">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <f.icon size={28} className="text-primary-600" />
              </div>
              <h3 className="font-bold text-earth-900 mb-2">{f.title}</h3>
              <p className="text-earth-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-earth-900 text-white py-16">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-display font-bold mb-4">Ready to Start Collecting?</h2>
          <p className="text-earth-300 mb-8">Join thousands of collectors and artists on Africa's premier digital art platform.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/auctions" className="inline-flex items-center gap-2 border border-earth-600 hover:border-earth-400 text-earth-300 hover:text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Explore Auctions
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-earth-950 text-earth-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">AS</div>
            <span className="text-earth-300 font-medium">AfriStudio</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} AfriStudio. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/artworks" className="hover:text-earth-200 transition-colors">Artworks</Link>
            <Link to="/auctions" className="hover:text-earth-200 transition-colors">Auctions</Link>
            <Link to="/login" className="hover:text-earth-200 transition-colors">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Image, ShoppingCart, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { artworksApi, categoriesApi, cartApi } from '../../api';
import type { Artwork, Category } from '../../api/types';
import { useCurrencies } from '../../hooks/useCurrencies';
import { useCurrency } from '../../hooks/useCurrency';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';

export function ArtworksPage() {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { currency, setCurrency } = useCurrency();
  const { currencies } = useCurrencies();
  const categoryFilter = searchParams.get('category') || '';

  const load = async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([
        artworksApi.list({ search, page, currency, ...(categoryFilter ? { category_uuid: categoryFilter } : {}) }),
        categoriesApi.list(),
      ]);
      setArtworks(a.data.results);
      setTotal(a.data.count);
      setCategories(c.data.results);
    } catch { error('Failed to load artworks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, page, currency, categoryFilter]);

  const doAddToCart = async (uuid: string) => {
    setAddingToCart(uuid);
    try { await cartApi.addItem(uuid); success('Added to cart!'); }
    catch { error('Failed to add to cart'); }
    finally { setAddingToCart(null); }
  };

  const handleAddToCart = (uuid: string) => {
    if (!user) {
      openAuthModal({
        hint: 'Sign in to add artworks to your cart',
        onSuccess: () => doAddToCart(uuid),
      });
      return;
    }
    doAddToCart(uuid);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="min-h-screen bg-earth-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-earth-900">Artworks</h1>
            <p className="text-earth-500 text-sm mt-1">{total} artworks available</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Currency selector */}
            {currencies.length > 0 && (
              <div className="relative shrink-0">
                <select
                  value={currency}
                  onChange={e => { setCurrency(e.target.value); setPage(1); }}
                  className="appearance-none pl-3 pr-7 py-2 text-sm bg-white border border-earth-200 rounded-lg text-earth-700 focus:outline-none focus:ring-2 focus:ring-primary-300 cursor-pointer"
                >
                  {currencies.map(c => (
                    <option key={c.uuid} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
              </div>
            )}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
              <input className="input pl-9" placeholder="Search artworks..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className="lg:w-56 shrink-0">
            <div className="bg-white rounded-xl border border-earth-100 p-4">
              <div className="flex items-center gap-2 mb-3 text-earth-700 font-semibold text-sm">
                <SlidersHorizontal size={16} /> Categories
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => { setSearchParams({}); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!categoryFilter ? 'bg-primary-50 text-primary-700 font-medium' : 'text-earth-600 hover:bg-earth-50'}`}
                >
                  All Categories
                </button>
                {categories.map(c => (
                  <button
                    key={c.uuid}
                    onClick={() => { setSearchParams({ category: c.uuid }); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${categoryFilter === c.uuid ? 'bg-primary-50 text-primary-700 font-medium' : 'text-earth-600 hover:bg-earth-50'}`}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-earth-400">{c.artworks_count}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-16"><Spinner size="lg" /></div>
            ) : artworks.length === 0 ? (
              <div className="text-center py-16 text-earth-400">No artworks found.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {artworks.map(artwork => (
                    <div key={artwork.uuid} className="bg-white rounded-xl overflow-hidden border border-earth-100 hover:shadow-md transition-shadow group">
                      <Link to={`/artworks/${artwork.uuid}`} className="relative block aspect-[4/3] overflow-hidden bg-earth-100">
                        {artwork.image_url ? (
                          <img src={artwork.image_url} alt={artwork.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${artwork.is_sold ? 'blur-sm brightness-50' : ''}`} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Image size={40} className="text-earth-300" /></div>
                        )}
                        {artwork.is_sold && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="border-4 border-red-500 rounded-lg px-4 py-1.5 rotate-[-18deg]">
                              <span className="text-red-500 font-display font-extrabold text-2xl tracking-widest uppercase">Sold</span>
                            </div>
                          </div>
                        )}
                      </Link>
                      <div className="p-4">
                        <p className="text-xs text-primary-600 font-medium mb-1">{artwork.category?.name}</p>
                        <Link to={`/artworks/${artwork.uuid}`}>
                          <h3 className="font-semibold text-earth-900 hover:text-primary-700 transition-colors">{artwork.name}</h3>
                        </Link>
                        <p className="text-xs text-earth-400 mt-1">{artwork.dimensions}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-primary-700">{artwork.pricing?.formatted ?? '—'}</span>
                            {artwork.is_sold && <Badge label="Sold" color="red" />}
                          </div>
                          {!artwork.is_sold && user && (
                            <button
                              onClick={() => handleAddToCart(artwork.uuid)}
                              disabled={addingToCart === artwork.uuid}
                              className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Add to cart"
                            >
                              <ShoppingCart size={16} className={addingToCart === artwork.uuid ? 'text-earth-300' : 'text-primary-600'} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm">Previous</button>
                    <span className="text-sm text-earth-600">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 text-sm">Next</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

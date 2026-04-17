import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { Logo } from '../ui/Logo';
import { cartApi } from '../../api';

interface NavbarProps {
  scrollAware?: boolean;
}

export function Navbar({ scrollAware = false }: NavbarProps) {
  const { user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user) { setCartCount(0); return; }
    cartApi.get()
      .then(res => setCartCount(res.data.items?.length ?? 0))
      .catch(() => {});
  }, [user?.uuid]);

  useEffect(() => {
    if (!scrollAware) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollAware]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isTransparent = scrollAware && !scrolled;

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Gallery', to: '/artworks' },
    { label: 'Auction', to: '/auctions' },
    { label: 'About Artist', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      isTransparent
        ? 'bg-transparent shadow-none'
        : 'bg-earth-50 dark:bg-earth-900 shadow-sm border-b border-earth-100 dark:border-earth-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <Logo
              variant={isTransparent ? 'light' : 'dark'}
              className="h-7 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`relative pb-0.5 transition-colors ${
                  isTransparent
                    ? isActive(l.to)
                      ? 'text-primary-300'
                      : 'text-white/90 hover:text-white'
                    : isActive(l.to)
                      ? 'text-primary-500 dark:text-primary-400'
                      : 'text-earth-700 dark:text-earth-300 hover:text-primary-500 dark:hover:text-primary-400'
                }`}
              >
                {l.label}
                {isActive(l.to) && !isTransparent && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary-500 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className={`p-2 rounded-lg transition-colors ${
                isTransparent
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-earth-500 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
              }`}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <>
                <Link
                  to="/dashboard/cart"
                  className={`relative p-2 rounded-lg transition-colors hidden md:flex ${
                    isTransparent
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
                  }`}
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/dashboard"
                  className="hidden md:flex items-center gap-1.5 bg-earth-900 dark:bg-earth-700 hover:bg-earth-800 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:flex p-2 text-earth-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => openAuthModal({ defaultTab: 'login' })}
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                    isTransparent
                      ? 'text-white border border-white/30 hover:bg-white/10'
                      : 'bg-earth-900 dark:bg-earth-700 hover:bg-earth-800 text-white'
                  }`}
                >
                  Sign In
                </button>
                <Link
                  to="/dashboard/cart"
                  className={`relative p-2 rounded-lg transition-colors ${
                    isTransparent
                      ? 'text-white/80 hover:text-white hover:bg-white/10'
                      : 'text-earth-600 dark:text-earth-400 hover:bg-earth-100 dark:hover:bg-earth-800'
                  }`}
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            )}

            <button
              className={`md:hidden p-2 rounded-lg transition-colors ${
                isTransparent ? 'text-white hover:bg-white/10' : 'text-earth-700 hover:bg-earth-100 dark:text-earth-300 dark:hover:bg-earth-800'
              }`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-earth-50 dark:bg-earth-900 border-t border-earth-100 dark:border-earth-800 px-4 py-4 flex flex-col gap-3 text-sm">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`font-medium transition-colors ${
                isActive(l.to)
                  ? 'text-primary-500'
                  : 'text-earth-700 dark:text-earth-300 hover:text-primary-500'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="border-t border-earth-100 dark:border-earth-800 pt-3 mt-1 flex flex-col gap-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-earth-700 dark:text-earth-300 hover:text-primary-500">Dashboard</Link>
                <Link to="/dashboard/cart" onClick={() => setMenuOpen(false)} className="text-earth-700 dark:text-earth-300 hover:text-primary-500 flex items-center gap-2">
                  Cart
                  {cartCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="text-left text-red-500 hover:text-red-600">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => { setMenuOpen(false); openAuthModal({ defaultTab: 'login' }); }}
                  className="text-left text-earth-700 dark:text-earth-300 hover:text-primary-500">Sign In</button>
                <button onClick={() => { setMenuOpen(false); openAuthModal({ defaultTab: 'register' }); }}
                  className="text-left text-earth-700 dark:text-earth-300 hover:text-primary-500">Register</button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

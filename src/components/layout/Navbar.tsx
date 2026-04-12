import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, LayoutDashboard, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';

interface NavbarProps {
  scrollAware?: boolean;
}

export function Navbar({ scrollAware = false }: NavbarProps) {
  const { user, logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <nav className={`text-white sticky top-0 z-40 transition-all duration-300 ${isTransparent ? 'bg-transparent shadow-none' : 'bg-earth-900 shadow-lg'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">AS</div>
            <span className="font-display font-bold text-lg tracking-wide">AfriStudio</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-primary-300 transition-colors">Home</Link>
            <Link to="/artworks" className="hover:text-primary-300 transition-colors">Artworks</Link>
            <Link to="/auctions" className="hover:text-primary-300 transition-colors">Auctions</Link>
            <Link to="/about" className="hover:text-primary-300 transition-colors">About</Link>
            <Link to="/contact" className="hover:text-primary-300 transition-colors">Contact</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle — always visible */}
            <button
              onClick={toggle}
              className="p-2 hover:bg-earth-800 rounded-lg transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun size={18} className="text-gold-400" />
                : <Moon size={18} className="text-earth-300" />
              }
            </button>

            {user ? (
              <>
                <Link to="/dashboard/cart" className="p-2 hover:bg-earth-800 rounded-lg transition-colors hidden md:flex">
                  <ShoppingCart size={20} />
                </Link>
                <Link to="/dashboard" className="hidden md:flex items-center gap-2 bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="hidden md:flex p-2 hover:bg-earth-800 rounded-lg transition-colors" title="Logout">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => openAuthModal({ defaultTab: 'login' })}
                  className="px-3 py-1.5 text-sm hover:text-primary-300 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal({ defaultTab: 'register' })}
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            )}
            <button className="md:hidden p-2 hover:bg-earth-800 rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-earth-800 border-t border-earth-700 px-4 py-3 flex flex-col gap-3 text-sm">
          <Link to="/" onClick={() => setMenuOpen(false)} className="hover:text-primary-300">Home</Link>
          <Link to="/artworks" onClick={() => setMenuOpen(false)} className="hover:text-primary-300">Artworks</Link>
          <Link to="/auctions" onClick={() => setMenuOpen(false)} className="hover:text-primary-300">Auctions</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)} className="hover:text-primary-300">About</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)} className="hover:text-primary-300">Contact</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-primary-300">Dashboard</Link>
              <button onClick={handleLogout} className="text-left text-red-400 hover:text-red-300">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { setMenuOpen(false); openAuthModal({ defaultTab: 'login' }); }}
                className="text-left hover:text-primary-300">Sign In</button>
              <button onClick={() => { setMenuOpen(false); openAuthModal({ defaultTab: 'register' }); }}
                className="text-left hover:text-primary-300">Register</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

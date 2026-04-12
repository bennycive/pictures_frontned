import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-earth-950 dark:bg-black text-earth-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center font-bold text-white font-display text-sm shadow-lg">
                AS
              </div>
              <span className="text-earth-100 font-display font-bold text-lg tracking-wide">AfriStudio</span>
            </Link>
            <p className="text-sm text-earth-500 leading-relaxed mb-5">
              Africa's premier platform for discovering, collecting, and auctioning authentic African digital art.
            </p>
            <div className="flex gap-3">
              {[
                { icon: IconX, href: '#', label: 'X (Twitter)' },
                { icon: IconInstagram, href: '#', label: 'Instagram' },
                { icon: IconFacebook, href: '#', label: 'Facebook' },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 bg-earth-800 hover:bg-primary-600/30 hover:text-primary-400 border border-earth-700 hover:border-primary-600/50 rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <s.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-earth-200 font-semibold text-sm mb-4 uppercase tracking-widest">Explore</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', to: '/' },
                { label: 'Artworks', to: '/artworks' },
                { label: 'Auctions', to: '/auctions' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-earth-500 hover:text-primary-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-earth-200 font-semibold text-sm mb-4 uppercase tracking-widest">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Sign In', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'My Orders', to: '/dashboard/orders' },
                { label: 'My Wallet', to: '/dashboard/wallet' },
              ].map(l => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-earth-500 hover:text-primary-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-earth-200 font-semibold text-sm mb-4 uppercase tracking-widest">Stay Updated</h4>
            <p className="text-sm text-earth-500 mb-4 leading-relaxed">
              Get notified about new auctions and featured artists.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 min-w-0 bg-earth-800 border border-earth-700 rounded-lg px-3 py-2 text-sm text-earth-200 placeholder-earth-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="button"
                className="shrink-0 w-9 h-9 bg-primary-600 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <Mail size={15} className="text-white" />
              </button>
            </div>
            <p className="text-xs text-earth-600 mt-2">No spam, unsubscribe any time.</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-earth-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-earth-600">
            © {new Date().getFullYear()} AfriStudio. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(l => (
              <a key={l} href="#" className="text-earth-600 hover:text-earth-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

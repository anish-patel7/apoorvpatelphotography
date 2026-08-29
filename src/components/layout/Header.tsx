import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/services', label: 'Services' },
  { to: '/training', label: 'Training' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
      scrolled ? 'bg-background/80 backdrop-blur-xl border-outline-variant/10' : 'bg-transparent border-transparent'
    }`}>
      <div className="flex justify-between items-center px-5 md:px-16 py-6 max-w-[1440px] mx-auto">
        <Link to="/" className="font-display text-[28px] md:text-[32px] text-on-background tracking-tight leading-tight">
          Apoorvpatel Photography
        </Link>

        <div className="hidden md:flex gap-8 items-center">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`font-body text-[12px] font-bold tracking-[0.15em] uppercase transition-all duration-300 ${
                isActive(link.to)
                  ? 'text-primary border-b-2 border-tertiary pb-1'
                  : 'text-on-surface-variant hover:text-on-surface hover:scale-105'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex gap-4 text-primary">
            <a
              href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-tertiary transition-colors hover:scale-105 duration-400"
            >
              <span className="material-symbols-outlined">chat</span>
            </a>
            <a
              href="https://www.instagram.com/apoorvpatel_photography/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-tertiary transition-colors hover:scale-105 duration-400"
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
          </div>
          <Link
            to="/contact"
            className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-3 btn-cinematic hover:bg-tertiary-fixed hover:text-on-tertiary rounded-sm"
          >
            Get a Quote
          </Link>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-primary"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-[28px]">
            {isOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-xl border-t border-outline-variant/10">
          <div className="px-5 py-8 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block py-3 font-body text-[14px] font-semibold tracking-[0.1em] uppercase transition-colors ${
                  isActive(link.to) ? 'text-tertiary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-outline-variant/10 mt-4 flex items-center gap-6">
              <a
                href="https://wa.me/?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-on-surface-variant hover:text-tertiary text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">chat</span> WhatsApp
              </a>
              <a
                href="https://www.instagram.com/apoorvpatel_photography/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-on-surface-variant hover:text-tertiary text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span> Instagram
              </a>
            </div>
            <Link
              to="/contact"
              className="block mt-6 text-center bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-4 rounded-sm"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

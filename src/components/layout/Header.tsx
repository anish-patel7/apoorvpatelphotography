import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  const rawWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const whatsappUrl = cleanWhatsApp && cleanWhatsApp.length >= 7
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent("Hi, I'm interested in your photography services.")}`
    : null;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
      scrolled ? 'bg-background/85 backdrop-blur-xl border-outline-variant/15 shadow-sm' : 'bg-transparent border-transparent'
    }`}>
      <div className="flex justify-between items-center px-4 sm:px-8 md:px-16 py-4 sm:py-5 md:py-6 max-w-[1440px] mx-auto">
        <Link
          to="/"
          className="font-display text-[18px] sm:text-[24px] md:text-[32px] text-on-background tracking-tight leading-tight truncate mr-2"
        >
          Apoorvpatel Photography
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 lg:gap-8 items-center">
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

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <button
            onClick={toggleTheme}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-tertiary/40"
            aria-label="Toggle theme"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <div className="flex gap-4 text-on-surface-variant items-center">
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-tertiary transition-colors hover:scale-105 duration-300"
                aria-label="Chat on WhatsApp"
              >
                <span className="material-symbols-outlined">chat</span>
              </a>
            ) : (
              <Link
                to="/contact"
                className="hover:text-tertiary transition-colors hover:scale-105 duration-300"
                aria-label="Contact Studio"
                title="Contact Studio"
              >
                <span className="material-symbols-outlined">mail</span>
              </Link>
            )}
            <a
              href="https://www.instagram.com/apoorvpatel_photography/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-tertiary transition-colors hover:scale-105 duration-300"
              aria-label="Instagram Profile"
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
          </div>
          <Link
            to="/contact"
            className="bg-on-background text-background font-body text-[13px] font-semibold tracking-[0.05em] px-5 py-2.5 btn-cinematic hover:bg-tertiary-fixed hover:text-on-tertiary rounded-sm transition-colors whitespace-nowrap"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile Hamburger & Theme Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg transition-colors"
            aria-label="Toggle theme"
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-primary p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-tertiary/40"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span className="material-symbols-outlined text-[28px]">
              {isOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-background/98 backdrop-blur-2xl border-t border-outline-variant/15 max-h-[calc(100vh-72px)] overflow-y-auto shadow-2xl">
          <div className="px-5 py-6 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`block py-3 font-body text-[15px] font-semibold tracking-[0.1em] uppercase transition-colors border-b border-outline-variant/10 last:border-b-0 ${
                  isActive(link.to) ? 'text-tertiary pl-2 border-l-2 border-l-tertiary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-6 border-t border-outline-variant/15 mt-4 flex items-center justify-around text-on-surface-variant">
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-tertiary text-sm py-2 font-medium"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span> WhatsApp
                </a>
              ) : (
                <Link
                  to="/contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 hover:text-tertiary text-sm py-2 font-medium"
                >
                  <span className="material-symbols-outlined text-[20px]">mail</span> Inquire
                </Link>
              )}
              <a
                href="https://www.instagram.com/apoorvpatel_photography/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-tertiary text-sm py-2 font-medium"
              >
                <span className="material-symbols-outlined text-[20px]">photo_camera</span> Instagram
              </a>
            </div>
            <Link
              to="/contact"
              onClick={() => setIsOpen(false)}
              className="block mt-6 text-center bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-6 py-3.5 rounded-sm shadow-sm"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

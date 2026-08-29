import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MessageCircle } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-brand-dark/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo.png" alt="Apoorvpatel Photography" className="h-14 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium tracking-wide uppercase transition-colors hover:text-brand-saffron ${location.pathname === link.to ? 'text-brand-saffron' : 'text-white/90'}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a
              href="https://www.instagram.com/apoorvpatel_photography/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-brand-saffron transition-colors"
              aria-label="Instagram"
            >
              <InstagramIcon size={20} />
            </a>
            <a
              href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-green-400 transition-colors"
              aria-label="WhatsApp"
            >
              <MessageCircle size={20} />
            </a>
            <Link
              to="/contact"
              className="ml-2 px-5 py-2 bg-brand-saffron text-black text-sm font-semibold rounded-full hover:bg-brand-gold transition-colors"
            >
              Get a Quote
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-brand-dark/98 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block text-lg font-medium py-2 transition-colors ${location.pathname === link.to ? 'text-brand-saffron' : 'text-white/80 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex items-center gap-4">
              <a
                href="https://www.instagram.com/apoorvpatel_photography/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-brand-saffron"
              >
                <InstagramIcon size={20} /> Instagram
              </a>
              <a
                href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/80 hover:text-green-400"
              >
                <MessageCircle size={20} /> WhatsApp
              </a>
            </div>
            <Link
              to="/contact"
              className="block text-center px-5 py-3 bg-brand-saffron text-black font-semibold rounded-full hover:bg-brand-gold transition-colors"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

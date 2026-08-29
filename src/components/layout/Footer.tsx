import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';

export default function Footer() {
  return (
    <footer className="bg-brand-charcoal border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <img src="/images/logo.png" alt="Apoorvpatel Photography" className="h-16 w-auto mb-4" />
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Professional Photography, Videography, Editing & Training. Serving clients across India and the United Kingdom.
            </p>
            <p className="font-script text-brand-saffron text-lg">"inspired by innovation"</p>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/portfolio', label: 'Portfolio' },
                { to: '/services', label: 'Services' },
                { to: '/training', label: 'Training' },
                { to: '/about', label: 'About' },
                { to: '/contact', label: 'Contact' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-white/60 hover:text-brand-saffron transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              {['Wedding Photography', 'Pre-Wedding Shoots', 'Event Videography', 'Photo Editing', 'Video Editing', 'Photography Training'].map(s => (
                <li key={s}>
                  <Link to="/services" className="text-white/60 hover:text-brand-saffron transition-colors text-sm">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4">Get in Touch</h4>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@apoorvpatelphotography.com" className="flex items-center gap-2 text-white/60 hover:text-brand-saffron transition-colors text-sm">
                  <Mail size={16} /> contact@apoorvpatelphotography.com
                </a>
              </li>
              <li>
                <a href="tel:+91XXXXXXXXXX" className="flex items-center gap-2 text-white/60 hover:text-brand-saffron transition-colors text-sm">
                  <Phone size={16} /> Contact Number
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20photography%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-green-400 transition-colors text-sm"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/apoorvpatel_photography/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-white/60 hover:text-brand-saffron transition-colors text-sm"
                >
                  <InstagramIcon size={16} /> @apoorvpatel_photography
                </a>
              </li>
              <li className="flex items-start gap-2 text-white/60 text-sm">
                <MapPin size={16} className="mt-0.5 shrink-0" /> India | United Kingdom
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Apoorvpatel Photography. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-8 bg-brand-saffron rounded"></div>
            <div className="h-0.5 w-8 bg-white rounded"></div>
            <div className="h-0.5 w-8 bg-brand-green rounded"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}

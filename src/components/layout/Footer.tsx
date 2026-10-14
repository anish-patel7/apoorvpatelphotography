import { Link } from 'react-router-dom';

export default function Footer() {
  const businessEmail = import.meta.env.VITE_BUSINESS_EMAIL || 'contact@apoorvpatelphotography.com';
  const rawWhatsApp = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '');
  const whatsappUrl = cleanWhatsApp && cleanWhatsApp.length >= 7
    ? `https://wa.me/${cleanWhatsApp}?text=${encodeURIComponent("Hi, I'm interested in your photography services.")}`
    : null;

  return (
    <footer className="bg-surface-container-lowest w-full py-20 md:py-[120px] px-5 md:px-16 border-t border-outline-variant/10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-[1440px] mx-auto">
        <div className="md:col-span-6 flex flex-col gap-6">
          <Link to="/" className="font-display text-[28px] md:text-[48px] text-on-surface leading-tight">
            Apoorvpatel Photography
          </Link>
          <p className="font-body text-[16px] text-on-surface-variant max-w-md leading-relaxed">
            Innovative, Professional, and Premium visual storytelling.
          </p>
          <div className="flex gap-4 mt-4">
            <a
              href="https://www.instagram.com/apoorvpatel_photography/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram Profile"
              className="text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">photo_camera</span>
            </a>
            <a
              href={`mailto:${businessEmail}`}
              aria-label="Email Studio"
              className="text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">mail</span>
            </a>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">chat</span>
              </a>
            ) : (
              <Link
                to="/contact"
                aria-label="Inquire via Contact Form"
                title="Inquire with Studio"
                className="text-on-surface-variant hover:text-tertiary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">chat</span>
              </Link>
            )}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col gap-4 mt-8 md:mt-0">
          <span className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface mb-2">Navigate</span>
          {['Portfolio', 'Services', 'Training', 'About', 'Contact'].map(item => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="font-body text-[16px] text-on-surface-variant hover:text-tertiary transition-colors duration-300"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="md:col-span-3 flex flex-col gap-4 mt-8 md:mt-0">
          <span className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface mb-2">Studio</span>
          <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">
            Photography, Videography & Creative Design
          </p>
          <p className="font-body text-[14px] text-on-surface-variant">
            United Kingdom
          </p>
          <a
            href={`mailto:${businessEmail}`}
            className="font-body text-[14px] text-tertiary hover:underline break-all"
          >
            {businessEmail}
          </a>
        </div>

        <div className="md:col-span-12 mt-16 pt-8 border-t border-outline-variant/10 flex justify-between items-center opacity-80">
          <span className="font-body text-[14px] sm:text-[16px] text-primary">
            &copy; {new Date().getFullYear()} Apoorv Patel Photography. All rights reserved.
          </span>
          <span className="font-body text-[14px] text-on-surface-variant hidden sm:block">Based in the United Kingdom</span>
        </div>
      </div>
    </footer>
  );
}

import { MessageCircle, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WhatsAppButton() {
  const rawNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '';
  const cleanNumber = rawNumber.replace(/\D/g, '');

  const isWhatsAppValid = Boolean(cleanNumber && cleanNumber.length >= 8 && cleanNumber.length <= 15);

  if (isWhatsAppValid) {
    return (
      <a
        href={`https://wa.me/${cleanNumber}?text=${encodeURIComponent("Hi, I'm interested in your photography services.")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={26} className="sm:w-7 sm:h-7" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-surface-container text-on-surface text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-outline-variant/10">
          Chat with us
        </span>
      </a>
    );
  }

  // Safe fallback when business WhatsApp number is unconfigured in .env
  return (
    <Link
      to="/contact"
      className="fixed bottom-6 right-6 z-50 bg-tertiary hover:bg-tertiary-fixed text-on-tertiary p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-tertiary focus:ring-offset-2"
      aria-label="Inquire with Studio"
    >
      <Mail size={24} className="sm:w-6 sm:h-6" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-surface-container text-on-surface text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-outline-variant/10">
        Inquire Now
      </span>
    </Link>
  );
}

import { Play, ExternalLink } from 'lucide-react';
import InstagramIcon from '../icons/InstagramIcon';
import { instagramReels } from '../../data/reels';

export default function InstagramReels() {
  return (
    <section className="py-20 sm:py-28 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">
            <InstagramIcon size={16} className="inline -mt-0.5 mr-1" />
            Instagram
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Latest Reels</h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Follow our creative journey on Instagram for behind-the-scenes content, tips, and our latest work.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {instagramReels.map(reel => (
            <a
              key={reel.id}
              href={reel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-[9/16] rounded-xl overflow-hidden"
            >
              <img
                src={reel.thumbnail}
                alt={reel.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-medium truncate">{reel.title}</p>
              </div>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="https://www.instagram.com/apoorvpatel_photography/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-saffron/50 text-brand-saffron font-medium rounded-full hover:bg-brand-saffron hover:text-black transition-all duration-300"
          >
            <InstagramIcon size={18} />
            Follow @apoorvpatel_photography
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

import { Link } from 'react-router-dom';

const BANNER_ALT =
  'Studio — Wedding, Pre-Wedding, Event, Modelling & Outdoor Photography. Designing — Graphic Design, Photo Editing, ' +
  'Video Editing, Logo Design, Business Cards, Brochure Design, Architecture Design, Web Design and Printing Services. ' +
  'Instagram: apoorvpatel_photography';

/**
 * Landing banner. The artwork carries its own headline text, so it is shown uncropped
 * on wide screens (16:9) and trimmed to the central text block on phones (5:4).
 * It starts below the fixed navigation so the menu stays readable in light and dark themes.
 */
export default function Hero() {
  return (
    <header className="relative w-full bg-background pt-20 md:pt-[92px]">
      <h1 className="sr-only">Apoorvpatel Photography — Studio &amp; Designing</h1>

      <div className="relative w-full aspect-[5/4] sm:aspect-[16/9] max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-92px)] overflow-hidden bg-[#141210]">
        <picture>
          <source
            type="image/webp"
            srcSet="/images/hero/studio-designing-960.webp 960w, /images/hero/studio-designing-1600.webp 1600w, /images/hero/studio-designing-2400.webp 2400w"
            sizes="100vw"
          />
          <img
            src="/images/hero/studio-designing-1600.jpg"
            alt={BANNER_ALT}
            width={1600}
            height={900}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-5 py-8 md:py-10 bg-[#141210]">
        <Link
          to="/portfolio"
          className="w-full sm:w-auto text-center bg-white text-[#141210] font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-full btn-cinematic hover:bg-[#F28C28] hover:border-[#F28C28] hover:text-white border border-white transition-colors"
        >
          View Portfolio
        </Link>
        <Link
          to="/contact"
          className="w-full sm:w-auto text-center bg-transparent text-white font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-full btn-cinematic border border-white hover:bg-white hover:text-[#141210] transition-colors"
        >
          Get a Quote
        </Link>
      </div>
    </header>
  );
}

import { Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

export default function NotFound() {
  return (
    <section className="pt-[180px] pb-[120px] px-5 text-center max-w-2xl mx-auto">
      <SEO title="Page Not Found | Apoorv Patel Photography" description="The page you were looking for could not be found." noindex />
      <p className="font-body text-[12px] font-bold tracking-[0.2em] uppercase text-tertiary mb-4">404</p>
      <h1 className="font-display text-[40px] md:text-[56px] text-on-background mb-6 leading-tight font-semibold">Page not found</h1>
      <p className="font-body text-[17px] text-on-surface-variant mb-10">
        The page you were looking for has moved or no longer exists.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/" className="bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-sm btn-cinematic hover:bg-tertiary hover:text-on-tertiary">
          Back to Home
        </Link>
        <Link to="/portfolio" className="border border-outline-variant/30 text-on-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-sm btn-cinematic hover:bg-surface-variant">
          View Portfolio
        </Link>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote, MessageSquareQuote, Loader2 } from 'lucide-react';
import { useTestimonials } from '../../hooks/useTestimonials';

export default function TestimonialsSection() {
  const { testimonials, loading, error } = useTestimonials();
  const [current, setCurrent] = useState(0);

  const prev = () => {
    if (testimonials.length === 0) return;
    setCurrent(i => (i === 0 ? testimonials.length - 1 : i - 1));
  };

  const next = () => {
    if (testimonials.length === 0) return;
    setCurrent(i => (i === testimonials.length - 1 ? 0 : i + 1));
  };

  const safeIndex = testimonials.length > 0 && current < testimonials.length ? current : 0;

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-tertiary text-xs sm:text-sm font-semibold tracking-widest uppercase mb-3">
          Client Testimonials
        </p>
        <h2 id="testimonials-heading" className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface mb-12 sm:mb-16">
          Words From Our Couples & Clients
        </h2>

        {loading ? (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-10 sm:p-14 max-w-3xl mx-auto shadow-sm flex flex-col items-center justify-center min-h-[260px]">
            <Loader2 size={32} className="animate-spin text-tertiary mb-3" />
            <p className="text-on-surface-variant text-sm">Loading client reviews...</p>
          </div>
        ) : error ? (
          <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-2xl p-8 max-w-xl mx-auto text-on-surface-variant text-sm">
            <p>Reviews could not be loaded at this time.</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="bg-surface-container-low/70 border border-outline-variant/30 rounded-2xl p-8 sm:p-12 max-w-2xl mx-auto shadow-sm">
            <MessageSquareQuote size={40} className="text-tertiary/60 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-on-surface mb-2">
              Stories & Experiences
            </h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto leading-relaxed">
              Verified client reviews and wedding experiences are being updated. If you have celebrated with us, we look forward to featuring your story.
            </p>
          </div>
        ) : (
          (() => {
            const t = testimonials[safeIndex];
            const clientName = t.client_name || t.name || 'Anonymous Client';
            const reviewText = t.testimonial || t.review || '';
            const serviceInfo = [t.service, t.client_location, t.date].filter(Boolean).join(' • ');

            return (
              <div className="relative bg-surface-container-low/70 backdrop-blur-xs border border-outline-variant/30 rounded-3xl p-8 sm:p-12 md:p-16 max-w-4xl mx-auto shadow-sm transition-all duration-300">
                <Quote size={44} className="text-tertiary/25 mx-auto mb-6 shrink-0" />

                <blockquote className="text-lg sm:text-2xl md:text-3xl text-on-surface/90 font-light leading-relaxed mb-8 font-display italic">
                  "{reviewText}"
                </blockquote>

                <div className="flex items-center justify-center gap-1.5 mb-4" aria-label={`Rating: ${t.rating || 5} out of 5 stars`}>
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" className="text-tertiary" />
                  ))}
                </div>

                <h3 className="font-display font-semibold text-lg sm:text-xl text-on-surface">
                  {clientName}
                </h3>
                {serviceInfo && (
                  <p className="text-tertiary font-medium text-xs sm:text-sm mt-1">
                    {serviceInfo}
                  </p>
                )}

                {testimonials.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-10">
                    <button
                      onClick={prev}
                      className="w-10 h-10 rounded-full border border-outline-variant/50 text-on-surface hover:text-tertiary hover:border-tertiary flex items-center justify-center bg-surface-container-lowest/50 hover:bg-surface-container transition-colors cursor-pointer"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="flex gap-2 items-center">
                      {testimonials.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrent(i)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            i === safeIndex ? 'bg-tertiary w-6' : 'bg-outline-variant/60 hover:bg-outline-variant w-2'
                          }`}
                          aria-label={`Go to testimonial ${i + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={next}
                      className="w-10 h-10 rounded-full border border-outline-variant/50 text-on-surface hover:text-tertiary hover:border-tertiary flex items-center justify-center bg-surface-container-lowest/50 hover:bg-surface-container transition-colors cursor-pointer"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}

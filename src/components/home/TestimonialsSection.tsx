import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { testimonials } from '../../data/testimonials';

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(i => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === testimonials.length - 1 ? 0 : i + 1));

  const t = testimonials[current];

  return (
    <section className="py-20 sm:py-28 bg-brand-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">Testimonials</p>
        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold mb-12">What Our Clients Say</h2>

        <div className="relative">
          <Quote size={48} className="text-brand-saffron/20 mx-auto mb-6" />

          <p className="text-xl sm:text-2xl text-white/80 font-light leading-relaxed mb-8 font-heading italic">
            "{t.review}"
          </p>

          <div className="flex items-center justify-center gap-1 mb-3">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} size={18} fill="#FF9933" className="text-brand-saffron" />
            ))}
          </div>

          <h4 className="font-semibold text-lg">{t.name}</h4>
          <p className="text-brand-saffron text-sm">{t.service}</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-brand-saffron w-6' : 'bg-white/30'}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

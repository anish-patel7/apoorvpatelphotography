import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { portfolioProjects, portfolioCategories } from '../data/portfolio';

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? portfolioProjects
    : portfolioProjects.filter(p => p.category === activeCategory);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const gridSpans = [
    'md:col-span-8 row-span-1',
    'md:col-span-4 md:row-span-2',
    'md:col-span-4 row-span-1',
    'md:col-span-4 row-span-1',
    'md:col-span-6 row-span-1',
    'md:col-span-6 row-span-1',
    'md:col-span-12 row-span-1',
    'md:col-span-4 row-span-1',
  ];

  return (
    <main className="flex-grow pt-[120px]">
      <header className="px-5 md:px-16 py-[120px] max-w-[1440px] mx-auto text-center">
        <h1 className="font-display text-[40px] md:text-[72px] text-on-background mb-6 leading-[1.1] tracking-[-0.02em] font-semibold">
          Our Portfolio
        </h1>
        <p className="font-body text-[18px] text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          A curated collection of moments, framed with precision and inspired by innovation. Explore our visual stories across various disciplines.
        </p>
      </header>

      <section className="px-5 md:px-16 mb-16 max-w-[1440px] mx-auto overflow-x-auto">
        <div className="flex space-x-8 font-body text-[12px] font-bold tracking-[0.15em] uppercase text-on-surface-variant min-w-max pb-2">
          {portfolioCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-2 transition-colors ${
                activeCategory === cat
                  ? 'text-on-surface border-b-2 border-tertiary'
                  : 'hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-16 pb-[120px] max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[300px] md:auto-rows-[400px]">
          {filtered.map((project, i) => (
            <Link
              key={project.id}
              to={`/portfolio/${project.id}`}
              className={`${gridSpans[i % gridSpans.length]} relative group cursor-pointer overflow-hidden rounded-lg bg-surface-container border border-white/10`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url('${project.coverImage}')` }}
              />
              <div className="absolute inset-0 gallery-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <span className="font-body text-[12px] font-bold tracking-[0.15em] uppercase text-tertiary mb-2">
                  {project.category}
                </span>
                <h3 className="font-display text-[32px] text-on-background leading-tight">
                  {project.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-[120px] bg-surface-container-low text-center px-5">
        <h2 className="font-display text-[32px] md:text-[48px] text-on-background mb-8 leading-tight">
          Ready for your own shoot?
        </h2>
        <Link
          to="/contact"
          className="inline-block bg-on-background text-background font-body text-[14px] font-semibold tracking-[0.05em] px-8 py-4 rounded-sm btn-cinematic hover:bg-tertiary-fixed hover:text-on-tertiary"
        >
          Get a Quote
        </Link>
      </section>
    </main>
  );
}

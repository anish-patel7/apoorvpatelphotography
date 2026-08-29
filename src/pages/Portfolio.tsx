import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Filter } from 'lucide-react';
import { portfolioProjects, portfolioCategories } from '../data/portfolio';

export default function Portfolio() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = activeCategory === 'All'
    ? portfolioProjects
    : portfolioProjects.filter(p => p.category === activeCategory);

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">Our Work</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Portfolio</h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              Explore our collection of photography, videography, and creative projects from across India and the UK.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-brand-saffron" />
            <span className="text-sm text-white/50">Filter by category:</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-12">
            {portfolioCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-saffron text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-white/50 text-lg">No projects found in this category yet.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {filtered.map(project => (
                <Link
                  to={`/portfolio/${project.id}`}
                  key={project.id}
                  className="group block break-inside-avoid rounded-2xl overflow-hidden relative"
                >
                  <img
                    src={project.coverImage}
                    alt={project.title}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <span className="inline-block px-3 py-1 bg-brand-saffron/90 text-black text-xs font-semibold rounded-full mb-2">
                        {project.category}
                      </span>
                      <h3 className="font-heading text-xl font-semibold flex items-center gap-2">
                        {project.title}
                        <ArrowUpRight size={18} />
                      </h3>
                      <p className="text-white/60 text-sm mt-1">{project.location} &middot; {project.date}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

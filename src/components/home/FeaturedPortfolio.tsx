import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { portfolioProjects } from '../../data/portfolio';

export default function FeaturedPortfolio() {
  const featured = portfolioProjects.filter(p => p.featured).slice(0, 6);

  return (
    <section className="py-20 sm:py-28 bg-brand-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">Our Work</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold">Featured Portfolio</h2>
          </div>
          <Link
            to="/portfolio"
            className="flex items-center gap-2 text-brand-saffron font-medium hover:gap-3 transition-all"
          >
            View All <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((project, i) => (
            <Link
              to={`/portfolio/${project.id}`}
              key={project.id}
              className={`group relative overflow-hidden rounded-2xl ${i === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}
            >
              <div className={`${i === 0 ? 'aspect-[4/3]' : 'aspect-[3/4]'} overflow-hidden`}>
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block px-3 py-1 bg-brand-saffron/90 text-black text-xs font-semibold rounded-full mb-2">
                    {project.category}
                  </span>
                  <h3 className="font-heading text-xl font-semibold flex items-center gap-2">
                    {project.title}
                    <ArrowUpRight size={18} />
                  </h3>
                  <p className="text-white/60 text-sm mt-1">{project.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

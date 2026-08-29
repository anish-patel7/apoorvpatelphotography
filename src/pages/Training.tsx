import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, BarChart3, Monitor, Wrench, ChevronDown, ChevronUp, ArrowRight, GraduationCap } from 'lucide-react';
import { trainingCourses } from '../data/training';

export default function Training() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand-saffron text-sm font-semibold tracking-widest uppercase mb-3">
              <GraduationCap size={16} className="inline -mt-0.5 mr-1" />
              Learn & Grow
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Training Courses</h1>
            <p className="text-white/50 max-w-2xl mx-auto">
              Master the art of photography, videography, and editing with our comprehensive training programs designed for all skill levels.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 bg-brand-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {trainingCourses.map(course => (
            <div key={course.id} className="bg-brand-charcoal rounded-2xl overflow-hidden border border-white/5">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="aspect-video lg:aspect-auto overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="lg:col-span-2 p-8">
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3">{course.title}</h2>
                  <p className="text-white/60 leading-relaxed mb-6">{course.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Clock size={16} className="text-brand-saffron" /> {course.duration}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <BarChart3 size={16} className="text-brand-saffron" /> {course.level}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Monitor size={16} className="text-brand-saffron" /> {course.mode}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                      <Wrench size={16} className="text-brand-saffron" /> {course.tools.length} Tools
                    </div>
                  </div>

                  <button
                    onClick={() => setExpanded(expanded === course.id ? null : course.id)}
                    className="flex items-center gap-2 text-brand-saffron text-sm font-medium mb-4 hover:underline"
                  >
                    {expanded === course.id ? 'Hide Curriculum' : 'View Curriculum'}
                    {expanded === course.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {expanded === course.id && (
                    <div className="mb-6 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-white/80">Curriculum</h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {course.curriculum.map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                              <BookOpen size={12} className="text-brand-saffron shrink-0" /> {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-white/80">Tools & Software</h4>
                        <div className="flex flex-wrap gap-2">
                          {course.tools.map(tool => (
                            <span key={tool} className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">{tool}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/contact"
                      className="px-6 py-2.5 bg-brand-saffron text-black text-sm font-semibold rounded-full hover:bg-brand-gold transition-colors flex items-center justify-center gap-2"
                    >
                      Enroll Now <ArrowRight size={16} />
                    </Link>
                    <a
                      href="https://wa.me/?text=Hi%2C%20I%27m%20interested%20in%20your%20training%20courses."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-2.5 border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/5 transition-colors text-center"
                    >
                      Ask a Question
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

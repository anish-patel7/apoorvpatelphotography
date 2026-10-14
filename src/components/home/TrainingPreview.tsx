import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { trainingCourses } from '../../data/training';

export default function TrainingPreview() {
  return (
    <section className="py-20 sm:py-28 bg-surface-container-low/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-tertiary text-sm font-semibold tracking-widest uppercase mb-3">
              <GraduationCap size={16} className="inline -mt-0.5 mr-1" />
              Learn & Grow
            </p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface">Training Courses</h2>
            <p className="text-on-surface-variant mt-3 max-w-lg">
              Master photography, videography, and editing with our comprehensive training programs.
            </p>
          </div>
          <Link
            to="/training"
            className="flex items-center gap-2 text-tertiary font-medium hover:gap-3 transition-all"
          >
            All Courses <ArrowRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trainingCourses.map(course => (
            <Link
              to="/training"
              key={course.id}
              className="group bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/30 hover:border-tertiary/40 transition-all duration-300 shadow-xs"
            >
              <div className="aspect-video overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-tertiary text-xs font-semibold mb-2">
                  <BookOpen size={14} />
                  {course.duration} &middot; {course.level}
                </div>
                <h3 className="font-display text-lg font-semibold text-on-surface mb-2 group-hover:text-tertiary transition-colors">
                  {course.title}
                </h3>
                <p className="text-on-surface-variant text-sm line-clamp-2">{course.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

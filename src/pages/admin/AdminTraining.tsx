import { useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { trainingCourses as initialCourses } from '../../data/training';
import type { TrainingCourse } from '../../types';

export default function AdminTraining() {
  const [courses, setCourses] = useState<TrainingCourse[]>(initialCourses);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TrainingCourse | null>(null);
  const [form, setForm] = useState({ title: '', description: '', duration: '', level: '', fee: '', mode: '', image: '', tools: '', curriculum: '' });

  const handleEdit = (c: TrainingCourse) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description, duration: c.duration, level: c.level, fee: c.fee, mode: c.mode, image: c.image, tools: c.tools.join(', '), curriculum: c.curriculum.join('\n') });
    setShowForm(true);
  };

  const handleSave = () => {
    const data: TrainingCourse = {
      id: editing?.id || `course-${Date.now()}`,
      title: form.title, description: form.description, duration: form.duration,
      level: form.level, fee: form.fee, mode: form.mode, image: form.image,
      tools: form.tools.split(',').map(t => t.trim()).filter(Boolean),
      curriculum: form.curriculum.split('\n').map(c => c.trim()).filter(Boolean),
    };
    if (editing) {
      setCourses(prev => prev.map(c => c.id === editing.id ? data : c));
    } else {
      setCourses(prev => [...prev, data]);
    }
    resetForm();
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ title: '', description: '', duration: '', level: '', fee: '', mode: '', image: '', tools: '', curriculum: '' }); };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Training Courses</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-black text-sm font-semibold rounded-lg hover:bg-brand-gold transition-colors">
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="space-y-4">
        {courses.map(course => (
          <div key={course.id} className="bg-brand-charcoal rounded-xl border border-white/5 flex flex-col sm:flex-row overflow-hidden">
            <div className="sm:w-48 aspect-video sm:aspect-auto shrink-0">
              <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-lg">{course.title}</h3>
                <p className="text-white/50 text-sm mt-1 line-clamp-2">{course.description}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/40">
                  <span>{course.duration}</span>
                  <span>{course.level}</span>
                  <span>{course.mode}</span>
                  <span>{course.fee}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleEdit(course)} className="text-white/50 hover:text-brand-saffron"><Edit3 size={16} /></button>
                <button onClick={() => setCourses(prev => prev.filter(c => c.id !== course.id))} className="text-white/50 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-brand-charcoal rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-heading text-lg font-semibold">{editing ? 'Edit Course' : 'Add Course'}</h3>
              <button onClick={resetForm} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm text-white/60 mb-1 block">Title</label><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm text-white/60 mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-white/60 mb-1 block">Duration</label><input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm text-white/60 mb-1 block">Level</label><input type="text" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm text-white/60 mb-1 block">Fee</label><input type="text" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm text-white/60 mb-1 block">Mode</label><input type="text" value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))} className={inputClass} /></div>
              </div>
              <div><label className="text-sm text-white/60 mb-1 block">Image URL</label><input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm text-white/60 mb-1 block">Tools (comma-separated)</label><input type="text" value={form.tools} onChange={e => setForm(f => ({ ...f, tools: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm text-white/60 mb-1 block">Curriculum (one per line)</label><textarea value={form.curriculum} onChange={e => setForm(f => ({ ...f, curriculum: e.target.value }))} rows={5} className={inputClass} /></div>
              <button onClick={handleSave} className="w-full py-2.5 bg-brand-saffron text-black font-semibold rounded-lg hover:bg-brand-gold transition-colors">
                {editing ? 'Save Changes' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

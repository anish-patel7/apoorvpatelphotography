import { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2, Database } from 'lucide-react';
import { useTrainingAdmin } from '../../hooks/useTraining';

export default function AdminTraining() {
  const { courses, loading, create, update, remove } = useTrainingAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration: '',
    level: 'Beginner to Advanced',
    fee: 'Contact for details',
    mode: 'Online & Offline',
    image: '',
    tools: '',
    curriculum: '',
  });

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description || '',
      duration: c.duration || '',
      level: c.level || 'Beginner to Advanced',
      fee: c.fee || c.price_label || 'Contact for details',
      mode: c.mode || 'Online & Offline',
      image: c.image || c.image_url || '',
      tools: Array.isArray(c.tools) ? c.tools.join(', ') : '',
      curriculum: Array.isArray(c.curriculum) ? c.curriculum.join('\n') : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const data = {
        title: form.title.trim(),
        description: form.description.trim(),
        duration: form.duration.trim(),
        level: form.level.trim(),
        price_label: form.fee.trim(),
        fee: form.fee.trim(),
        mode: form.mode.trim(),
        image: form.image.trim() || '/images/real_work_dzvz4ssjoss.jpg',
        image_url: form.image.trim() || '/images/real_work_dzvz4ssjoss.jpg',
        tools: form.tools.split(',').map(t => t.trim()).filter(Boolean),
        curriculum: form.curriculum.split('\n').map(c => c.trim()).filter(Boolean),
      };

      if (editing) {
        await update(editing.id, data);
      } else {
        await create({
          ...data,
          slug: form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
      }
      resetForm();
    } catch (err: any) {
      alert(err?.message || 'Failed to save training course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course from database?')) {
      try {
        await remove(id);
      } catch (err: any) {
        alert(err?.message || 'Delete operation failed.');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({
      title: '',
      description: '',
      duration: '',
      level: 'Beginner to Advanced',
      fee: 'Contact for details',
      mode: 'Online & Offline',
      image: '',
      tools: '',
      curriculum: '',
    });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          <Database size={15} className="text-tertiary shrink-0" />
          <span><strong>PostgreSQL Database Connected:</strong> Real-time persistence via Supabase <code className="text-tertiary font-mono">training_courses</code> table.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Training & Workshops</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage photography masterclasses, editing bootcamps, and 1-on-1 mentorship</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      {loading && courses.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading courses from database...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Training Courses Found</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Course" above to offer mentorship or training masterclasses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map(course => (
            <div key={course.id} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg text-on-surface">{course.title}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary/15 text-tertiary border border-tertiary/30">
                    {course.duration}
                  </span>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed">{course.description}</p>
                <div className="flex flex-wrap gap-2 text-[11px] text-on-surface-variant pt-1">
                  <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">{course.level}</span>
                  <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">{course.mode}</span>
                  <span className="bg-surface-container px-2 py-0.5 rounded border border-outline-variant/30">{course.fee || course.price_label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-outline-variant/20">
                <button
                  onClick={() => handleEdit(course)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer"
                  title="Edit Course"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer ml-auto"
                  title="Delete Course"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-6 border border-outline-variant/30 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-display text-lg font-bold text-on-surface">
                {editing ? 'Edit Course' : 'Add Training Course'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Wedding Photography Masterclass"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={e => setForm({ ...form, duration: e.target.value })}
                    placeholder="3 Months"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                    Level
                  </label>
                  <input
                    type="text"
                    value={form.level}
                    onChange={e => setForm({ ...form, level: e.target.value })}
                    placeholder="Beginner to Advanced"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Curriculum summary and mentorship details..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Curriculum Topics (One per line)
                </label>
                <textarea
                  rows={3}
                  value={form.curriculum}
                  onChange={e => setForm({ ...form, curriculum: e.target.value })}
                  placeholder="Lighting Fundamentals&#10;Framing & Posing&#10;Lightroom Color Workflow"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="px-5 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editing ? 'Update Course' : 'Save Course'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

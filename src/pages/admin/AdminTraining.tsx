import { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';
import { friendlyError } from '../../lib/adminErrors';
import { useTrainingAdmin } from '../../hooks/useTraining';

export default function AdminTraining() {
  const { courses, loading, error: loadError, create, update, remove, move } = useTrainingAdmin();
  const imageStorage = useStorage('website-media');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const flash = (n: { type: 'success' | 'error'; text: string }) => { setNotice(n); setTimeout(() => setNotice(null), n.type === 'error' ? 7000 : 3500); };

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
    published: true,
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
      published: c.is_active ?? true,
    });
    setFormError(null);
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
        fee: form.fee.trim(),
        mode: form.mode.trim(),
        image: form.image.trim() || '/images/real_work_dzvz4ssjoss.jpg',
        tools: form.tools.split(',').map(t => t.trim()).filter(Boolean),
        curriculum: form.curriculum.split('\n').map(c => c.trim()).filter(Boolean),
        is_active: form.published,
      };

      if (editing) {
        await update(editing.id, data);
        flash({ type: 'success', text: 'Your changes have been saved.' });
      } else {
        const base = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course';
        const taken = new Set(courses.map(x => x.slug));
        let slug = base;
        for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
        await create({ ...data, slug, sort_order: courses.reduce((m, x) => Math.max(m, x.sort_order), 0) + 1 });
        flash({ type: 'success', text: form.published ? 'Course published.' : 'Course saved as hidden.' });
      }
      resetForm();
    } catch (err: any) {
      setFormError(friendlyError(err, 'Save course', 'Your changes could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await remove(id);
        flash({ type: 'success', text: 'Course deleted.' });
      } catch (err: any) {
        alert(friendlyError(err, 'Delete course', 'This course could not be deleted. Please try again.'));
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
      published: true,
    });
    setFormError(null);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    try {
      const { publicUrl } = await imageStorage.uploadFile(file, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxBytes: 10 * 1024 * 1024,
        folder: 'training',
      });
      setForm(f => ({ ...f, image: publicUrl }));
    } catch (err) {
      setFormError(friendlyError(err, 'Course image upload', 'The image could not be uploaded.'));
    }
  };

  const quick = async (id: string, action: () => Promise<void>, success: string) => {
    setBusyId(id);
    try { await action(); flash({ type: 'success', text: success }); }
    catch (err) { flash({ type: 'error', text: friendlyError(err, 'Course quick action', 'That change could not be saved. Please try again.') }); }
    finally { setBusyId(null); }
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';

  return (
    <div className="space-y-6">
      {notice && (
        <div role="status" className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm border ${notice.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-error/10 border-error/30 text-error'}`}>
          {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {notice.text}
        </div>
      )}
      {loadError && <div role="alert" className="bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm">{loadError}</div>}

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
          <span>Loading courses…</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Training Courses Found</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Course" above to offer mentorship or training masterclasses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course, idx) => (
            <div key={course.id} className={`bg-surface-container-low rounded-xl p-5 border hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between ${course.is_active === false ? 'border-dashed border-amber-500/50 opacity-80' : 'border-outline-variant/30'}`}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    {course.image && <img src={course.image} alt="" className="w-14 h-14 rounded-lg object-cover border border-outline-variant/30 shrink-0" />}
                    <div>
                      <h3 className="font-semibold text-lg text-on-surface">{course.title}</h3>
                      <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${course.is_active === false ? 'bg-amber-500/90 text-black' : 'bg-emerald-500/90 text-white'}`}>
                        {course.is_active === false ? <EyeOff size={10} /> : <Eye size={10} />} {course.is_active === false ? 'Hidden' : 'Published'}
                      </span>
                    </div>
                  </div>
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
                  aria-label={`Edit ${course.title}`}
                >
                  <Edit3 size={15} />
                </button>
                <button onClick={() => quick(course.id, () => move(course.id, -1), 'Order updated.')} disabled={busyId === course.id || idx === 0} className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary disabled:opacity-30 cursor-pointer" aria-label={`Move ${course.title} earlier`}><ArrowUp size={15} /></button>
                <button onClick={() => quick(course.id, () => move(course.id, 1), 'Order updated.')} disabled={busyId === course.id || idx === courses.length - 1} className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary disabled:opacity-30 cursor-pointer" aria-label={`Move ${course.title} later`}><ArrowDown size={15} /></button>
                <button
                  onClick={() => quick(course.id, () => update(course.id, { is_active: course.is_active === false }), course.is_active === false ? 'Course published.' : 'Course hidden from the website.')}
                  disabled={busyId === course.id}
                  className="px-2 py-1 rounded-md text-xs font-semibold border border-outline-variant/40 text-on-surface-variant hover:text-on-surface cursor-pointer disabled:opacity-40"
                >
                  {course.is_active === false ? 'Publish' : 'Hide'}
                </button>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer ml-auto"
                  title="Delete Course"
                  aria-label={`Delete ${course.title}`}
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

            {formError && <div role="alert" className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-sm">{formError}</div>}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="course-fee" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Fee / price label</label>
                  <input id="course-fee" type="text" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="e.g. £450 or Contact for details" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="course-mode" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Mode</label>
                  <input id="course-mode" type="text" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} placeholder="Online & In-person" className={inputClass} />
                </div>
              </div>

              <div>
                <label htmlFor="course-tools" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Tools covered (comma separated)</label>
                <input id="course-tools" type="text" value={form.tools} onChange={e => setForm({ ...form, tools: e.target.value })} placeholder="Lightroom, Photoshop, Premiere Pro" className={inputClass} />
              </div>

              <div>
                <span className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Course image</span>
                <div className="flex items-center gap-3">
                  {form.image ? <img src={form.image} alt="Course" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/30" /> : <div className="w-16 h-16 rounded-lg border border-dashed border-outline-variant/40" />}
                  <label className={`text-sm text-tertiary font-semibold flex items-center gap-1.5 ${imageStorage.uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:underline'}`}>
                    {imageStorage.uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {imageStorage.uploading ? 'Uploading…' : 'Upload image'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} className="hidden" />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-on-surface cursor-pointer">
                <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="accent-tertiary w-4 h-4" />
                Published (visible on the Training page)
              </label>
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
                disabled={saving || imageStorage.uploading || !form.title.trim()}
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

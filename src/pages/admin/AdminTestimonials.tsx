import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X, CheckCircle2, Loader2, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { friendlyError } from '../../lib/adminErrors';
import { useTestimonialsAdmin } from '../../hooks/useTestimonials';

export default function AdminTestimonials() {
  const { testimonials: items, loading, loadError, create, update, remove, move } = useTestimonialsAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    review: '',
    service: '',
    date: '2026',
    rating: 5,
    approved: true,
  });

  const handleEdit = (t: any) => {
    setEditing(t);
    setForm({
      name: t.client_name || t.name || '',
      review: t.testimonial || t.review || '',
      service: t.service || '',
      date: t.date || '2026',
      rating: t.rating || 5,
      approved: t.is_approved ?? t.approved ?? true,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!form.name.trim()) {
      setFormError('Please provide a client or couple name.');
      return;
    }
    if (!form.review.trim()) {
      setFormError('Please enter the client review text.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        client_name: form.name.trim(),
        testimonial: form.review.trim(),
        service: form.service.trim() || 'Wedding Photography',
        date: form.date.trim() || new Date().getFullYear().toString(),
        rating: form.rating,
        is_approved: form.approved,
        display_order: editing?.display_order ?? (items.length + 1),
      };

      if (editing) {
        await update(editing.id, payload);
        setSuccessMsg('Your changes have been saved.');
      } else {
        await create(payload);
        setSuccessMsg('Testimonial added.');
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      resetForm();
    } catch (err: any) {
      setFormError(friendlyError(err, 'Save testimonial', 'Your changes could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await remove(id);
        setSuccessMsg('Testimonial removed.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        alert(friendlyError(err, 'Delete testimonial', 'This testimonial could not be deleted. Please try again.'));
      }
    }
  };

  const toggleApproval = async (t: any) => {
    try {
      const current = t.is_approved ?? t.approved ?? false;
      await update(t.id, { is_approved: !current });
      setSuccessMsg(`Testimonial ${!current ? 'approved for public display' : 'set to pending review'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Toggle approval failed:', err);
      alert(friendlyError(err, 'Approve testimonial', 'That change could not be saved. Please try again.'));
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
    setForm({ name: '', review: '', service: '', date: '2026', rating: 5, approved: true });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm">{loadError}</div>}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}


      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Client Reviews & Testimonials</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage verified testimonials, couple recommendations, and star ratings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading testimonials…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Client Reviews Yet</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Testimonial" above to publish verified client testimonials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((t, idx) => {
            const isApproved = t.is_approved ?? t.approved ?? false;
            const reviewName = t.client_name || t.name || 'Client';
            const reviewText = t.testimonial || t.review || '';

            return (
              <div key={t.id} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating || 5 }).map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" className="text-tertiary" />
                      ))}
                    </div>
                    <button
                      onClick={() => toggleApproval(t)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      <CheckCircle2 size={11} /> {isApproved ? 'Approved & Public' : 'Pending Review'}
                    </button>
                  </div>
                  <p className="text-on-surface/90 text-sm italic mb-4 line-clamp-3 leading-relaxed">"{reviewText}"</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{reviewName}</p>
                    <p className="text-tertiary font-medium text-xs mt-0.5">{t.service} &middot; {t.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Edit Review"
                      aria-label={`Edit review from ${reviewName}`}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => move(t.id, -1).catch(err => alert(friendlyError(err, 'Reorder testimonials', 'The order could not be saved.')))}
                      disabled={idx === 0}
                      className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary disabled:opacity-30 cursor-pointer"
                      aria-label={`Move review from ${reviewName} earlier`}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      onClick={() => move(t.id, 1).catch(err => alert(friendlyError(err, 'Reorder testimonials', 'The order could not be saved.')))}
                      disabled={idx === items.length - 1}
                      className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary disabled:opacity-30 cursor-pointer"
                      aria-label={`Move review from ${reviewName} later`}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                      title="Delete Review"
                      aria-label={`Delete review from ${reviewName}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Testimonial Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={resetForm}>
          <div className="bg-surface-container-low rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-outline-variant/40 shadow-2xl my-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container/40">
              <h3 className="font-display text-lg font-semibold text-on-surface">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button onClick={resetForm} aria-label="Close modal" className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-error/10 border border-error/30 text-error px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle size={15} className="shrink-0 text-error" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Client / Couple Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Priya & Rahul" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Service Experience</label>
                <input type="text" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="e.g. Destination Wedding" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Review Quote *</label>
                <textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))} rows={4} placeholder="Client statement..." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Date / Year</label>
                  <input type="text" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="e.g. 2026" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5 block">Rating</label>
                  <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className={inputClass}>
                    {[5, 4, 3, 2, 1].map(r => (
                      <option key={r} value={r} className="bg-surface-container text-on-surface font-medium">
                        {'★'.repeat(r)} ({r} Stars)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.review.trim()}
                  className="w-full py-2.5 bg-tertiary text-on-tertiary font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>{editing ? 'Save Changes' : 'Create Testimonial'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

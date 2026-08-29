import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X } from 'lucide-react';
import { testimonials as initialTestimonials } from '../../data/testimonials';
import type { Testimonial } from '../../types';

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>(initialTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: '', review: '', service: '', date: '', rating: 5 });

  const handleEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({ name: t.name, review: t.review, service: t.service, date: t.date, rating: t.rating });
    setShowForm(true);
  };

  const handleSave = () => {
    const data: Testimonial = { id: editing?.id || `testimonial-${Date.now()}`, ...form };
    if (editing) {
      setItems(prev => prev.map(t => t.id === editing.id ? data : t));
    } else {
      setItems(prev => [...prev, data]);
    }
    resetForm();
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ name: '', review: '', service: '', date: '', rating: 5 }); };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Testimonials</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-black text-sm font-semibold rounded-lg hover:bg-brand-gold transition-colors">
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(t => (
          <div key={t.id} className="bg-brand-charcoal rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} size={14} fill="#FF9933" className="text-brand-saffron" />
              ))}
            </div>
            <p className="text-white/70 text-sm italic mb-4 line-clamp-3">"{t.review}"</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-brand-saffron text-xs">{t.service} &middot; {t.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(t)} className="text-white/50 hover:text-brand-saffron"><Edit3 size={14} /></button>
                <button onClick={() => setItems(prev => prev.filter(x => x.id !== t.id))} className="text-white/50 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-brand-charcoal rounded-2xl w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-heading text-lg font-semibold">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h3>
              <button onClick={resetForm} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm text-white/60 mb-1 block">Client Name</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm text-white/60 mb-1 block">Service</label><input type="text" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm text-white/60 mb-1 block">Review</label><textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))} rows={4} className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-white/60 mb-1 block">Date</label><input type="text" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="2026" className={inputClass} /></div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Rating</label>
                  <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} className={inputClass}>
                    {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                  </select>
                </div>
              </div>
              <button onClick={handleSave} className="w-full py-2.5 bg-brand-saffron text-black font-semibold rounded-lg hover:bg-brand-gold transition-colors">
                {editing ? 'Save Changes' : 'Add Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

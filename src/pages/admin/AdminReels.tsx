import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X, ExternalLink } from 'lucide-react';
import { instagramReels } from '../../data/reels';
import type { InstagramReel } from '../../types';

export default function AdminReels() {
  const [reels, setReels] = useState<InstagramReel[]>(instagramReels);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InstagramReel | null>(null);
  const [form, setForm] = useState({ title: '', thumbnail: '', url: '', featured: true });

  const handleEdit = (r: InstagramReel) => {
    setEditing(r);
    setForm({ title: r.title, thumbnail: r.thumbnail, url: r.url, featured: r.featured });
    setShowForm(true);
  };

  const handleSave = () => {
    const data: InstagramReel = { id: editing?.id || `reel-${Date.now()}`, ...form };
    if (editing) {
      setReels(prev => prev.map(r => r.id === editing.id ? data : r));
    } else {
      setReels(prev => [...prev, data]);
    }
    resetForm();
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setForm({ title: '', thumbnail: '', url: '', featured: true }); };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Instagram Reels</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-black text-sm font-semibold rounded-lg hover:bg-brand-gold transition-colors">
          <Plus size={16} /> Add Reel
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {reels.map(reel => (
          <div key={reel.id} className="bg-brand-charcoal rounded-xl overflow-hidden border border-white/5">
            <div className="aspect-[9/16] relative">
              <img src={reel.thumbnail} alt={reel.title} className="w-full h-full object-cover" />
              {reel.featured && (
                <span className="absolute top-2 right-2 bg-brand-saffron text-black p-1 rounded-full">
                  <Star size={10} fill="currentColor" />
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-medium truncate">{reel.title}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <button onClick={() => handleEdit(reel)} className="text-white/50 hover:text-brand-saffron"><Edit3 size={12} /></button>
                <a href={reel.url} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-brand-saffron"><ExternalLink size={12} /></a>
                <button onClick={() => setReels(prev => prev.filter(r => r.id !== reel.id))} className="text-white/50 hover:text-red-400 ml-auto"><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-brand-charcoal rounded-2xl w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-heading text-lg font-semibold">{editing ? 'Edit Reel' : 'Add Reel'}</h3>
              <button onClick={resetForm} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Thumbnail URL</label>
                <input type="url" value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Instagram Reel URL</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
                Featured
              </label>
              <button onClick={handleSave} className="w-full py-2.5 bg-brand-saffron text-black font-semibold rounded-lg hover:bg-brand-gold transition-colors">
                {editing ? 'Save Changes' : 'Add Reel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

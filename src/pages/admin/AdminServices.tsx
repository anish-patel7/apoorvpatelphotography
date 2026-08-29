import { useState } from 'react';
import { Plus, Edit3, Trash2, X } from 'lucide-react';
import { services as initialServices } from '../../data/services';
import type { Service } from '../../types';

export default function AdminServices() {
  const [serviceList, setServiceList] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ title: '', category: 'photography' as Service['category'], description: '', features: '' });

  const handleEdit = (s: Service) => {
    setEditing(s);
    setForm({ title: s.title, category: s.category, description: s.description, features: s.features.join(', ') });
    setShowForm(true);
  };

  const handleSave = () => {
    const data: Service = {
      id: editing?.id || `service-${Date.now()}`,
      title: form.title,
      category: form.category,
      description: form.description,
      icon: 'Camera',
      features: form.features.split(',').map(f => f.trim()).filter(Boolean),
    };
    if (editing) {
      setServiceList(prev => prev.map(s => s.id === editing.id ? data : s));
    } else {
      setServiceList(prev => [...prev, data]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', category: 'photography', description: '', features: '' });
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Services</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-black text-sm font-semibold rounded-lg hover:bg-brand-gold transition-colors">
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="bg-brand-charcoal rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-left border-b border-white/5">
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Features</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {serviceList.map(s => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="font-medium">{s.title}</div>
                  <div className="text-white/40 text-xs mt-0.5 line-clamp-1">{s.description}</div>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2.5 py-1 bg-brand-saffron/10 text-brand-saffron text-xs rounded-full capitalize">{s.category}</span>
                </td>
                <td className="px-5 py-3 text-white/50 text-xs">{s.features.length} features</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(s)} className="text-white/50 hover:text-brand-saffron"><Edit3 size={14} /></button>
                    <button onClick={() => setServiceList(prev => prev.filter(x => x.id !== s.id))} className="text-white/50 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-brand-charcoal rounded-2xl w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-heading text-lg font-semibold">{editing ? 'Edit Service' : 'Add Service'}</h3>
              <button onClick={resetForm} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Service['category'] }))} className={inputClass}>
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="editing">Editing</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Features (comma-separated)</label>
                <input type="text" value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Feature 1, Feature 2, ..." className={inputClass} />
              </div>
              <button onClick={handleSave} className="w-full py-2.5 bg-brand-saffron text-black font-semibold rounded-lg hover:bg-brand-gold transition-colors">
                {editing ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Plus, Edit3, Trash2, X, Loader2 } from 'lucide-react';
import { friendlyError } from '../../lib/adminErrors';
import { useServicesAdmin, type Service } from '../../hooks/useServices';

export default function AdminServices() {
  const { services: serviceList, loading, create, update, remove } = useServicesAdmin();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'photography' as Service['category'],
    description: '',
    features: '',
  });

  const handleEdit = (s: Service) => {
    setEditing(s);
    setForm({
      title: s.title,
      category: s.category,
      description: s.description,
      features: (s.features || []).join(', '),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;

    setSaving(true);
    try {
      const data: Partial<Service> = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        icon: 'Camera',
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
        sort_order: editing ? editing.sort_order : serviceList.length + 1,
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
      alert(friendlyError(err, 'Save service', 'Your changes could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await remove(id);
      } catch (err: any) {
        alert(friendlyError(err, 'Delete service', 'This service could not be deleted. Please try again.'));
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', category: 'photography', description: '', features: '' });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';

  const categoryStyles: Record<string, string> = {
    photography: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    videography: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    multimedia: 'bg-pink-500/15 text-pink-300 border border-pink-500/30',
    design: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    editing: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Services Management</h2>
          <p className="text-on-surface-variant text-sm mt-1">Configure photography, cinematography, and post-production offerings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {loading && serviceList.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading services…</span>
        </div>
      ) : serviceList.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Services Found</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Service" to create your first studio offering.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {serviceList.map(s => (
            <div key={s.id} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base text-on-surface">{s.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${categoryStyles[s.category] || ''}`}>
                    {s.category}
                  </span>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-3">{s.description}</p>
                {s.features && s.features.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {s.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-tertiary" /> {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-4 mt-4 border-t border-outline-variant/20">
                <button
                  onClick={() => handleEdit(s)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer"
                  title="Edit Service"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer ml-auto"
                  title="Delete Service"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface-container-low rounded-2xl max-w-md w-full p-6 border border-outline-variant/30 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-display text-lg font-bold text-on-surface">
                {editing ? 'Edit Service' : 'Add New Service'}
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
                  Service Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Luxury Wedding Photography"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as Service['category'] })}
                  className={inputClass}
                >
                  <option value="photography" className="bg-surface-container">Photography</option>
                  <option value="videography" className="bg-surface-container">Videography</option>
                  <option value="multimedia" className="bg-surface-container">Multimedia Design</option>
                  <option value="design" className="bg-surface-container">Graphic Design</option>
                  <option value="editing" className="bg-surface-container">Editing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Service description and scope..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Features (Comma separated)
                </label>
                <input
                  type="text"
                  value={form.features}
                  onChange={e => setForm({ ...form, features: e.target.value })}
                  placeholder="Full day coverage, High-res images, Drone footage"
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
                  <span>{editing ? 'Update Service' : 'Save Service'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

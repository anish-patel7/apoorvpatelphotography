import { useState } from 'react';
import { Plus, Edit3, Trash2, Eye, Star, X } from 'lucide-react';
import { portfolioProjects, portfolioCategories } from '../../data/portfolio';
import type { PortfolioProject } from '../../types';

export default function AdminPortfolio() {
  const [projects, setProjects] = useState<PortfolioProject[]>(portfolioProjects);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const [form, setForm] = useState({ title: '', category: '', coverImage: '', description: '', date: '', location: '', featured: false });

  const handleEdit = (p: PortfolioProject) => {
    setEditing(p);
    setForm({ title: p.title, category: p.category, coverImage: p.coverImage, description: p.description, date: p.date, location: p.location, featured: p.featured });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editing) {
      setProjects(prev => prev.map(p => p.id === editing.id ? { ...p, ...form, id: p.id, images: p.images } : p));
    } else {
      const newProject: PortfolioProject = { ...form, id: `project-${Date.now()}`, images: [form.coverImage] };
      setProjects(prev => [...prev, newProject]);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const toggleFeatured = (id: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, featured: !p.featured } : p));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ title: '', category: '', coverImage: '', description: '', date: '', location: '', featured: false });
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-saffron/50';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold">Portfolio Projects</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-saffron text-black text-sm font-semibold rounded-lg hover:bg-brand-gold transition-colors">
          <Plus size={16} /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project.id} className="bg-brand-charcoal rounded-xl overflow-hidden border border-white/5">
            <div className="aspect-video relative">
              <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
              {project.featured && (
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-brand-saffron text-black text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star size={10} fill="currentColor" /> Featured
                </span>
              )}
            </div>
            <div className="p-4">
              <span className="text-xs text-brand-saffron font-medium">{project.category}</span>
              <h3 className="font-semibold mt-1 truncate">{project.title}</h3>
              <p className="text-white/50 text-xs mt-0.5">{project.location} &middot; {project.date}</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                <button onClick={() => handleEdit(project)} className="text-white/50 hover:text-brand-saffron" title="Edit"><Edit3 size={14} /></button>
                <button onClick={() => toggleFeatured(project.id)} className={`${project.featured ? 'text-brand-saffron' : 'text-white/50'} hover:text-brand-saffron`} title="Toggle featured"><Star size={14} /></button>
                <button onClick={() => handleDelete(project.id)} className="text-white/50 hover:text-red-400 ml-auto" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-brand-charcoal rounded-2xl w-full max-w-lg border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-heading text-lg font-semibold">{editing ? 'Edit Project' : 'Add Project'}</h3>
              <button onClick={resetForm} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Project title" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
                    <option value="">Select</option>
                    {portfolioCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Date</label>
                  <input type="text" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} placeholder="e.g. 2026" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Cover Image URL</label>
                <input type="url" value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Location</label>
                <input type="text" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Project description" className={inputClass} />
              </div>
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="rounded" />
                Featured project
              </label>
              <button onClick={handleSave} className="w-full py-2.5 bg-brand-saffron text-black font-semibold rounded-lg hover:bg-brand-gold transition-colors">
                {editing ? 'Save Changes' : 'Add Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

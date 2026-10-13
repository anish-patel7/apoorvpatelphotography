import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X, AlertTriangle, ExternalLink, Play, Upload, Loader2, Database } from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import { portfolioCategories } from '../../data/portfolio';
import { isValidInstagramUrl, cleanInstagramUrl } from '../../utils/instagram';
import { usePortfolioAdmin, type Project } from '../../hooks/usePortfolio';
import { useStorage } from '../../hooks/useStorage';
import type { InstagramContentType } from '../../types';

export default function AdminPortfolio() {
  const { projects, loading, create, update, remove } = usePortfolioAdmin();
  const { upload, uploading } = useStorage('portfolio-images');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: '',
    coverImage: '',
    description: '',
    date: '',
    location: '',
    featured: false,
    isRealWork: false,
    instagramUrl: '',
    contentType: 'photo' as InstagramContentType,
    galleryImagesText: '',
  });

  const handleEdit = (p: Project) => {
    setEditing(p);
    setForm({
      title: p.title,
      category: p.category,
      coverImage: p.cover_image || p.cover_image_url || '',
      description: p.description,
      date: p.event_date || p.date || '',
      location: p.location,
      featured: p.is_featured ?? p.featured ?? false,
      isRealWork: !!p.is_real_work,
      instagramUrl: p.instagram_url || p.video_url || p.reel_url || '',
      contentType: (p.content_type || 'photo') as InstagramContentType,
      galleryImagesText: (p.images || []).join('\n'),
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await upload(file);
    if (uploadedUrl) {
      setForm(prev => ({ ...prev, coverImage: uploadedUrl }));
    } else {
      setFormError('Failed to upload image to Supabase storage. Check file format or network.');
    }
  };

  const handleSave = async () => {
    setFormError(null);

    // Validation checks
    if (!form.title.trim()) {
      setFormError('Please enter a project title.');
      return;
    }
    if (!form.category.trim()) {
      setFormError('Please select a category.');
      return;
    }
    if (!form.coverImage.trim()) {
      setFormError('A cover image thumbnail URL is required. Please upload an image or provide a valid path.');
      return;
    }

    if (form.instagramUrl.trim()) {
      if (!isValidInstagramUrl(form.instagramUrl.trim())) {
        setFormError('Invalid Instagram URL. Please provide a valid link from instagram.com (e.g., https://www.instagram.com/p/... or /reel/...).');
        return;
      }
    }

    const cleanedInsta = form.instagramUrl.trim() ? cleanInstagramUrl(form.instagramUrl.trim()) : undefined;
    const parsedImages = form.galleryImagesText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const imagesArray = parsedImages.length > 0 ? parsedImages : [form.coverImage.trim()];

    setSaving(true);
    try {
      const payload: Partial<Project> = {
        title: form.title.trim(),
        category: form.category,
        cover_image: form.coverImage.trim(),
        cover_image_url: form.coverImage.trim(),
        images: imagesArray,
        instagram_url: cleanedInsta || null,
        video_url: form.contentType === 'reel' ? cleanedInsta || null : null,
        reel_url: form.contentType === 'reel' ? cleanedInsta || null : null,
        content_type: form.contentType,
        description: form.description.trim(),
        date: form.date.trim() || '2026',
        event_date: form.date.trim() || '2026',
        location: form.location.trim() || 'Gujarat, India',
        featured: form.featured,
        is_featured: form.featured,
        is_real_work: form.isRealWork,
        is_published: true,
      };

      if (editing) {
        await update(editing.id, payload);
      } else {
        await create(payload);
      }
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save project to Supabase database.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio project from PostgreSQL?')) {
      try {
        await remove(id);
      } catch (err: any) {
        alert(err?.message || 'Delete operation failed.');
      }
    }
  };

  const toggleFeatured = async (project: Project) => {
    try {
      await update(project.id, { is_featured: !project.is_featured, featured: !project.featured });
    } catch (err: any) {
      console.error('Toggle featured failed:', err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
    setForm({
      title: '',
      category: '',
      coverImage: '',
      description: '',
      date: '',
      location: '',
      featured: false,
      isRealWork: false,
      instagramUrl: '',
      contentType: 'photo',
      galleryImagesText: '',
    });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const isInstaUrlValid = !form.instagramUrl.trim() || isValidInstagramUrl(form.instagramUrl.trim());

  return (
    <div className="space-y-6">
      {/* Database persistence status banner */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          <Database size={15} className="text-tertiary shrink-0" />
          <span><strong>PostgreSQL Database Connected:</strong> Real-time persistence via Supabase <code className="text-tertiary font-mono">portfolio_projects</code> and storage bucket <code className="text-tertiary font-mono">portfolio-images</code>.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Portfolio Projects</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage showcased photography collections, Instagram posts, and reels</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading projects from database...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Portfolio Projects Found</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Project" above to create your first portfolio collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => {
            const hasInsta = !!(project.instagram_url || project.video_url || project.reel_url);
            const isReel = project.content_type === 'reel';

            return (
              <div key={project.id} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs">
                <div className="aspect-video relative bg-surface-container-lowest">
                  <img src={project.cover_image || project.cover_image_url} alt={project.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    {project.is_real_work && (
                      <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md text-emerald-400 text-[10px] font-semibold rounded-full flex items-center gap-1 border border-emerald-500/40 shadow-xs">
                        Real Work
                      </span>
                    )}
                    {project.is_featured && (
                      <span className="px-2.5 py-0.5 bg-tertiary text-on-tertiary text-xs font-semibold rounded-full flex items-center gap-1 shadow-xs">
                        <Star size={11} fill="currentColor" /> Featured
                      </span>
                    )}
                    {isReel && (
                      <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <Play size={10} fill="currentColor" /> Reel
                      </span>
                    )}
                    {hasInsta && !isReel && (
                      <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-semibold rounded-full flex items-center gap-1">
                        <InstagramIcon size={10} /> Instagram
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <span className="inline-block text-xs font-semibold uppercase tracking-wider text-tertiary">{project.category}</span>
                  <h3 className="font-semibold text-base text-on-surface truncate">{project.title}</h3>
                  <p className="text-on-surface-variant text-xs">{project.location} &middot; {project.event_date || project.date}</p>
                  <div className="flex items-center gap-2 pt-3 border-t border-outline-variant/20">
                    <button
                      onClick={() => handleEdit(project)}
                      className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Edit Project"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => toggleFeatured(project)}
                      className={`p-1.5 rounded-md ${project.is_featured ? 'text-tertiary' : 'text-on-surface-variant'} hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer`}
                      title="Toggle Featured"
                    >
                      <Star size={15} fill={project.is_featured ? 'currentColor' : 'none'} />
                    </button>
                    {hasInsta && (
                      <a
                        href={project.instagram_url || project.video_url || project.reel_url || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors"
                        title="Open Instagram Link"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer ml-auto"
                      title="Delete Project"
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

      {/* Project Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface-container-low rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-outline-variant/30 space-y-6 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
              <h3 className="font-display text-xl font-bold text-on-surface">
                {editing ? 'Edit Portfolio Project' : 'Create New Portfolio Project'}
              </h3>
              <button
                onClick={resetForm}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Royal Heritage Wedding"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="" className="bg-surface-container">Select Category...</option>
                  {portfolioCategories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c} className="bg-surface-container">{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Event Date
                </label>
                <input
                  type="text"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  placeholder="2026 or Dec 2026"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Ahmedabad, Gujarat"
                  className={inputClass}
                />
              </div>

              {/* Cover Image URL + Storage Upload */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Cover Image Thumbnail URL *
                  </label>
                  <label className="text-xs text-tertiary hover:underline cursor-pointer flex items-center gap-1">
                    <Upload size={12} />
                    <span>{uploading ? 'Uploading...' : 'Upload from Device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={form.coverImage}
                  onChange={e => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="/images/real_work_dzvz4ssjoss.jpg or storage URL"
                  className={inputClass}
                />
              </div>

              {/* Instagram URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Instagram Post or Reel URL (Optional)
                </label>
                <input
                  type="text"
                  value={form.instagramUrl}
                  onChange={e => setForm({ ...form, instagramUrl: e.target.value })}
                  placeholder="https://www.instagram.com/p/DZVZ4sSjOss/"
                  className={inputClass}
                />
                {!isInstaUrlValid && (
                  <p className="text-[11px] text-error mt-1">Please enter a valid Instagram URL (e.g. instagram.com/p/... or /reel/...)</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Content Type
                </label>
                <select
                  value={form.contentType}
                  onChange={e => setForm({ ...form, contentType: e.target.value as InstagramContentType })}
                  className={inputClass}
                >
                  <option value="photo" className="bg-surface-container">Single Photo</option>
                  <option value="post" className="bg-surface-container">Instagram Post</option>
                  <option value="carousel" className="bg-surface-container">Carousel Album</option>
                  <option value="reel" className="bg-surface-container">Instagram Reel</option>
                </select>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="accent-tertiary"
                  />
                  <span>Featured Project</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                  <input
                    type="checkbox"
                    checked={form.isRealWork}
                    onChange={e => setForm({ ...form, isRealWork: e.target.checked })}
                    className="accent-tertiary"
                  />
                  <span>Authentic Client Work</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Project overview, artistic vision, and camera details..."
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Additional Gallery Images (One URL per line)
                </label>
                <textarea
                  rows={3}
                  value={form.galleryImagesText}
                  onChange={e => setForm({ ...form, galleryImagesText: e.target.value })}
                  placeholder="https://.../photo-1.jpg&#10;https://.../photo-2.jpg"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isInstaUrlValid}
                className="px-5 py-2.5 rounded-lg bg-tertiary text-on-tertiary text-sm font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <span>{editing ? 'Update Project' : 'Save Project'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

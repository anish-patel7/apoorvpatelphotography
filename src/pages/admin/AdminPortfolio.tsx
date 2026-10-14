import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X, AlertTriangle, Upload, Loader2, Database, CheckCircle2, Image as ImageIcon, Camera, Sparkles } from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import { portfolioCategories } from '../../data/portfolio';
import { isValidInstagramUrl, cleanInstagramUrl } from '../../utils/instagram';
import { usePortfolioAdmin, type Project } from '../../hooks/usePortfolio';
import { useStorage } from '../../hooks/useStorage';
import type { InstagramContentType } from '../../types';
import {
  detectVideoDimensions,
  detectImageDimensions,
  type VideoOrientation,
} from '../../utils/videoOrientation';

export default function AdminPortfolio() {
  const { projects, loading, create, update, remove } = usePortfolioAdmin();
  const { upload, uploading } = useStorage('portfolio-images');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detectingVideo, setDetectingVideo] = useState(false);

  // Simplified Form State with Orientation Metadata
  const [mediaType, setMediaType] = useState<'image' | 'instagram'>('image');
  const [form, setForm] = useState<{
    title: string;
    category: string;
    coverImage: string;
    instagramUrl: string;
    description: string;
    featured: boolean;
    video_width: number | null;
    video_height: number | null;
    aspect_ratio: number | null;
    orientation: VideoOrientation;
    detectedNote: string | null;
  }>({
    title: '',
    category: 'Wedding',
    coverImage: '',
    instagramUrl: '',
    description: '',
    featured: false,
    video_width: null,
    video_height: null,
    aspect_ratio: null,
    orientation: 'landscape',
    detectedNote: null,
  });

  const handleEdit = (p: Project) => {
    setEditing(p);
    const hasInsta = Boolean(p.instagram_url || p.video_url || p.reel_url);
    const orientation: VideoOrientation = p.orientation || (p.reel_url ? 'portrait' : 'landscape');

    setMediaType(hasInsta ? 'instagram' : 'image');
    setForm({
      title: p.title || '',
      category: p.category || 'Wedding',
      coverImage: p.cover_image || p.cover_image_url || '',
      instagramUrl: p.instagram_url || p.video_url || p.reel_url || '',
      description: p.description || '',
      featured: p.is_featured ?? p.featured ?? false,
      video_width: p.video_width || null,
      video_height: p.video_height || null,
      aspect_ratio: p.aspect_ratio || null,
      orientation,
      detectedNote: p.video_width && p.video_height ? `Dimensions: ${p.video_width} × ${p.video_height} (${orientation})` : null,
    });
    setFormError(null);
    setShowForm(true);
  };

  /**
   * Automatic file dimension and orientation detection
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);

    // If uploading a video file, read actual dimensions via loadedmetadata
    if (file.type.startsWith('video/')) {
      setDetectingVideo(true);
      try {
        const dims = await detectVideoDimensions(file);
        setForm(prev => ({
          ...prev,
          video_width: dims.video_width,
          video_height: dims.video_height,
          aspect_ratio: dims.aspect_ratio,
          orientation: dims.orientation,
          detectedNote: `✓ Detected Video: ${dims.video_width} × ${dims.video_height} (${dims.aspect_ratio_label} • ${dims.orientation.toUpperCase()})`,
        }));
      } catch (err) {
        console.warn('Video dimension read failed:', err);
      } finally {
        setDetectingVideo(false);
      }
    } else if (file.type.startsWith('image/')) {
      // If uploading an image, inspect dimensions as a hint
      try {
        const imgDims = await detectImageDimensions(file);
        setForm(prev => ({
          ...prev,
          video_width: imgDims.width,
          video_height: imgDims.height,
          aspect_ratio: Number((imgDims.width / imgDims.height).toFixed(2)),
          orientation: imgDims.orientation,
          detectedNote: `✓ Detected Image: ${imgDims.width} × ${imgDims.height} (${imgDims.label})`,
        }));
      } catch {
        // ignore
      }
    }

    const uploadedUrl = await upload(file);
    if (uploadedUrl) {
      setForm(prev => ({ ...prev, coverImage: uploadedUrl }));
    } else {
      setFormError('Failed to upload file. Please check file format or network.');
    }
  };

  const handleSave = async () => {
    setFormError(null);

    // 1. Required: Project Title
    if (!form.title.trim()) {
      setFormError('Please enter a project title.');
      return;
    }

    // 2. Required: Category
    if (!form.category.trim()) {
      setFormError('Please select a category.');
      return;
    }

    // 3. Required: At least one uploaded image/video OR a valid Instagram post/reel URL with a cover image
    if (mediaType === 'image') {
      if (!form.coverImage.trim()) {
        setFormError('Please upload at least one image/video or provide a URL.');
        return;
      }
    } else {
      // Instagram mode
      if (!form.instagramUrl.trim()) {
        setFormError('Please provide an Instagram post or reel URL.');
        return;
      }
      if (!isValidInstagramUrl(form.instagramUrl.trim())) {
        setFormError('Please provide a valid Instagram post or reel link (e.g. https://www.instagram.com/p/... or /reel/...).');
        return;
      }
      if (!form.coverImage.trim()) {
        setFormError('Please provide or upload a cover image thumbnail for this Instagram post/reel.');
        return;
      }
    }

    const cleanedInsta = form.instagramUrl.trim() ? cleanInstagramUrl(form.instagramUrl.trim()) : null;
    const isReel = cleanedInsta ? cleanedInsta.includes('/reel/') : false;
    const finalContentType: InstagramContentType = cleanedInsta ? (isReel ? 'reel' : 'post') : 'photo';
    const autoSlug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'portfolio-project';

    setSaving(true);
    try {
      const payload: Partial<Project> = {
        title: form.title.trim(),
        slug: editing?.slug || autoSlug,
        category: form.category,
        cover_image: form.coverImage.trim(),
        cover_image_url: form.coverImage.trim(),
        images: [form.coverImage.trim()],
        instagram_url: cleanedInsta,
        video_url: isReel ? cleanedInsta : null,
        reel_url: isReel ? cleanedInsta : null,
        content_type: finalContentType,
        description: form.description.trim(),
        date: editing?.date || new Date().getFullYear().toString(),
        event_date: editing?.event_date || new Date().getFullYear().toString(),
        location: editing?.location || 'United Kingdom',
        featured: form.featured,
        is_featured: form.featured,
        is_real_work: true,
        is_published: true,
        video_width: form.video_width ?? undefined,
        video_height: form.video_height ?? undefined,
        aspect_ratio: form.aspect_ratio ?? undefined,
        orientation: form.orientation,
      };

      if (editing) {
        await update(editing.id, payload);
        setSuccessMsg('Portfolio project updated successfully.');
      } else {
        await create(payload);
        setSuccessMsg('New portfolio project created and published live to website.');
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      resetForm();
    } catch (err: any) {
      console.error('Portfolio save failed:', err);
      setFormError(err?.message || 'Failed to save portfolio project to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio project?')) {
      try {
        await remove(id);
        setSuccessMsg('Project removed from database.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        alert(err?.message || 'Delete operation failed.');
      }
    }
  };

  const toggleFeatured = async (p: Project) => {
    try {
      const current = p.is_featured ?? p.featured ?? false;
      await update(p.id, {
        is_featured: !current,
      });
      setSuccessMsg(`Project ${!current ? 'marked as featured' : 'removed from featured'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Toggle featured failed:', err);
      alert(err?.message || 'Failed to update featured status.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
    setMediaType('image');
    setForm({
      title: '',
      category: 'Wedding',
      coverImage: '',
      instagramUrl: '',
      description: '',
      featured: false,
      video_width: null,
      video_height: null,
      aspect_ratio: null,
      orientation: 'landscape',
      detectedNote: null,
    });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const isInstaValid = !form.instagramUrl.trim() || isValidInstagramUrl(form.instagramUrl.trim());

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm animate-in fade-in shadow-xs">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Database connection banner */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          <Database size={15} className="text-tertiary shrink-0" />
          <span><strong>PostgreSQL Database Connected:</strong> Real-time persistence via Supabase <code className="text-tertiary font-mono">portfolio_projects</code> table with automatic orientation metadata.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Camera size={22} className="text-tertiary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Portfolio Projects</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Manage showcased client galleries, wedding stories, and editorial portraits</p>
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
          <span>Loading portfolio projects from database...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Portfolio Projects Found</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Project" above to publish your first client story.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {projects.map(p => {
            const cover = p.cover_image || p.cover_image_url || '/images/real_work_dzvz4ssjoss.jpg';
            const isFeatured = p.is_featured ?? p.featured ?? false;
            const hasInsta = Boolean(p.instagram_url || p.video_url || p.reel_url);
            const orientation = p.orientation || (p.reel_url ? 'portrait' : 'landscape');

            return (
              <div key={p.id} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between">
                <div className="aspect-[4/3] relative bg-surface-container-lowest overflow-hidden">
                  <img src={cover} alt={p.title} className="w-full h-full object-cover" />
                  
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
                      {p.category}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-black/80 backdrop-blur-xs text-tertiary border border-tertiary/30 w-fit">
                      {orientation}
                    </span>
                  </div>

                  {isFeatured && (
                    <span className="absolute top-2 right-2 bg-tertiary text-on-tertiary p-1.5 rounded-full shadow-xs" title="Featured Project">
                      <Star size={12} fill="currentColor" />
                    </span>
                  )}
                  {hasInsta && (
                    <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white p-1 rounded-md" title="Linked to Instagram">
                      <InstagramIcon size={12} />
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-display font-semibold text-base text-on-surface truncate" title={p.title}>
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-on-surface-variant line-clamp-2 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                    <button
                      onClick={() => toggleFeatured(p)}
                      className={`flex items-center gap-1 text-xs font-medium cursor-pointer ${isFeatured ? 'text-tertiary' : 'text-on-surface-variant hover:text-on-surface'}`}
                      title="Toggle Featured"
                    >
                      <Star size={14} fill={isFeatured ? 'currentColor' : 'none'} />
                      <span>{isFeatured ? 'Featured' : 'Standard'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simplified Portfolio Upload Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={resetForm}>
          <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-outline-variant/30 space-y-5 my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  {editing ? 'Edit Portfolio Project' : 'Add Portfolio Project'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Quick upload form with automatic video/image orientation detection</p>
              </div>
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

            <div className="space-y-4">
              {/* 1. Project Title * (Required) */}
              <div>
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

              {/* 2. Category * (Required) */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  {portfolioCategories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c} className="bg-surface-container text-on-surface">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Media Mode Selection Tabs */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Project Media *
                  </label>
                  <div className="flex rounded-lg bg-surface-container-lowest p-0.5 border border-outline-variant/30 text-xs">
                    <button
                      type="button"
                      onClick={() => setMediaType('image')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        mediaType === 'image'
                          ? 'bg-tertiary text-on-tertiary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <ImageIcon size={13} />
                      <span>Upload Media</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaType('instagram')}
                      className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        mediaType === 'instagram'
                          ? 'bg-tertiary text-on-tertiary shadow-xs'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <InstagramIcon size={13} />
                      <span>Instagram Link</span>
                    </button>
                  </div>
                </div>

                {mediaType === 'image' ? (
                  /* Option A: Uploaded Image or Video Mode */
                  <div className="space-y-2.5 p-3.5 bg-surface-container-lowest/60 rounded-xl border border-outline-variant/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-on-surface">Image or Video File *</span>
                      <label className="text-xs text-tertiary font-semibold hover:underline cursor-pointer flex items-center gap-1">
                        <Upload size={12} />
                        <span>{detectingVideo ? 'Detecting...' : uploading ? 'Uploading...' : 'Browse File'}</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleFileUpload}
                          disabled={uploading || detectingVideo}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {form.detectedNote && (
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                        <Sparkles size={13} className="text-emerald-500 shrink-0" />
                        <span className="font-medium">{form.detectedNote}</span>
                      </div>
                    )}

                    <input
                      type="text"
                      value={form.coverImage}
                      onChange={e => setForm({ ...form, coverImage: e.target.value })}
                      placeholder="Paste media URL or click Browse above"
                      className={inputClass}
                    />

                    {form.coverImage && (
                      <div className="relative aspect-video max-h-36 rounded-lg overflow-hidden border border-outline-variant/30 mt-2 bg-black">
                        {form.coverImage.match(/\.(mp4|mov|webm|ogg)($|\?)/i) || form.coverImage.startsWith('blob:') ? (
                          <video src={form.coverImage} controls className="w-full h-full object-contain" />
                        ) : (
                          <img src={form.coverImage} alt="Preview" className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, coverImage: '', detectedNote: null }))}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
                          title="Remove media"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Option B: Instagram Post / Reel Mode */
                  <div className="space-y-3 p-3.5 bg-surface-container-lowest/60 rounded-xl border border-outline-variant/30">
                    <div>
                      <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                        Instagram Post or Reel URL *
                      </label>
                      <input
                        type="text"
                        value={form.instagramUrl}
                        onChange={e => {
                          const val = e.target.value;
                          const isReel = val.includes('/reel/');
                          setForm({
                            ...form,
                            instagramUrl: val,
                            orientation: isReel ? 'portrait' : form.orientation,
                          });
                        }}
                        placeholder="https://www.instagram.com/p/... or /reel/..."
                        className={inputClass}
                      />
                      {!isInstaValid && (
                        <p className="text-[11px] text-error mt-1">Please provide a valid Instagram post or reel link.</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-on-surface-variant">
                          Cover Image Thumbnail *
                        </label>
                        <label className="text-xs text-tertiary font-semibold hover:underline cursor-pointer flex items-center gap-1">
                          <Upload size={12} />
                          <span>{uploading ? 'Uploading...' : 'Upload Cover'}</span>
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
                        placeholder="/images/real_work_dzvz4ssjoss.jpg or upload"
                        className={inputClass}
                      />
                    </div>

                    {/* Orientation Selector for Instagram link */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                          Video / Post Orientation
                        </label>
                        <span className="text-[11px] text-tertiary font-semibold capitalize">
                          {form.orientation}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['portrait', 'landscape', 'square'] as VideoOrientation[]).map(o => (
                          <button
                            key={o}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, orientation: o }))}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                              form.orientation === o
                                ? 'bg-tertiary text-on-tertiary border-tertiary shadow-xs'
                                : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            <span>{o}</span>
                            <span className="text-[10px] opacity-80">{o === 'portrait' ? '9:16' : o === 'landscape' ? '16:9' : '1:1'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Description (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Description <span className="text-on-surface-variant/60 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief story, mood, or context..."
                  className={inputClass}
                />
              </div>

              {/* Featured toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="accent-tertiary"
                  />
                  <span>Feature this project on homepage</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
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
                disabled={saving || !form.title.trim() || !isInstaValid}
                className="px-5 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving to Supabase...</span>
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

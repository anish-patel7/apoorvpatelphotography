import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X, ExternalLink, AlertTriangle, Upload, Loader2, Database, CheckCircle2, Eye, EyeOff, Video as VideoIcon, Sparkles } from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import { isValidInstagramUrl, cleanInstagramUrl, extractInstagramId } from '../../utils/instagram';
import { useReelsAdmin } from '../../hooks/useReels';
import { useStorage } from '../../hooks/useStorage';
import {
  detectVideoDimensions,
  detectImageDimensions,
  getAspectRatioLabel,
  getVideoContainerAspectClass,
  type VideoOrientation,
} from '../../utils/videoOrientation';

function generateReelId(extractedId: string | null, existingIds: string[]): string {
  if (extractedId && !existingIds.includes(extractedId)) {
    return extractedId;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `reel_${Math.random().toString(36).slice(2, 11)}`;
}

export default function AdminReels() {
  const { reels, loading, create, update, remove } = useReelsAdmin();
  const { upload, uploading } = useStorage('reel-thumbnails');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Form State including orientation metadata
  const [form, setForm] = useState<{
    title: string;
    thumbnail: string;
    url: string;
    featured: boolean;
    published: boolean;
    video_width: number | null;
    video_height: number | null;
    aspect_ratio: number | null;
    orientation: VideoOrientation;
    aspect_ratio_label: string;
    detectedNote: string | null;
    thumbnailHint: { width: number; height: number; orientation: VideoOrientation; label: string } | null;
  }>({
    title: '',
    thumbnail: '',
    url: '',
    featured: true,
    published: true,
    video_width: null,
    video_height: null,
    aspect_ratio: null,
    orientation: 'portrait',
    aspect_ratio_label: '9:16',
    detectedNote: null,
    thumbnailHint: null,
  });

  const handleEdit = (r: any) => {
    setEditing(r);
    const orientation: VideoOrientation = r.orientation || 'portrait';
    const width = r.video_width || null;
    const height = r.video_height || null;
    const label = width && height ? getAspectRatioLabel(width, height, orientation) : orientation === 'portrait' ? '9:16' : orientation === 'landscape' ? '16:9' : '1:1';

    setForm({
      title: r.title || '',
      thumbnail: r.thumbnail_url || r.thumbnail || '',
      url: r.instagram_url || r.url || '',
      featured: r.is_featured ?? r.featured ?? true,
      published: r.status !== 'incomplete',
      video_width: width,
      video_height: height,
      aspect_ratio: r.aspect_ratio || null,
      orientation,
      aspect_ratio_label: label,
      detectedNote: width && height ? `Saved dimensions: ${width} × ${height} (${label})` : null,
      thumbnailHint: null,
    });
    setFormError(null);
    setShowForm(true);
  };

  /**
   * Automatic video file selection and dimension detection
   * Reads videoWidth and videoHeight from HTMLVideoElement on loadedmetadata
   * Classifies orientation without requiring manual user selection.
   */
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setFormError(null);

    try {
      // 1. Read actual dimensions from HTMLVideoElement
      const dims = await detectVideoDimensions(file);

      // 2. Upload file to Supabase storage
      const uploadedUrl = await upload(file);
      const finalUrl = uploadedUrl || URL.createObjectURL(file);

      // 3. Automatically populate orientation & dimensions - NO manual selection required
      setForm(prev => ({
        ...prev,
        url: finalUrl,
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        video_width: dims.video_width,
        video_height: dims.video_height,
        aspect_ratio: dims.aspect_ratio,
        orientation: dims.orientation,
        aspect_ratio_label: dims.aspect_ratio_label,
        detectedNote: `✓ Auto-detected Video: ${dims.video_width} × ${dims.video_height} (${dims.aspect_ratio_label} • ${dims.orientation.toUpperCase()})`,
      }));
    } catch (err: any) {
      console.error('Video dimension detection failed:', err);
      setFormError('Could not read video metadata. Please verify the video file format.');
    } finally {
      setUploadingVideo(false);
    }
  };

  /**
   * Thumbnail upload with preview hint detection
   * Does NOT treat thumbnail dimensions as strict proof of video orientation
   */
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect thumbnail dimensions as a preview hint
    try {
      const hint = await detectImageDimensions(file);
      setForm(prev => ({ ...prev, thumbnailHint: hint }));
    } catch {
      // Ignore hint error
    }

    const uploadedUrl = await upload(file);
    if (uploadedUrl) {
      setForm(prev => ({ ...prev, thumbnail: uploadedUrl }));
    } else {
      setFormError('Failed to upload thumbnail image. Check file format or network.');
    }
  };

  const handleSave = async () => {
    setFormError(null);

    const trimmedUrl = form.url.trim();
    if (!trimmedUrl) {
      setFormError('Please enter an Instagram post/reel URL or upload a video file.');
      return;
    }

    const isDirectVideo = trimmedUrl.match(/\.(mp4|mov|webm|ogg|m4v)($|\?)/i) || trimmedUrl.startsWith('blob:') || trimmedUrl.includes('/video/');

    if (!isDirectVideo && !isValidInstagramUrl(trimmedUrl)) {
      setFormError('Please enter a valid Instagram post/reel URL (e.g. https://www.instagram.com/reel/...) or upload a video.');
      return;
    }

    const cleanedUrl = isDirectVideo ? trimmedUrl : cleanInstagramUrl(trimmedUrl);
    const extractedId = isDirectVideo ? null : extractInstagramId(cleanedUrl);
    const finalTitle = form.title.trim() || (isDirectVideo ? 'Featured Video Highlight' : `Instagram Reel (${extractedId || 'Highlight'})`);
    const finalThumbnail = form.thumbnail.trim() || '/images/real_work_dzvz4ssjoss.jpg';

    setSaving(true);
    try {
      const payload = {
        title: finalTitle,
        thumbnail_url: finalThumbnail,
        instagram_url: cleanedUrl,
        content_type: 'reel' as const,
        status: form.published ? ('configured' as const) : ('incomplete' as const),
        is_featured: form.featured,
        display_order: editing?.display_order ?? (reels.length + 1),
        video_width: form.video_width,
        video_height: form.video_height,
        aspect_ratio: form.aspect_ratio,
        orientation: form.orientation,
      };

      if (editing) {
        await update(editing.id, payload);
        setSuccessMsg('Reel & orientation metadata updated successfully in Supabase.');
      } else {
        const newId = generateReelId(extractedId, reels.map(r => r.id));
        await create({
          id: newId,
          ...payload,
        });
        setSuccessMsg(form.published ? 'Reel saved and published live to website!' : 'Reel saved as draft.');
      }
      setTimeout(() => setSuccessMsg(null), 4000);
      resetForm();
    } catch (err: any) {
      console.error('Reel save failed:', err);
      setFormError(err?.message || 'Failed to save reel to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Instagram reel?')) {
      try {
        await remove(id);
        setSuccessMsg('Reel removed from database.');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: any) {
        alert(err?.message || 'Delete operation failed.');
      }
    }
  };

  const toggleFeatured = async (reel: any) => {
    try {
      const currentFeatured = reel.is_featured ?? reel.featured ?? false;
      await update(reel.id, {
        is_featured: !currentFeatured,
      });
      setSuccessMsg(`Reel ${!currentFeatured ? 'featured on homepage' : 'removed from homepage showcase'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Toggle featured failed:', err);
      alert(err?.message || 'Failed to update featured status.');
    }
  };

  const togglePublished = async (reel: any) => {
    try {
      const isCurrentlyPublished = reel.status === 'configured';
      const newStatus = isCurrentlyPublished ? 'incomplete' : 'configured';
      await update(reel.id, {
        status: newStatus,
      });
      setSuccessMsg(`Reel ${newStatus === 'configured' ? 'published live to website' : 'set to draft (hidden from public)'}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Toggle status failed:', err);
      alert(err?.message || 'Failed to update publication status.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
    setForm({
      title: '',
      thumbnail: '',
      url: '',
      featured: true,
      published: true,
      video_width: null,
      video_height: null,
      aspect_ratio: null,
      orientation: 'portrait',
      aspect_ratio_label: '9:16',
      detectedNote: null,
      thumbnailHint: null,
    });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const isDirectVideo = form.url.match(/\.(mp4|mov|webm|ogg|m4v)($|\?)/i) || form.url.startsWith('blob:') || form.url.includes('/video/');
  const isUrlValid = !form.url.trim() || isDirectVideo || isValidInstagramUrl(form.url.trim());

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
          <span><strong>PostgreSQL Database Connected:</strong> Real-time persistence via Supabase <code className="text-tertiary font-mono">instagram_reels</code> table with automatic orientation metadata.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <InstagramIcon size={22} className="text-tertiary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Instagram Reels & Videos</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Automatic orientation detection (Portrait 9:16, Landscape 16:9, Square 1:1) and social highlights</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Reel / Video
        </button>
      </div>

      {loading && reels.length === 0 ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading reels from database...</span>
        </div>
      ) : reels.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No Instagram Reels Configured</p>
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Reel / Video" to upload a video or link an Instagram reel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {reels.map(reel => {
            const reelUrl = reel.instagram_url || reel.url || '';
            const reelThumb = reel.thumbnail_url || reel.thumbnail || '/images/real_work_dzvz4ssjoss.jpg';
            const isPublished = reel.status === 'configured';
            const isFeatured = reel.is_featured ?? reel.featured ?? false;
            const orientation = reel.orientation || 'portrait';

            return (
              <div key={reel.id} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between">
                <div className="aspect-[9/16] relative bg-surface-container-lowest">
                  <img src={reelThumb} alt={reel.title} className="w-full h-full object-cover" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    <button
                      onClick={() => togglePublished(reel)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs cursor-pointer flex items-center gap-1 transition-colors ${
                        isPublished
                          ? 'bg-emerald-500/90 text-white hover:bg-emerald-600'
                          : 'bg-amber-500/90 text-black hover:bg-amber-600'
                      }`}
                      title="Click to toggle published status"
                    >
                      {isPublished ? <Eye size={10} /> : <EyeOff size={10} />}
                      <span>{isPublished ? 'Live' : 'Draft'}</span>
                    </button>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-white/90 border border-white/20 capitalize shadow-xs">
                      {orientation}
                    </span>
                  </div>

                  {isFeatured && (
                    <span className="absolute top-2 right-2 bg-tertiary text-on-tertiary p-1 rounded-full shadow-xs" title="Featured on Homepage">
                      <Star size={10} fill="currentColor" />
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2 pointer-events-none">
                    <span className="text-[10px] text-white/90 truncate font-medium">{reel.title}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-on-surface truncate" title={reel.title}>{reel.title}</p>
                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-outline-variant/20">
                    <button
                      onClick={() => handleEdit(reel)}
                      className="p-1 rounded text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Edit Reel"
                    >
                      <Edit3 size={13} />
                    </button>
                    {reelUrl && (
                      <a
                        href={reelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors"
                        title="Open on Instagram / Video"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => toggleFeatured(reel)}
                      className={`p-1 rounded ${isFeatured ? 'text-tertiary' : 'text-on-surface-variant'} hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer`}
                      title={isFeatured ? "Remove from Homepage" : "Feature on Homepage"}
                    >
                      <Star size={13} fill={isFeatured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDelete(reel.id)}
                      className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer ml-auto"
                      title="Delete Reel"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reel Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={resetForm}>
          <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-6 border border-outline-variant/30 space-y-5 my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display text-lg font-bold text-on-surface">
                  {editing ? 'Edit Reel / Video' : 'Add Reel / Video'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Automatic video orientation detection & metadata</p>
              </div>
              <button
                onClick={resetForm}
                className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Option A: Direct Video File Upload with Automatic Orientation Detection */}
              <div className="p-3.5 bg-surface-container-lowest/80 rounded-xl border border-outline-variant/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <VideoIcon size={14} className="text-tertiary" /> Upload Local Video File
                  </span>
                  <label className="text-xs text-tertiary font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <Upload size={12} />
                    <span>{uploadingVideo ? 'Detecting Dimensions...' : 'Select Video'}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/*"
                      onChange={handleVideoFileUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Select a video file to automatically detect actual dimensions (videoWidth × videoHeight) and classify orientation. No manual selection required.
                </p>
              </div>

              {/* Detected Dimension Success Badge */}
              {form.detectedNote && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0 text-emerald-500" />
                  <span className="font-medium">{form.detectedNote}</span>
                </div>
              )}

              {/* URL Input (Instagram URL or uploaded video link) */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Instagram Post/Reel URL or Video URL *
                </label>
                <input
                  type="text"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://www.instagram.com/reel/... or video URL"
                  className={inputClass}
                />
                {!isUrlValid && (
                  <p className="text-[11px] text-error mt-1">Please provide a valid Instagram post/reel link or video link.</p>
                )}
              </div>

              {/* Video Title */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Royal Wedding Highlights (auto-titled if blank)"
                  className={inputClass}
                />
              </div>

              {/* Orientation Classification & Manual Override */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Orientation Classification
                  </label>
                  <span className="text-[11px] text-tertiary font-semibold capitalize">
                    Active: {form.orientation} ({form.aspect_ratio_label})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['portrait', 'landscape', 'square'] as VideoOrientation[]).map(o => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        orientation: o,
                        aspect_ratio_label: o === 'portrait' ? '9:16' : o === 'landscape' ? '16:9' : '1:1',
                      }))}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        form.orientation === o
                          ? 'bg-tertiary text-on-tertiary border-tertiary shadow-xs'
                          : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span>{o}</span>
                      <span className="text-[10px] opacity-80">{o === 'portrait' ? '9:16 (Vertical)' : o === 'landscape' ? '16:9 (Wide)' : '1:1 (Square)'}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {isDirectVideo
                    ? 'Determined automatically from file metadata. Manual override available if needed.'
                    : 'Default 9:16 preview for Instagram reels. Override above if reel is landscape or square.'}
                </p>
              </div>

              {/* Thumbnail Image + Hint Detection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Thumbnail Image
                  </label>
                  <label className="text-xs text-tertiary hover:underline cursor-pointer flex items-center gap-1 font-semibold">
                    <Upload size={12} />
                    <span>{uploading ? 'Uploading...' : 'Upload Thumbnail'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={form.thumbnail}
                  onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="/images/real_work_dzvz4ssjoss.jpg or storage URL"
                  className={inputClass}
                />

                {/* Thumbnail Dimension Hint if available */}
                {form.thumbnailHint && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      orientation: f.thumbnailHint!.orientation,
                      aspect_ratio_label: f.thumbnailHint!.label,
                    }))}
                    className="w-full mt-2 text-left p-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs flex items-center justify-between hover:bg-tertiary/15 transition-colors cursor-pointer"
                  >
                    <span>💡 Thumbnail Hint: {form.thumbnailHint.width}×{form.thumbnailHint.height} ({form.thumbnailHint.label} {form.thumbnailHint.orientation})</span>
                    <span className="underline font-semibold text-[11px]">Apply Hint</span>
                  </button>
                )}
              </div>

              {/* Live Preview of Video / Thumbnail in responsive container */}
              {form.url && isDirectVideo && (
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
                    Accurate Video Preview
                  </label>
                  <div className={`rounded-xl overflow-hidden border border-outline-variant/30 bg-black max-h-56 ${getVideoContainerAspectClass(form.orientation)}`}>
                    <video src={form.url} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-outline-variant/20">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={e => setForm({ ...form, published: e.target.checked })}
                    className="accent-tertiary"
                  />
                  <span>Publish to Live Website</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-on-surface">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    className="accent-tertiary"
                  />
                  <span>Feature on Homepage Reels Showcase</span>
                </label>
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
                disabled={saving || !isUrlValid || !form.url.trim()}
                className="px-5 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <span>{editing ? 'Update Reel' : 'Save & Publish Reel'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

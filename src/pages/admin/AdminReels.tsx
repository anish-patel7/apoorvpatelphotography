import { useState } from 'react';
import { Plus, Edit3, Trash2, Star, X, ExternalLink, AlertTriangle, Upload, Loader2, Database } from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import { isValidInstagramUrl, cleanInstagramUrl } from '../../utils/instagram';
import { useReelsAdmin } from '../../hooks/useReels';
import { useStorage } from '../../hooks/useStorage';

export default function AdminReels() {
  const { reels, loading, create, update, remove } = useReelsAdmin();
  const { upload, uploading } = useStorage('reel-thumbnails');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', thumbnail: '', url: '', featured: true });

  const handleEdit = (r: any) => {
    setEditing(r);
    setForm({
      title: r.title,
      thumbnail: r.thumbnail || r.thumbnail_url || '',
      url: r.url || r.instagram_url || '',
      featured: r.featured ?? r.is_featured ?? true,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await upload(file);
    if (uploadedUrl) {
      setForm(prev => ({ ...prev, thumbnail: uploadedUrl }));
    } else {
      setFormError('Failed to upload thumbnail image. Check file format or network.');
    }
  };

  const handleSave = async () => {
    setFormError(null);

    if (!form.title.trim()) {
      setFormError('Please enter a reel title.');
      return;
    }
    if (!form.thumbnail.trim()) {
      setFormError('A thumbnail image URL is required. Instagram embedding requires a cover image thumbnail.');
      return;
    }
    if (!form.url.trim()) {
      setFormError('Please enter an Instagram reel URL.');
      return;
    }
    if (!isValidInstagramUrl(form.url.trim())) {
      setFormError('Invalid Instagram URL. Please provide a valid link from instagram.com (e.g., https://www.instagram.com/reel/...).');
      return;
    }

    const cleanedUrl = cleanInstagramUrl(form.url.trim());
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        thumbnail_url: form.thumbnail.trim(),
        thumbnail: form.thumbnail.trim(),
        instagram_url: cleanedUrl,
        url: cleanedUrl,
        content_type: 'reel' as const,
        status: 'configured' as const,
        is_featured: form.featured,
        featured: form.featured,
      };

      if (editing) {
        await update(editing.id, payload);
      } else {
        await create(payload);
      }
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save Instagram reel.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this Instagram reel?')) {
      try {
        await remove(id);
      } catch (err: any) {
        alert(err?.message || 'Delete operation failed.');
      }
    }
  };

  const toggleFeatured = async (reel: any) => {
    try {
      await update(reel.id, {
        featured: !reel.featured,
      });
    } catch (err: any) {
      console.error('Toggle featured failed:', err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormError(null);
    setForm({ title: '', thumbnail: '', url: '', featured: true });
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const isUrlValid = !form.url.trim() || isValidInstagramUrl(form.url.trim());

  return (
    <div className="space-y-6">
      {/* Database connection banner */}
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          <Database size={15} className="text-tertiary shrink-0" />
          <span><strong>PostgreSQL Database Connected:</strong> Real-time persistence via Supabase <code className="text-tertiary font-mono">instagram_reels</code> and storage bucket <code className="text-tertiary font-mono">reel-thumbnails</code>.</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <InstagramIcon size={22} className="text-tertiary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Instagram Reels</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Manage vertical video features, thumbnail fallbacks, and social highlights</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
        >
          <Plus size={16} /> Add Reel
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
          <p className="text-on-surface-variant text-xs mt-1">Click "Add Reel" to link your first vertical reel from Instagram.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {reels.map(reel => {
            const reelUrl = (reel as any).url || (reel as any).instagram_url || '';
            const reelThumb = (reel as any).thumbnail || (reel as any).thumbnail_url || '';
            const isIncomplete = (reel as any).status === 'incomplete' || !isValidInstagramUrl(reelUrl);
            const isFeatured = (reel as any).featured ?? (reel as any).is_featured ?? false;

            return (
              <div key={reel.id} className="bg-surface-container-low rounded-xl overflow-hidden border border-outline-variant/30 hover:border-outline-variant/60 transition-colors shadow-xs flex flex-col justify-between">
                <div className="aspect-[9/16] relative bg-surface-container-lowest">
                  <img src={reelThumb} alt={reel.title} className="w-full h-full object-cover" />
                  {isIncomplete && (
                    <span className="absolute top-2 left-2 bg-amber-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs" title="Missing individual Instagram post/reel link">
                      Incomplete
                    </span>
                  )}
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
                        title="Open on Instagram"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => toggleFeatured(reel)}
                      className={`p-1 rounded ${isFeatured ? 'text-tertiary' : 'text-on-surface-variant'} hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer`}
                      title="Toggle Featured"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-surface-container-low rounded-2xl max-w-md w-full p-6 border border-outline-variant/30 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 className="font-display text-lg font-bold text-on-surface">
                {editing ? 'Edit Reel' : 'Add Instagram Reel'}
              </h3>
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
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Reel Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Royal Wedding Teaser"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Thumbnail Image URL *
                  </label>
                  <label className="text-xs text-tertiary hover:underline cursor-pointer flex items-center gap-1">
                    <Upload size={12} />
                    <span>{uploading ? 'Uploading...' : 'Upload'}</span>
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
                  value={form.thumbnail}
                  onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="/images/real_work_dzvz4ssjoss.jpg or storage URL"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                  Instagram Reel URL *
                </label>
                <input
                  type="text"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://www.instagram.com/reel/..."
                  className={inputClass}
                />
                {!isUrlValid && (
                  <p className="text-[11px] text-error mt-1">Please provide a valid Instagram post/reel link.</p>
                )}
              </div>

              <div className="pt-2">
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
                disabled={saving || !isUrlValid}
                className="px-5 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editing ? 'Update Reel' : 'Save Reel'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

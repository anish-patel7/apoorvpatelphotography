import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Edit3, Trash2, Star, X, ExternalLink, AlertTriangle, Upload, Loader2, CheckCircle2,
  Eye, EyeOff, Video as VideoIcon, Sparkles, ArrowUp, ArrowDown, Play, Film, RefreshCw, Link2, Info,
} from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import InstagramEmbed from '../../components/instagram/InstagramEmbed';
import ReelViewerModal from '../../components/instagram/ReelViewerModal';
import ReelVideoPlayer from '../../components/instagram/ReelVideoPlayer';
import { isValidInstagramUrl, cleanInstagramUrl, getInstagramType } from '../../utils/instagram';
import { useReelsAdmin } from '../../hooks/useReels';
import { useStorage, getStoragePathFromPublicUrl } from '../../hooks/useStorage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  ALLOWED_REEL_THUMBNAIL_TYPES,
  ALLOWED_REEL_VIDEO_TYPES,
  HOMEPAGE_REEL_LIMIT,
  MAX_REEL_THUMBNAIL_BYTES,
  MAX_REEL_VIDEO_BYTES,
  REEL_THUMBNAIL_BUCKET,
  REEL_VIDEO_BUCKET,
  formatFileSize,
  getReelAspectRatio,
  getReelMediaType,
  isTemporaryUrl,
} from '../../utils/reelMedia';
import {
  captureVideoFrame,
  detectVideoDimensions,
  detectImageDimensions,
  getAspectRatioLabel,
  type VideoOrientation,
} from '../../utils/videoOrientation';
import type { InstagramReel, ReelMediaType } from '../../types';

type StatusFilter = 'all' | 'published' | 'draft' | 'featured';

interface ReelForm {
  mediaType: ReelMediaType;
  title: string;
  instagramUrl: string;
  /** Permanent public Storage URL of the uploaded video. Never a blob: URL. */
  videoUrl: string;
  thumbnail: string;
  displayOrder: string;
  published: boolean;
  featured: boolean;
  video_width: number | null;
  video_height: number | null;
  aspect_ratio: number | null;
  orientation: VideoOrientation;
  aspect_ratio_label: string;
  detectedNote: string | null;
  thumbnailHint: { width: number; height: number; orientation: VideoOrientation; label: string } | null;
}

const ORIENTATION_LABEL: Record<VideoOrientation, string> = {
  portrait: '9:16',
  landscape: '16:9',
  square: '1:1',
};

function emptyForm(nextOrder: number): ReelForm {
  return {
    mediaType: 'instagram',
    title: '',
    instagramUrl: '',
    videoUrl: '',
    thumbnail: '',
    displayOrder: String(nextOrder),
    published: false,
    featured: true,
    video_width: null,
    video_height: null,
    aspect_ratio: null,
    orientation: 'portrait',
    aspect_ratio_label: '9:16',
    detectedNote: null,
    thumbnailHint: null,
  };
}

function uploadFolder(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminReels() {
  const { reels, loading, error: loadError, create, update, remove, move, refetch } = useReelsAdmin();
  const videoStorage = useStorage(REEL_VIDEO_BUCKET);
  const thumbStorage = useStorage(REEL_THUMBNAIL_BUCKET);

  const nextOrder = useMemo(
    () => reels.reduce((max, r) => Math.max(max, r.display_order ?? 0), 0) + 1,
    [reels]
  );

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InstagramReel | null>(null);
  const [form, setForm] = useState<ReelForm>(() => emptyForm(1));
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [videoStage, setVideoStage] = useState<string | null>(null);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InstagramReel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Files uploaded while the form is open. Unused ones are removed on save/cancel.
  const sessionUploads = useRef<string[]>([]);

  // Revoke local object URLs when replaced or on unmount.
  useEffect(() => () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); }, [localPreviewUrl]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.type === 'error' ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const counts = useMemo(() => ({
    all: reels.length,
    published: reels.filter(r => r.status === 'configured').length,
    draft: reels.filter(r => r.status !== 'configured').length,
    featured: reels.filter(r => r.status === 'configured' && r.is_featured).length,
  }), [reels]);

  // Which reels currently appear on the homepage (same rule as useReels()).
  const homepageIds = useMemo(() => new Set(
    reels.filter(r => r.status === 'configured' && r.is_featured).slice(0, HOMEPAGE_REEL_LIMIT).map(r => r.id)
  ), [reels]);

  const visibleReels = reels.filter(r => {
    if (filter === 'published') return r.status === 'configured';
    if (filter === 'draft') return r.status !== 'configured';
    if (filter === 'featured') return r.status === 'configured' && r.is_featured;
    return true;
  });

  // ---------------------------------------------------------------------------
  // Storage helpers
  // ---------------------------------------------------------------------------
  const deleteStoredFile = async (url: string | null | undefined, keepIfUsedBy?: string) => {
    if (!url) return;
    const usedElsewhere = reels.some(r => r.id !== keepIfUsedBy && (r.video_url === url || r.thumbnail_url === url));
    if (usedElsewhere) return;
    if (getStoragePathFromPublicUrl(REEL_VIDEO_BUCKET, url)) await videoStorage.removeByPublicUrl(url);
    else if (getStoragePathFromPublicUrl(REEL_THUMBNAIL_BUCKET, url)) await thumbStorage.removeByPublicUrl(url);
  };

  const discardSessionUploads = async (keep: string[] = []) => {
    const toDelete = sessionUploads.current.filter(u => !keep.includes(u));
    sessionUploads.current = [];
    await Promise.all(toDelete.map(u => deleteStoredFile(u)));
  };

  // ---------------------------------------------------------------------------
  // Form lifecycle
  // ---------------------------------------------------------------------------
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(nextOrder));
    setFormError(null);
    setVideoWarning(null);
    setLocalPreviewUrl(null);
    sessionUploads.current = [];
    setShowForm(true);
  };

  const openEdit = (r: InstagramReel) => {
    const orientation: VideoOrientation = r.orientation || 'portrait';
    const width = r.video_width || null;
    const height = r.video_height || null;
    const label = width && height ? getAspectRatioLabel(width, height, orientation) : ORIENTATION_LABEL[orientation];

    setEditing(r);
    setForm({
      mediaType: getReelMediaType(r),
      title: r.title || '',
      instagramUrl: r.instagram_url || r.url || '',
      videoUrl: r.video_url || '',
      thumbnail: r.thumbnail_url || r.thumbnail || '',
      displayOrder: String(r.display_order ?? 0),
      published: r.status === 'configured',
      featured: Boolean(r.is_featured ?? r.featured),
      video_width: width,
      video_height: height,
      aspect_ratio: r.aspect_ratio || null,
      orientation,
      aspect_ratio_label: label,
      detectedNote: width && height ? `Saved dimensions: ${width} × ${height} (${label})` : null,
      thumbnailHint: null,
    });
    setFormError(null);
    setVideoWarning(null);
    setLocalPreviewUrl(null);
    sessionUploads.current = [];
    setShowForm(true);
  };

  const closeForm = async () => {
    if (saving || videoStage) return;
    setShowForm(false);
    setEditing(null);
    setFormError(null);
    setLocalPreviewUrl(null);
    await discardSessionUploads();
  };

  // ---------------------------------------------------------------------------
  // Uploads
  // ---------------------------------------------------------------------------
  const uploadThumbnailFile = async (file: File): Promise<string> => {
    const { publicUrl } = await thumbStorage.uploadFile(file, {
      allowedTypes: ALLOWED_REEL_THUMBNAIL_TYPES,
      maxBytes: MAX_REEL_THUMBNAIL_BYTES,
      folder: uploadFolder(),
    });
    sessionUploads.current.push(publicUrl);
    return publicUrl;
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFormError(null);
    setVideoWarning(null);

    if (!ALLOWED_REEL_VIDEO_TYPES.includes(file.type)) {
      setFormError(`Unsupported video format (${file.type || 'unknown'}). Please upload MP4, WebM or MOV.`);
      return;
    }
    if (file.size > MAX_REEL_VIDEO_BYTES) {
      setFormError(`This video is ${formatFileSize(file.size)}. The maximum is ${formatFileSize(MAX_REEL_VIDEO_BYTES)} — please export a smaller MP4 (H.264, 1080p).`);
      return;
    }
    if (file.type === 'video/quicktime') {
      setVideoWarning('MOV files (especially iPhone HEVC) may not play in Chrome, Firefox or Android. MP4 (H.264) is recommended for all visitors.');
    }

    // Local preview only — this blob: URL is never saved.
    setLocalPreviewUrl(URL.createObjectURL(file));

    try {
      setVideoStage('Reading video dimensions…');
      const dims = await detectVideoDimensions(file);
      setForm(prev => ({
        ...prev,
        mediaType: 'video',
        title: prev.title.trim() ? prev.title : file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim(),
        video_width: dims.detected ? dims.video_width : null,
        video_height: dims.detected ? dims.video_height : null,
        aspect_ratio: dims.detected ? dims.aspect_ratio : null,
        orientation: dims.orientation,
        aspect_ratio_label: dims.aspect_ratio_label,
        detectedNote: dims.detected
          ? `Detected ${dims.video_width} × ${dims.video_height} (${dims.aspect_ratio_label} · ${dims.orientation})`
          : 'Could not read the video dimensions in this browser — please choose the orientation manually.',
      }));

      setVideoStage(`Uploading ${formatFileSize(file.size)} video…`);
      const { publicUrl } = await videoStorage.uploadFile(file, {
        allowedTypes: ALLOWED_REEL_VIDEO_TYPES,
        maxBytes: MAX_REEL_VIDEO_BYTES,
        folder: uploadFolder(),
      });
      sessionUploads.current.push(publicUrl);
      setForm(prev => ({ ...prev, videoUrl: publicUrl }));

      // Generate a poster frame when no thumbnail has been chosen yet.
      if (!form.thumbnail.trim()) {
        setVideoStage('Creating thumbnail from video…');
        const frame = await captureVideoFrame(file);
        if (frame) {
          const thumbFile = new File([frame], `${file.name.replace(/\.[^/.]+$/, '')}-poster.jpg`, { type: 'image/jpeg' });
          try {
            const thumbUrl = await uploadThumbnailFile(thumbFile);
            setForm(prev => (prev.thumbnail.trim() ? prev : { ...prev, thumbnail: thumbUrl }));
          } catch (thumbErr) {
            console.warn('Automatic thumbnail failed:', thumbErr);
          }
        }
      }
    } catch (err: any) {
      console.error('Video upload failed:', err);
      setLocalPreviewUrl(null);
      setFormError(err?.message || 'Video upload failed. Please try again.');
    } finally {
      setVideoStage(null);
    }
  };

  const handleThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);

    try {
      const hint = await detectImageDimensions(file);
      setForm(prev => ({ ...prev, thumbnailHint: hint }));
    } catch {
      // Hint is optional
    }

    try {
      const url = await uploadThumbnailFile(file);
      setForm(prev => ({ ...prev, thumbnail: url }));
    } catch (err: any) {
      setFormError(err?.message || 'Thumbnail upload failed.');
    }
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const trimmedInstagramUrl = form.instagramUrl.trim();
  const instagramUrlValid = !trimmedInstagramUrl || isValidInstagramUrl(trimmedInstagramUrl);
  const uploadingAnything = Boolean(videoStage) || thumbStorage.uploading;

  const findDuplicate = (canonical: string) =>
    reels.find(r => r.id !== editing?.id && r.instagram_url && cleanInstagramUrl(r.instagram_url) === canonical);

  const handleSave = async () => {
    setFormError(null);

    if (uploadingAnything) {
      setFormError('Please wait for the upload to finish.');
      return;
    }
    if (!instagramUrlValid) {
      setFormError('Please enter a valid Instagram post or reel URL (e.g. https://www.instagram.com/reel/...).');
      return;
    }
    if (form.mediaType === 'instagram' && !trimmedInstagramUrl) {
      setFormError('Please enter the Instagram post or reel URL.');
      return;
    }
    if (form.mediaType === 'video' && !form.videoUrl) {
      setFormError('Please upload a video file.');
      return;
    }
    if (isTemporaryUrl(form.videoUrl) || isTemporaryUrl(form.thumbnail)) {
      setFormError('A temporary preview link cannot be saved. Please re-upload the file.');
      return;
    }

    const canonicalInstagram = trimmedInstagramUrl ? cleanInstagramUrl(trimmedInstagramUrl) : '';
    if (canonicalInstagram) {
      const dup = findDuplicate(canonicalInstagram);
      if (dup) {
        setFormError(`This Instagram URL is already used by "${dup.title || 'another entry'}". Edit that entry instead.`);
        return;
      }
    }

    const isVideo = form.mediaType === 'video';
    const igType = canonicalInstagram ? getInstagramType(canonicalInstagram) : null;
    const finalTitle = form.title.trim() || (isVideo ? 'Studio Film Highlight' : igType === 'post' ? 'Instagram Post' : 'Instagram Reel');
    const orderNumber = Number.parseInt(form.displayOrder, 10);
    const finalVideoUrl = isVideo ? form.videoUrl : null;
    const finalThumbnail = form.thumbnail.trim();

    const payload = {
      title: finalTitle,
      media_type: form.mediaType,
      instagram_url: canonicalInstagram || null,
      video_url: finalVideoUrl,
      thumbnail_url: finalThumbnail,
      content_type: igType === 'post' ? ('post' as const) : ('reel' as const),
      status: form.published ? ('configured' as const) : ('incomplete' as const),
      is_featured: form.featured,
      display_order: Number.isFinite(orderNumber) ? orderNumber : nextOrder,
      // Real dimensions only exist for uploaded videos; Instagram uses the manual orientation.
      video_width: isVideo ? form.video_width : null,
      video_height: isVideo ? form.video_height : null,
      aspect_ratio: isVideo ? form.aspect_ratio : null,
      orientation: form.orientation,
    };

    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, payload);
        // Remove files this entry no longer uses.
        if (editing.video_url && editing.video_url !== finalVideoUrl) await deleteStoredFile(editing.video_url, editing.id);
        if (editing.thumbnail_url && editing.thumbnail_url !== finalThumbnail) await deleteStoredFile(editing.thumbnail_url, editing.id);
        setNotice({ type: 'success', text: `"${finalTitle}" updated.` });
      } else {
        await create(payload);
        setNotice({ type: 'success', text: form.published ? `"${finalTitle}" published to the website.` : `"${finalTitle}" saved as a draft.` });
      }
      await discardSessionUploads([finalVideoUrl || '', finalThumbnail]);
      setShowForm(false);
      setEditing(null);
      setLocalPreviewUrl(null);
    } catch (err: any) {
      console.error('Reel save failed:', err);
      setFormError(err?.message || 'Failed to save to the database.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Quick actions (partial updates — each touches only its own field)
  // ---------------------------------------------------------------------------
  const runQuickAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setBusyId(id);
    try {
      await action();
      setNotice({ type: 'success', text: success });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Update failed.' });
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = (reel: InstagramReel) => {
    const next = !(reel.is_featured ?? reel.featured);
    return runQuickAction(reel.id, () => update(reel.id, { is_featured: next }),
      next ? `"${reel.title}" featured${reel.status === 'configured' ? ' on the homepage' : ' (visible on the homepage once published)'}.` : `"${reel.title}" removed from the homepage showcase.`);
  };

  const togglePublished = (reel: InstagramReel) => {
    const publish = reel.status !== 'configured';
    return runQuickAction(reel.id, () => update(reel.id, { status: publish ? 'configured' : 'incomplete' }),
      publish ? `"${reel.title}" is now live.` : `"${reel.title}" moved to drafts (hidden from visitors).`);
  };

  const moveReel = (reel: InstagramReel, direction: -1 | 1) =>
    runQuickAction(reel.id, () => move(reel.id, direction), 'Display order updated.');

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await remove(confirmDelete.id);
      setNotice({ type: 'success', text: `"${confirmDelete.title}" deleted.` });
      setConfirmDelete(null);
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Delete failed.' });
    } finally {
      setDeleting(false);
    }
  };

  // Optional: import new reels as drafts through the server-side Meta API endpoint.
  const handleInstagramSync = async () => {
    setSyncing(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Your admin session has expired. Please sign in again.');
      const res = await fetch('/api/instagram-sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => null);
      if (res.status === 404) throw new Error('The sync endpoint is only available on the Vercel deployment.');
      if (res.status === 501) throw new Error(body?.error || 'Instagram sync is not configured. Add the Meta API credentials in Vercel first.');
      if (!res.ok || !body?.success) throw new Error(body?.error || `Sync failed (HTTP ${res.status}).`);
      await refetch();
      setNotice({
        type: 'success',
        text: body.imported > 0
          ? `Imported ${body.imported} new reel${body.imported === 1 ? '' : 's'} from Instagram as drafts. Review and publish them below.`
          : 'No new reels found on Instagram.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Instagram sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const labelBase = 'block text-xs font-semibold text-on-surface-variant uppercase tracking-wider';
  const labelClass = `${labelBase} mb-1.5`;
  const previewVideoSrc = localPreviewUrl || form.videoUrl;

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm shadow-xs border ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-error/10 border-error/30 text-error'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertTriangle size={16} className="shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), so changes cannot be saved.</span>
        </div>
      )}

      {loadError && (
        <div className="bg-error/10 border border-error/30 text-error rounded-xl p-4 text-xs flex items-center justify-between gap-3">
          <span className="flex items-start gap-2"><AlertTriangle size={15} className="shrink-0 mt-0.5" />{loadError}</span>
          <button onClick={() => void refetch()} className="shrink-0 font-semibold underline cursor-pointer">Retry</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <InstagramIcon size={22} className="text-tertiary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Instagram Reels & Videos</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">
            Published + Featured entries appear in the homepage showcase (first {HOMEPAGE_REEL_LIMIT} by display order).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleInstagramSync}
            disabled={syncing || !isSupabaseConfigured}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-outline-variant/40 text-on-surface text-sm font-semibold rounded-lg hover:border-tertiary/60 hover:text-tertiary transition-colors cursor-pointer disabled:opacity-50"
            title="Import new reels from Instagram as drafts (requires Meta API setup)"
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Import from Instagram
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Add Reel / Video
          </button>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter reels">
        {([
          ['all', 'All'],
          ['published', 'Published'],
          ['draft', 'Drafts'],
          ['featured', 'Live & Featured'],
        ] as Array<[StatusFilter, string]>).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              filter === key
                ? 'bg-tertiary text-on-tertiary border-tertiary'
                : 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {label} <span className="opacity-70">({counts[key]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading reels from database...</span>
        </div>
      ) : visibleReels.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">{reels.length === 0 ? 'No reels yet' : 'Nothing in this view'}</p>
          <p className="text-on-surface-variant text-xs mt-1">
            {reels.length === 0 ? 'Click "Add Reel / Video" to link an Instagram reel or upload a video.' : 'Try another filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleReels.map(reel => {
            const position = reels.findIndex(r => r.id === reel.id);
            const instagramUrl = reel.instagram_url || reel.url || '';
            const thumb = reel.thumbnail_url || reel.thumbnail || '';
            const isPublished = reel.status === 'configured';
            const isFeatured = Boolean(reel.is_featured ?? reel.featured);
            const isVideo = getReelMediaType(reel) === 'video';
            const missingMedia = isVideo ? !reel.video_url : !isValidInstagramUrl(instagramUrl);
            const busy = busyId === reel.id;

            return (
              <div key={reel.id} className={`bg-surface-container-low rounded-xl overflow-hidden border transition-colors shadow-xs flex flex-col ${isPublished ? 'border-outline-variant/30' : 'border-dashed border-amber-500/40'}`}>
                <button
                  type="button"
                  onClick={() => setPreviewIndex(position)}
                  className="aspect-[9/16] relative bg-surface-container-lowest group cursor-pointer"
                  title="Preview"
                  disabled={missingMedia}
                >
                  {thumb ? (
                    <img src={thumb} alt={reel.title} loading="lazy" className={`w-full h-full ${reel.orientation && reel.orientation !== 'portrait' ? 'object-contain' : 'object-cover'} ${isPublished ? '' : 'opacity-70'}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant/50">
                      {isVideo ? <Film size={32} /> : <InstagramIcon size={32} />}
                    </div>
                  )}
                  {!missingMedia && (
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <span className="w-10 h-10 rounded-full bg-black/60 border border-tertiary/50 flex items-center justify-center"><Play size={16} className="text-tertiary ml-0.5" fill="currentColor" /></span>
                    </span>
                  )}
                  <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${isPublished ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-black'}`}>
                      {isPublished ? <Eye size={10} /> : <EyeOff size={10} />} {isPublished ? 'Live' : 'Draft'}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/75 text-white/90 border border-white/20 flex items-center gap-1">
                      {isVideo ? <Film size={9} /> : <InstagramIcon size={9} />} {isVideo ? 'Upload' : 'Instagram'} · {ORIENTATION_LABEL[reel.orientation || 'portrait']}
                    </span>
                  </span>
                  {isFeatured && (
                    <span className="absolute top-2 right-2 bg-tertiary text-on-tertiary p-1 rounded-full" title="Featured">
                      <Star size={10} fill="currentColor" />
                    </span>
                  )}
                  {homepageIds.has(reel.id) && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-tertiary/90 text-on-tertiary">On homepage</span>
                  )}
                  {missingMedia && (
                    <span className="absolute bottom-2 left-2 right-2 text-[10px] font-semibold px-2 py-1 rounded bg-error/90 text-white text-center">Media missing — edit to fix</span>
                  )}
                </button>

                <div className="p-3 flex-1 flex flex-col gap-2.5">
                  <p className="text-xs font-semibold text-on-surface line-clamp-2 min-h-[2rem]" title={reel.title}>{reel.title || 'Untitled'}</p>
                  <p className="text-[10px] text-on-surface-variant -mt-1.5">Order #{reel.display_order ?? 0}</p>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => togglePublished(reel)}
                      disabled={busy || (!isPublished && missingMedia)}
                      className={`text-[10px] font-semibold px-2 py-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-40 ${isPublished ? 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface' : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => toggleFeatured(reel)}
                      disabled={busy}
                      className={`text-[10px] font-semibold px-2 py-1.5 rounded-md border transition-colors cursor-pointer disabled:opacity-40 ${isFeatured ? 'border-tertiary/50 text-tertiary hover:bg-tertiary/10' : 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface'}`}
                    >
                      {isFeatured ? 'Unfeature' : 'Feature'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1 pt-2 border-t border-outline-variant/20 mt-auto">
                    <button onClick={() => openEdit(reel)} disabled={busy} className="p-1.5 rounded text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer" title="Edit" aria-label={`Edit ${reel.title}`}>
                      <Edit3 size={13} />
                    </button>
                    {filter === 'all' && (
                      <>
                        <button onClick={() => moveReel(reel, -1)} disabled={busy || position === 0} className="p-1.5 rounded text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-30" title="Move earlier" aria-label="Move earlier">
                          <ArrowUp size={13} />
                        </button>
                        <button onClick={() => moveReel(reel, 1)} disabled={busy || position === reels.length - 1} className="p-1.5 rounded text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-30" title="Move later" aria-label="Move later">
                          <ArrowDown size={13} />
                        </button>
                      </>
                    )}
                    {isValidInstagramUrl(instagramUrl) && (
                      <a href={cleanInstagramUrl(instagramUrl)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-on-surface-variant hover:text-tertiary hover:bg-surface-container transition-colors" title="Open on Instagram">
                        <ExternalLink size={13} />
                      </a>
                    )}
                    {busy && <Loader2 size={13} className="animate-spin text-tertiary" />}
                    <button onClick={() => setConfirmDelete(reel)} disabled={busy} className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer ml-auto" title="Delete" aria-label={`Delete ${reel.title}`}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => void closeForm()}>
          <div role="dialog" aria-modal="true" aria-labelledby="reel-form-title" className="bg-surface-container-low rounded-2xl max-w-xl w-full p-5 sm:p-6 border border-outline-variant/30 space-y-5 my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <h3 id="reel-form-title" className="font-display text-lg font-bold text-on-surface">{editing ? 'Edit Reel / Video' : 'Add Reel / Video'}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Link an Instagram reel/post, or upload your own video file.</p>
              </div>
              <button onClick={() => void closeForm()} aria-label="Close" className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div role="alert" className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-xs flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Source type */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              {([
                ['instagram', 'Instagram link', <InstagramIcon key="i" size={14} />],
                ['video', 'Upload video', <VideoIcon key="v" size={14} />],
              ] as Array<[ReelMediaType, string, React.ReactNode]>).map(([key, label, icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, mediaType: key }))}
                  className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${form.mediaType === key ? 'bg-tertiary text-on-tertiary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {form.mediaType === 'video' && (
                <div className="p-3.5 bg-surface-container-lowest/80 rounded-xl border border-outline-variant/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                      <VideoIcon size={14} className="text-tertiary" /> Video file *
                    </span>
                    <label className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tertiary/40 text-tertiary hover:bg-tertiary/10 ${videoStage ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                      {videoStage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      <span>{form.videoUrl ? 'Replace video' : 'Select video'}</span>
                      <input type="file" accept={ALLOWED_REEL_VIDEO_TYPES.join(',')} onChange={handleVideoFile} disabled={Boolean(videoStage)} className="hidden" />
                    </label>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    MP4 (H.264) recommended · WebM or MOV accepted · max {formatFileSize(MAX_REEL_VIDEO_BYTES)}. Dimensions and orientation are detected automatically.
                  </p>
                  {videoStage && (
                    <p className="text-[11px] text-tertiary font-semibold flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> {videoStage}</p>
                  )}
                  {!videoStage && form.videoUrl && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5"><CheckCircle2 size={12} /> Video stored in Supabase Storage</p>
                  )}
                  {videoWarning && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5"><Info size={12} className="shrink-0 mt-0.5" /> {videoWarning}</p>
                  )}
                </div>
              )}

              {form.detectedNote && form.mediaType === 'video' && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0" />
                  <span className="font-medium">{form.detectedNote}</span>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="reel-ig-url">
                  {form.mediaType === 'instagram' ? 'Instagram reel or post URL *' : 'Original Instagram URL (optional)'}
                </label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input
                    id="reel-ig-url"
                    type="url"
                    inputMode="url"
                    value={form.instagramUrl}
                    onChange={e => setForm({ ...form, instagramUrl: e.target.value })}
                    placeholder="https://www.instagram.com/reel/..."
                    className={`${inputClass} pl-9`}
                  />
                </div>
                {!instagramUrlValid ? (
                  <p className="text-[11px] text-error mt-1">Use a link to a single reel or post, e.g. instagram.com/reel/ABC123/ or instagram.com/p/ABC123/.</p>
                ) : form.mediaType === 'video' ? (
                  <p className="text-[11px] text-on-surface-variant mt-1">Adds an "Open on Instagram" button to the video viewer.</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className={labelClass} htmlFor="reel-title">Title</label>
                  <input id="reel-title" type="text" value={form.title} maxLength={120} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Royal Wedding Highlights" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="reel-order">Order</label>
                  <input id="reel-order" type="number" min={0} step={1} value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} className={inputClass} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={labelBase}>Orientation</span>
                  <span className="text-[11px] text-tertiary font-semibold capitalize">{form.orientation} ({form.aspect_ratio_label})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['portrait', 'landscape', 'square'] as VideoOrientation[]).map(o => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, orientation: o, aspect_ratio_label: ORIENTATION_LABEL[o] }))}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                        form.orientation === o
                          ? 'bg-tertiary text-on-tertiary border-tertiary shadow-xs'
                          : 'bg-surface-container-lowest border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span>{o}</span>
                      <span className="text-[10px] opacity-80">{ORIENTATION_LABEL[o]}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {form.mediaType === 'video'
                    ? 'Detected from the file; override only if detection was wrong.'
                    : 'Instagram does not share video dimensions publicly — most reels are 9:16 portrait.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelBase} htmlFor="reel-thumb">Thumbnail image</label>
                  <label className={`text-xs text-tertiary font-semibold flex items-center gap-1 ${thumbStorage.uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:underline'}`}>
                    {thumbStorage.uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    <span>{thumbStorage.uploading ? 'Uploading…' : 'Upload image'}</span>
                    <input type="file" accept={ALLOWED_REEL_THUMBNAIL_TYPES.join(',')} onChange={handleThumbnailFile} disabled={thumbStorage.uploading} className="hidden" />
                  </label>
                </div>
                <div className="flex gap-3 items-start">
                  {form.thumbnail && (
                    <img src={form.thumbnail} alt="Thumbnail preview" className="w-14 aspect-[9/16] object-cover rounded-md border border-outline-variant/30 shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <input id="reel-thumb" type="text" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} placeholder="Upload an image or paste an image URL" className={inputClass} />
                    <p className="text-[10px] text-on-surface-variant">
                      JPG, PNG, WebP or AVIF · max {formatFileSize(MAX_REEL_THUMBNAIL_BYTES)}.{' '}
                      {form.mediaType === 'video' ? 'A frame from the video is used automatically if left empty.' : 'Recommended: a screenshot of the reel cover (Instagram does not provide thumbnails publicly).'}
                    </p>
                  </div>
                </div>
                {form.thumbnailHint && form.thumbnailHint.orientation !== form.orientation && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, orientation: f.thumbnailHint!.orientation, aspect_ratio_label: ORIENTATION_LABEL[f.thumbnailHint!.orientation] }))}
                    className="w-full mt-2 text-left p-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs flex items-center justify-between hover:bg-tertiary/15 transition-colors cursor-pointer"
                  >
                    <span>Thumbnail is {form.thumbnailHint.width}×{form.thumbnailHint.height} ({form.thumbnailHint.orientation})</span>
                    <span className="underline font-semibold text-[11px]">Use this orientation</span>
                  </button>
                )}
              </div>

              {/* Preview before publishing */}
              {form.mediaType === 'video' && previewVideoSrc && (
                <div>
                  <span className={labelClass}>Preview</span>
                  <ReelVideoPlayer
                    key={previewVideoSrc}
                    src={previewVideoSrc}
                    poster={form.thumbnail || undefined}
                    title={form.title || 'Video preview'}
                    aspectRatio={getReelAspectRatio(form)}
                    maxHeight="45vh"
                  />
                </div>
              )}
              {form.mediaType === 'instagram' && trimmedInstagramUrl && instagramUrlValid && (
                <div>
                  <span className={labelClass}>Preview</span>
                  <InstagramEmbed
                    key={cleanInstagramUrl(trimmedInstagramUrl)}
                    url={trimmedInstagramUrl}
                    fallbackThumbnail={form.thumbnail}
                    title={form.title || 'Instagram preview'}
                    orientation={form.orientation}
                    autoLoad={false}
                  />
                </div>
              )}

              <div className="space-y-2.5 pt-3 border-t border-outline-variant/20">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-on-surface">
                  <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} className="accent-tertiary mt-0.5" />
                  <span><strong className="font-semibold">Published</strong> — visible to website visitors. Leave unticked to keep it as a draft.</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-on-surface">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-tertiary mt-0.5" />
                  <span><strong className="font-semibold">Featured</strong> — include in the homepage "Latest from Instagram" showcase (when published).</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-outline-variant/30">
              <button type="button" onClick={() => void closeForm()} disabled={saving || Boolean(videoStage)} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploadingAnything || !instagramUrlValid}
                className="px-5 py-2 rounded-lg bg-tertiary text-on-tertiary text-xs font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : editing ? 'Save changes' : form.published ? 'Save & publish' : 'Save draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-[60]" onClick={() => !deleting && setConfirmDelete(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-reel-title" className="bg-surface-container-low rounded-2xl max-w-sm w-full p-6 border border-outline-variant/30 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-full bg-error/15 text-error flex items-center justify-center shrink-0"><Trash2 size={16} /></span>
              <div>
                <h3 id="delete-reel-title" className="font-display font-bold text-on-surface">Delete this entry?</h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  "{confirmDelete.title || 'Untitled'}" will be removed from the website and the dashboard
                  {getReelMediaType(confirmDelete) === 'video' ? ', and its uploaded video and thumbnail files will be deleted' : ''}. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-xs font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {deleting && <Loader2 size={13} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin preview (works for drafts too) */}
      {previewIndex !== null && reels[previewIndex] && (
        <ReelViewerModal reels={reels} index={previewIndex} onClose={() => setPreviewIndex(null)} onNavigate={setPreviewIndex} />
      )}
    </div>
  );
}

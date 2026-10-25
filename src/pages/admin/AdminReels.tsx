import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Edit3, Trash2, Star, X, ExternalLink, AlertTriangle, Upload, Loader2, CheckCircle2,
  Eye, EyeOff, Video as VideoIcon, Sparkles, ArrowUp, ArrowDown, Play, Film, RefreshCw, Link2, Info,
  ChevronDown, ChevronUp, ImageIcon,
} from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import InstagramEmbed from '../../components/instagram/InstagramEmbed';
import ReelViewerModal from '../../components/instagram/ReelViewerModal';
import ReelVideoPlayer from '../../components/instagram/ReelVideoPlayer';
import { InlineYouTubePlayer } from '../../components/reels/InlineReelPlayers';
import BrandedReelPoster from '../../components/reels/BrandedReelPoster';
import { useReelThumbnails, thumbnailKind, type ThumbnailSummary } from '../../hooks/useReelThumbnails';
import { parseYouTubeUrl, getYouTubeThumbnail } from '../../utils/youtube';
import { isValidInstagramUrl, cleanInstagramUrl, getInstagramType } from '../../utils/instagram';
import { useReelsAdmin } from '../../hooks/useReels';
import { useStorage, getStoragePathFromPublicUrl } from '../../hooks/useStorage';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { friendlyError } from '../../lib/adminErrors';

// The optional Instagram import needs Meta API credentials on the server; only show it once configured.
const INSTAGRAM_IMPORT_ENABLED = import.meta.env.VITE_ENABLE_INSTAGRAM_IMPORT === 'true';
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
  getReelPoster,
  hasPlayableMedia,
  isTemporaryUrl,
} from '../../utils/reelMedia';
import {
  captureVideoFrame,
  detectVideoDimensions,
  detectImageDimensions,
  getAspectRatioLabel,
  type VideoOrientation,
} from '../../utils/videoOrientation';
import type { InstagramReel } from '../../types';

type StatusFilter = 'all' | 'published' | 'draft' | 'featured';

/** What the admin picked in the form. An Instagram reel with its original video attached is saved as media_type 'video'. */
type ReelSource = 'upload' | 'instagram' | 'youtube';

interface ReelForm {
  source: ReelSource;
  title: string;
  description: string;
  instagramUrl: string;
  youtubeUrl: string;
  /** True once the admin picks an orientation by hand (stops YouTube auto-detection overriding it). */
  orientationTouched: boolean;
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
    source: 'upload',
    title: '',
    description: '',
    instagramUrl: '',
    youtubeUrl: '',
    orientationTouched: false,
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

const THUMBNAIL_LABEL: Record<ReturnType<typeof thumbnailKind>, string> = {
  manual: 'Your thumbnail',
  instagram: 'Original Instagram cover',
  generated: 'Automatic thumbnail',
  missing: 'Branded placeholder',
};

/** Dashboard card image; falls back to the branded poster when missing or broken. */
function AdminReelThumb({ src, title, label, wide, dim }: { src: string; title: string; label: string; wide: boolean; dim: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <BrandedReelPoster title={title} label={label} className={dim ? 'opacity-70' : ''} />;
  return <img src={src} alt={title} loading="lazy" onError={() => setFailed(src)} className={`w-full h-full ${wide ? 'object-contain' : 'object-cover'} ${dim ? 'opacity-70' : ''}`} />;
}

export default function AdminReels() {
  const { reels, loading, error: loadError, create, update, remove, move, refetch } = useReelsAdmin();
  const { fixThumbnails, running: fixingThumbnails } = useReelThumbnails(refetch);
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
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [videoStage, setVideoStage] = useState<string | null>(null);
  const [videoWarning, setVideoWarning] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InstagramReel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [youtubePreview, setYoutubePreview] = useState(false);
  const [framing, setFraming] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Files uploaded while the form is open. Unused ones are removed on save/cancel.
  const sessionUploads = useRef<string[]>([]);
  // The video file picked in this session (lets "Use a frame from the video" work without re-downloading).
  const localFile = useRef<File | null>(null);
  // Thumbnails generated automatically from a video (safe to regenerate when the video is replaced).
  const autoThumbnails = useRef<string[]>([]);

  // Revoke local object URLs when replaced or on unmount.
  useEffect(() => () => { if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl); }, [localPreviewUrl]);

  useEffect(() => {
    if (!notice) return;
    if (notice.type === 'info') return; // progress messages stay until replaced
    const timer = setTimeout(() => setNotice(null), notice.type === 'error' ? 7000 : 5000);
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
    setAdvancedOpen(false);
    setYoutubePreview(false);
    setFormError(null);
    setVideoWarning(null);
    setLocalPreviewUrl(null);
    localFile.current = null;
    sessionUploads.current = [];
    setShowForm(true);
  };

  const openEdit = (r: InstagramReel) => {
    const orientation: VideoOrientation = r.orientation || 'portrait';
    const width = r.video_width || null;
    const height = r.video_height || null;
    const label = width && height ? getAspectRatioLabel(width, height, orientation) : ORIENTATION_LABEL[orientation];

    const type = getReelMediaType(r);
    const instagramUrl = r.instagram_url || r.url || '';
    setEditing(r);
    setAdvancedOpen(false);
    setYoutubePreview(false);
    setForm({
      source: type === 'youtube' ? 'youtube' : type === 'instagram' || (type === 'video' && isValidInstagramUrl(instagramUrl)) ? 'instagram' : 'upload',
      title: r.title || '',
      description: r.description || '',
      instagramUrl,
      youtubeUrl: r.youtube_url || '',
      orientationTouched: true,
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
    localFile.current = null;
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
    localFile.current = file;

    try {
      setVideoStage('Reading video dimensions…');
      const dims = await detectVideoDimensions(file);
      setForm(prev => ({
        ...prev,
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

      setVideoStage(`Uploading video (${formatFileSize(file.size)})…`);
      const { publicUrl } = await videoStorage.uploadFile(file, {
        allowedTypes: ALLOWED_REEL_VIDEO_TYPES,
        maxBytes: MAX_REEL_VIDEO_BYTES,
        folder: uploadFolder(),
        onProgress: f => setVideoStage(`Uploading video… ${Math.round(f * 100)}%`),
      });
      sessionUploads.current.push(publicUrl);
      setForm(prev => ({ ...prev, videoUrl: publicUrl }));

      // Generate a thumbnail from the video when none was chosen, or when the current one was
      // generated automatically from a previous video. A hand-picked image is never replaced.
      const current = form.thumbnail.trim();
      if (!current || autoThumbnails.current.includes(current)) {
        setVideoStage('Creating thumbnail from video…');
        const thumbUrl = await thumbnailFromVideo(file);
        if (thumbUrl) setForm(prev => (prev.thumbnail.trim() && prev.thumbnail !== current ? prev : { ...prev, thumbnail: thumbUrl }));
        else setVideoWarning('A thumbnail could not be created automatically. Please upload a cover image below.');
      }
    } catch (err: any) {
      setLocalPreviewUrl(null);
      setFormError(friendlyError(err, 'Reel video upload', 'The video could not be uploaded. Please try again.'));
    } finally {
      setVideoStage(null);
    }
  };

  /** Captures a frame from a video file or stored video and uploads it as the thumbnail. */
  const thumbnailFromVideo = async (source: File | string): Promise<string | null> => {
    const frame = await captureVideoFrame(source);
    if (!frame) return null;
    const base = typeof source === 'string' ? 'video' : source.name.replace(/\.[^/.]+$/, '');
    try {
      const url = await uploadThumbnailFile(new File([frame], `${base}-poster.jpg`, { type: 'image/jpeg' }));
      autoThumbnails.current.push(url);
      return url;
    } catch (thumbErr) {
      friendlyError(thumbErr, 'Automatic reel thumbnail');
      return null;
    }
  };

  /** "Use a frame from the video" button: works for a newly selected or an already saved video. */
  const regenerateThumbnail = async () => {
    const source = localFile.current || form.videoUrl;
    if (!source) return;
    setFraming(true);
    setFormError(null);
    try {
      const url = await thumbnailFromVideo(source);
      if (url) setForm(prev => ({ ...prev, thumbnail: url }));
      else setFormError('A frame could not be taken from this video. Please upload a cover image instead.');
    } finally {
      setFraming(false);
    }
  };

  const handleYouTubeUrl = (value: string) => {
    const parsed = parseYouTubeUrl(value);
    setYoutubePreview(false);
    setForm(prev => {
      const next = { ...prev, youtubeUrl: value };
      if (parsed && !prev.orientationTouched) {
        next.orientation = parsed.isShort ? 'portrait' : 'landscape';
        next.aspect_ratio_label = ORIENTATION_LABEL[next.orientation];
      }
      return next;
    });
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
      setFormError(friendlyError(err, 'Reel thumbnail upload', 'The image could not be uploaded. Please try again.'));
    }
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const trimmedInstagramUrl = form.instagramUrl.trim();
  const instagramUrlValid = !trimmedInstagramUrl || isValidInstagramUrl(trimmedInstagramUrl);
  const trimmedYouTubeUrl = form.youtubeUrl.trim();
  const parsedYouTube = parseYouTubeUrl(trimmedYouTubeUrl);
  const youtubeUrlValid = !trimmedYouTubeUrl || parsedYouTube !== null;
  /** What will actually be saved: an Instagram reel with its original video plays the video. */
  const effectiveMediaType = form.source === 'youtube' ? 'youtube' : form.source === 'upload' || form.videoUrl ? 'video' : 'instagram';
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
    if (form.source === 'instagram' && !trimmedInstagramUrl) {
      setFormError('Please enter the Instagram post or reel URL.');
      return;
    }
    if (form.source === 'upload' && !form.videoUrl) {
      setFormError('Please upload a video file.');
      return;
    }
    if (form.source === 'youtube' && !parsedYouTube) {
      setFormError(trimmedYouTubeUrl ? 'Please enter a valid YouTube link, e.g. https://www.youtube.com/shorts/... or https://youtu.be/...' : 'Please paste the YouTube Shorts or video link.');
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

    const isVideo = effectiveMediaType === 'video';
    const igType = canonicalInstagram ? getInstagramType(canonicalInstagram) : null;
    const finalTitle = form.title.trim() || (isVideo ? 'Studio Film Highlight' : effectiveMediaType === 'youtube' ? (parsedYouTube?.isShort ? 'YouTube Short' : 'YouTube Video') : igType === 'post' ? 'Instagram Post' : 'Instagram Reel');
    const orderNumber = Number.parseInt(form.displayOrder, 10);
    const finalVideoUrl = isVideo ? form.videoUrl : null;
    const finalThumbnail = form.thumbnail.trim();

    const payload = {
      title: finalTitle,
      description: form.description.trim(),
      media_type: effectiveMediaType,
      instagram_url: canonicalInstagram || null,
      video_url: finalVideoUrl,
      youtube_url: effectiveMediaType === 'youtube' && parsedYouTube ? parsedYouTube.canonicalUrl : null,
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
      let savedId: string | null = null;
      let savedText: string;
      if (editing) {
        await update(editing.id, payload);
        savedId = editing.id;
        // Remove files this entry no longer uses.
        if (editing.video_url && editing.video_url !== finalVideoUrl) await deleteStoredFile(editing.video_url, editing.id);
        if (editing.thumbnail_url && editing.thumbnail_url !== finalThumbnail) await deleteStoredFile(editing.thumbnail_url, editing.id);
        savedText = 'Your changes have been saved.';
      } else {
        const created: any = await create(payload);
        savedId = Array.isArray(created) && created[0]?.id ? String(created[0].id) : null;
        savedText = form.published ? 'Published — it is now on your website.' : 'Saved as a draft.';
      }
      setNotice({ type: 'success', text: savedText });
      await discardSessionUploads([finalVideoUrl || '', finalThumbnail]);
      setShowForm(false);
      setEditing(null);
      setLocalPreviewUrl(null);
      // No thumbnail chosen: fetch the original cover, or apply a branded one, automatically.
      if (savedId && !finalThumbnail && effectiveMediaType !== 'youtube') {
        void autoThumbnail(savedId, savedText);
      }
    } catch (err: any) {
      setFormError(friendlyError(err, 'Save reel', 'Your reel could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Automatic thumbnails
  // ---------------------------------------------------------------------------
  const describeSummary = (s: ThumbnailSummary): string => {
    const parts: string[] = [];
    if (s.original) parts.push(`${s.original} original Instagram cover${s.original === 1 ? '' : 's'} added`);
    if (s.frame) parts.push(`${s.frame} thumbnail${s.frame === 1 ? '' : 's'} created from video`);
    if (s.branded) parts.push(`${s.branded} branded thumbnail${s.branded === 1 ? '' : 's'} applied`);
    if (s.failed) parts.push(`${s.failed} could not be updated — please try again`);
    return parts.join(' · ');
  };

  /** Runs after saving an entry without a thumbnail. Never replaces a hand-picked image. */
  const autoThumbnail = async (id: string, savedText: string) => {
    const fresh = await refetch();
    const reel = fresh.find(r => r.id === id);
    if (!reel) return;
    setNotice({ type: 'info', text: `${savedText} Fetching Reel thumbnail…` });
    const result = await fixThumbnails([reel], text => setNotice({ type: 'info', text }));
    if (result.original) setNotice({ type: 'success', text: `${savedText} Thumbnail added from the original Instagram cover.` });
    else if (result.frame) setNotice({ type: 'success', text: `${savedText} Thumbnail successfully generated from the video.` });
    else if (result.branded) setNotice({ type: 'success', text: `${savedText} Original cover unavailable; branded thumbnail applied.` });
    else if (result.failed) setNotice({ type: 'error', text: `${savedText} The thumbnail could not be created — use "Generate Missing Thumbnails" to try again.` });
    else setNotice({ type: 'success', text: savedText });
  };

  const missingThumbnailCount = reels.filter(r => getReelMediaType(r) !== 'youtube' && thumbnailKind(r.thumbnail_url) === 'missing').length;

  const handleGenerateMissing = async () => {
    setNotice({ type: 'info', text: 'Checking your reels for missing thumbnails…' });
    const result = await fixThumbnails(reels, text => setNotice({ type: 'info', text }));
    const changed = result.original + result.frame + result.branded;
    const detail = describeSummary(result);
    if (!changed && !result.failed) {
      setNotice({ type: 'success', text: 'Every reel already has a thumbnail. Nothing needed changing.' });
    } else {
      setNotice({
        type: result.failed && !changed ? 'error' : 'success',
        text: `${detail}.${result.branded && result.originalsUnavailable ? ' Original Instagram covers need the Instagram connection set up by your developer.' : ''}`,
      });
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
      setNotice({ type: 'error', text: friendlyError(err, 'Reel quick action', 'That change could not be saved. Please try again.') });
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
      publish ? 'Reel published successfully.' : 'Reel hidden from the website (saved as a draft).');
  };

  const moveReel = (reel: InstagramReel, direction: -1 | 1) =>
    runQuickAction(reel.id, () => move(reel.id, direction), 'Display order updated.');

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await remove(confirmDelete.id);
      setNotice({ type: 'success', text: 'Reel deleted.' });
      setConfirmDelete(null);
    } catch (err: any) {
      setNotice({ type: 'error', text: friendlyError(err, 'Delete reel', 'The reel could not be deleted. Please try again.') });
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
      if (!token) throw new Error('Session expired');
      const res = await fetch('/api/instagram-sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) throw Object.assign(new Error(body?.error || `Instagram import failed (HTTP ${res.status})`), { status: res.status });
      await refetch();
      setNotice({
        type: 'success',
        text: body.imported > 0
          ? `Imported ${body.imported} new reel${body.imported === 1 ? '' : 's'} from Instagram as drafts. Review and publish them below.`
          : 'No new reels found on Instagram.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', text: friendlyError(err, 'Instagram import', 'Importing from Instagram is not available right now. You can still add reels by pasting their links.') });
    } finally {
      setSyncing(false);
    }
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-3 sm:py-2.5 text-base sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const labelBase = 'block text-sm sm:text-xs font-semibold text-on-surface-variant uppercase tracking-wider';
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
              : notice.type === 'info'
                ? 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                : 'bg-error/10 border-error/30 text-error'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : notice.type === 'info' ? <Loader2 size={16} className="shrink-0 animate-spin" /> : <AlertTriangle size={16} className="shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl p-4 text-xs flex items-start gap-2.5">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>Saving is not available in this preview.</span>
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
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Films &amp; Reels</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">
            Upload a video, add an Instagram reel or paste a YouTube Short. Published + Featured items appear in the homepage "Latest Films &amp; Reels" section (first {HOMEPAGE_REEL_LIMIT} by order).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {INSTAGRAM_IMPORT_ENABLED && (
          <button
            onClick={handleInstagramSync}
            disabled={syncing || !isSupabaseConfigured}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-outline-variant/40 text-on-surface text-sm font-semibold rounded-lg hover:border-tertiary/60 hover:text-tertiary transition-colors cursor-pointer disabled:opacity-50"
            title="Bring in your newest Instagram reels as drafts"
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Import from Instagram
          </button>
          )}
          <button
            onClick={() => void handleGenerateMissing()}
            disabled={fixingThumbnails || !isSupabaseConfigured || reels.length === 0}
            className="flex items-center gap-2 px-3.5 py-2.5 border border-outline-variant/40 text-on-surface text-sm font-semibold rounded-lg hover:border-tertiary/60 hover:text-tertiary transition-colors cursor-pointer disabled:opacity-50"
            title="Fetch original covers or create branded thumbnails for reels without one. Images you uploaded are never replaced."
          >
            {fixingThumbnails ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />} Generate Missing Thumbnails
            {missingThumbnailCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-tertiary text-on-tertiary">{missingThumbnailCount}</span>}
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
          <span>Loading reels…</span>
        </div>
      ) : visibleReels.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">{reels.length === 0 ? 'No reels yet' : 'Nothing in this view'}</p>
          <p className="text-on-surface-variant text-xs mt-1">
            {reels.length === 0 ? 'Click "Add Reel / Video" to upload a video, add an Instagram reel or paste a YouTube link.' : 'Try another filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleReels.map(reel => {
            const position = reels.findIndex(r => r.id === reel.id);
            const instagramUrl = reel.instagram_url || reel.url || '';
            const thumb = getReelPoster(reel);
            const isPublished = reel.status === 'configured';
            const isFeatured = Boolean(reel.is_featured ?? reel.featured);
            const type = getReelMediaType(reel);
            const missingMedia = !hasPlayableMedia(reel);
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
                  <AdminReelThumb src={thumb} title={reel.title} label={type === 'video' ? 'FILM' : 'REEL'} wide={Boolean(reel.orientation && reel.orientation !== 'portrait')} dim={!isPublished} />
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
                      {type === 'instagram' ? <InstagramIcon size={9} /> : type === 'youtube' ? <Play size={9} fill="currentColor" /> : <Film size={9} />}{' '}
                      {type === 'video' ? (isValidInstagramUrl(instagramUrl) ? 'Instagram + video' : 'Upload') : type === 'youtube' ? 'YouTube' : 'Instagram link'} · {ORIENTATION_LABEL[reel.orientation || 'portrait']}
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
                  <p className="text-[10px] text-on-surface-variant -mt-1.5">
                    Order #{reel.display_order ?? 0} · {type === 'youtube' && !reel.thumbnail_url ? 'YouTube thumbnail' : THUMBNAIL_LABEL[thumbnailKind(reel.thumbnail_url)]}
                  </p>

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto" onClick={() => void closeForm()}>
          <div role="dialog" aria-modal="true" aria-labelledby="reel-form-title" className="bg-surface-container-low sm:rounded-2xl max-w-xl w-full min-h-full sm:min-h-0 px-4 pt-5 pb-0 sm:p-6 border-0 sm:border border-outline-variant/30 space-y-5 sm:my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <div>
                <h3 id="reel-form-title" className="font-display text-lg font-bold text-on-surface">{editing ? 'Edit Reel / Video' : 'Add Reel / Video'}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Uploaded videos play on your website most reliably.</p>
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
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30" role="radiogroup" aria-label="Video source">
              {([
                ['upload', 'Upload video', <VideoIcon key="v" size={14} />],
                ['instagram', 'Instagram reel', <InstagramIcon key="i" size={14} />],
                ['youtube', 'YouTube', <Play key="y" size={14} />],
              ] as Array<[ReelSource, string, React.ReactNode]>).map(([key, label, icon]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={form.source === key}
                  onClick={() => { setForm(f => ({ ...f, source: key })); setYoutubePreview(false); }}
                  className={`py-2 px-1 rounded-lg text-[11px] sm:text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer ${form.source === key ? 'bg-tertiary text-on-tertiary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {form.source === 'instagram' && (
                <div>
                  <label className={labelClass} htmlFor="reel-ig-url">Instagram reel or post link *</label>
                  <div className="relative">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                    <input id="reel-ig-url" type="url" inputMode="url" value={form.instagramUrl} onChange={e => setForm({ ...form, instagramUrl: e.target.value })} placeholder="https://www.instagram.com/reel/..." className={`${inputClass} pl-9`} />
                  </div>
                  {!instagramUrlValid && (
                    <p className="text-[11px] text-error mt-1">Use a link to a single reel or post, e.g. instagram.com/reel/ABC123/ or instagram.com/p/ABC123/.</p>
                  )}
                </div>
              )}

              {form.source === 'youtube' && (
                <div>
                  <label className={labelClass} htmlFor="reel-yt-url">YouTube Shorts or video link *</label>
                  <div className="relative">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                    <input id="reel-yt-url" type="url" inputMode="url" value={form.youtubeUrl} onChange={e => handleYouTubeUrl(e.target.value)} placeholder="https://www.youtube.com/shorts/..." className={`${inputClass} pl-9`} />
                  </div>
                  {!youtubeUrlValid ? (
                    <p className="text-[11px] text-error mt-1">This isn't a YouTube video link. Paste a link like youtube.com/shorts/…, youtube.com/watch?v=… or youtu.be/….</p>
                  ) : parsedYouTube ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> {parsedYouTube.isShort ? 'YouTube Short' : 'YouTube video'} found — it will play inside your website using YouTube's player.
                    </p>
                  ) : null}
                </div>
              )}

              {/* Video file: required for Upload, optional (recommended) for Instagram */}
              {form.source !== 'youtube' && (
                <div className="p-3.5 bg-surface-container-lowest/80 rounded-xl border border-outline-variant/40 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                      <VideoIcon size={14} className="text-tertiary" /> {form.source === 'upload' ? 'Video file *' : 'Original video (recommended)'}
                    </span>
                    <label className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tertiary/40 text-tertiary hover:bg-tertiary/10 ${videoStage ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                      {videoStage ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      <span>{form.videoUrl ? 'Replace video' : 'Select video'}</span>
                      <input type="file" accept={ALLOWED_REEL_VIDEO_TYPES.join(',')} onChange={handleVideoFile} disabled={Boolean(videoStage)} className="hidden" aria-label={form.videoUrl ? 'Replace video' : 'Select video'} />
                    </label>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {form.source === 'instagram'
                      ? 'Add the same video you posted on Instagram so visitors can watch it on your website. '
                      : ''}
                    MP4 recommended · WebM or MOV accepted · max {formatFileSize(MAX_REEL_VIDEO_BYTES)}. A thumbnail is created automatically.
                  </p>
                  {videoStage && (
                    <p className="text-[11px] text-tertiary font-semibold flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> {videoStage}</p>
                  )}
                  {!videoStage && form.videoUrl && (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5"><CheckCircle2 size={12} /> Video uploaded</p>
                      {form.source === 'instagram' && (
                        <button type="button" onClick={() => { setForm(f => ({ ...f, videoUrl: '' })); setLocalPreviewUrl(null); localFile.current = null; }} className="text-[11px] text-on-surface-variant hover:text-error underline cursor-pointer">Remove video</button>
                      )}
                    </div>
                  )}
                  {videoWarning && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5"><Info size={12} className="shrink-0 mt-0.5" /> {videoWarning}</p>
                  )}
                </div>
              )}

              {form.source === 'instagram' && !form.videoUrl && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400 text-[11px] flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>Without the original video, Instagram decides where this reel can play — visitors will see your cover image and open it on Instagram. Upload the video above to play it on your website.</span>
                </div>
              )}

              {form.detectedNote && form.source !== 'youtube' && form.videoUrl && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0" />
                  <span className="font-medium">{form.detectedNote}</span>
                </div>
              )}

              {/* Thumbnail / cover image */}
              <div>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <span className={labelBase}>{form.source === 'instagram' && !form.videoUrl ? 'Cover image (optional)' : 'Thumbnail'}</span>
                  <div className="flex items-center gap-3">
                    {(localPreviewUrl || form.videoUrl) && form.source !== 'youtube' && (
                      <button type="button" onClick={() => void regenerateThumbnail()} disabled={framing || Boolean(videoStage)} className="text-xs text-tertiary font-semibold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50">
                        {framing ? <Loader2 size={12} className="animate-spin" /> : <Film size={12} />} Use a frame from the video
                      </button>
                    )}
                    <label className={`text-xs text-tertiary font-semibold flex items-center gap-1 ${thumbStorage.uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:underline'}`}>
                      {thumbStorage.uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      <span>{thumbStorage.uploading ? 'Uploading…' : form.thumbnail ? 'Replace image' : 'Upload image'}</span>
                      <input type="file" accept={ALLOWED_REEL_THUMBNAIL_TYPES.join(',')} onChange={handleThumbnailFile} disabled={thumbStorage.uploading} className="hidden" aria-label="Upload thumbnail image" />
                    </label>
                  </div>
                </div>
                {(() => {
                  const shown = form.thumbnail || (form.source === 'youtube' && parsedYouTube ? getYouTubeThumbnail(parsedYouTube.id, form.orientation) : '');
                  return (
                    <div className="flex gap-3 items-center">
                      <div className="w-16 aspect-[9/16] rounded-md border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shrink-0 flex items-center justify-center">
                        {shown
                          ? <img src={shown} alt="Thumbnail preview" className={`w-full h-full ${form.orientation === 'portrait' ? 'object-cover' : 'object-contain'}`} />
                          : form.source === 'instagram' ? <span className="relative block w-full h-full"><BrandedReelPoster title={form.title} /></span> : <ImageIcon size={18} className="text-on-surface-variant/40" />}
                      </div>
                      <p className="text-[11px] text-on-surface-variant flex-1">
                        {form.thumbnail
                          ? 'This image is shown on the card before the video plays.'
                          : form.source === 'youtube'
                            ? (parsedYouTube ? "Using YouTube's thumbnail. Upload an image to replace it." : "YouTube's thumbnail appears here once you paste a link.")
                            : form.source === 'upload' || form.videoUrl
                              ? 'Created automatically from your video after upload. You can replace it.'
                              : "Optional. When you save, the original Instagram cover is added automatically if your Instagram account is connected; otherwise a branded thumbnail like this one is created."}
                        {' '}JPG, PNG or WebP · large photos are resized automatically.
                      </p>
                    </div>
                  );
                })()}
                {form.thumbnailHint && form.thumbnailHint.orientation !== form.orientation && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, orientationTouched: true, orientation: f.thumbnailHint!.orientation, aspect_ratio_label: ORIENTATION_LABEL[f.thumbnailHint!.orientation] }))}
                    className="w-full mt-2 text-left p-2 rounded-lg bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs flex items-center justify-between hover:bg-tertiary/15 transition-colors cursor-pointer"
                  >
                    <span>Image is {form.thumbnailHint.width}×{form.thumbnailHint.height} ({form.thumbnailHint.orientation})</span>
                    <span className="underline font-semibold text-[11px]">Use this orientation</span>
                  </button>
                )}
              </div>

              {/* Preview before publishing */}
              {effectiveMediaType === 'video' && previewVideoSrc && (
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
              {form.source === 'youtube' && parsedYouTube && (
                <div>
                  <span className={labelClass}>Preview</span>
                  {youtubePreview ? (
                    <div className="relative mx-auto rounded-xl overflow-hidden border border-outline-variant/30 bg-black" style={{ aspectRatio: String(getReelAspectRatio(form)), width: `min(100%, calc(45vh * ${getReelAspectRatio(form).toFixed(4)}))` }}>
                      <InlineYouTubePlayer key={parsedYouTube.id} videoId={parsedYouTube.id} title={form.title || 'YouTube preview'} watchUrl={parsedYouTube.canonicalUrl} />
                    </div>
                  ) : (
                    <button type="button" onClick={() => setYoutubePreview(true)} className="w-full py-2.5 rounded-lg border border-tertiary/40 text-tertiary text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-tertiary/10 cursor-pointer">
                      <Play size={13} fill="currentColor" /> Preview the YouTube player
                    </button>
                  )}
                </div>
              )}
              {effectiveMediaType === 'instagram' && trimmedInstagramUrl && instagramUrlValid && (
                <div>
                  <span className={labelClass}>Instagram preview</span>
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
                  <span><strong className="font-semibold">Featured</strong> — show in the homepage "Latest Films &amp; Reels" section (when published).</span>
                </label>
              </div>

              {/* Advanced settings */}
              <div className="border border-outline-variant/30 rounded-xl">
                <button type="button" onClick={() => setAdvancedOpen(o => !o)} aria-expanded={advancedOpen} className="w-full flex items-center justify-between px-3.5 py-3 text-xs font-semibold text-on-surface cursor-pointer">
                  <span>Advanced settings <span className="font-normal text-on-surface-variant">— title, description, orientation, order{form.source !== 'instagram' ? ', Instagram link' : ''}</span></span>
                  {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {advancedOpen && (
                  <div className="px-3.5 pb-4 space-y-4 border-t border-outline-variant/20 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3">
                      <div>
                        <label className={labelClass} htmlFor="reel-title">Title (optional)</label>
                        <input id="reel-title" type="text" value={form.title} maxLength={120} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Royal Wedding Highlights" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor="reel-order">Order</label>
                        <input id="reel-order" type="number" min={0} step={1} value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="reel-description">Description (optional)</label>
                      <textarea id="reel-description" rows={2} maxLength={500} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A sentence about this film — helps search engines and screen readers." className={inputClass} />
                    </div>
                    {form.source !== 'instagram' && (
                      <div>
                        <label className={labelClass} htmlFor="reel-ig-url">Also on Instagram (optional)</label>
                        <div className="relative">
                          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                          <input id="reel-ig-url" type="url" inputMode="url" value={form.instagramUrl} onChange={e => setForm({ ...form, instagramUrl: e.target.value })} placeholder="https://www.instagram.com/reel/..." className={`${inputClass} pl-9`} />
                        </div>
                        {!instagramUrlValid
                          ? <p className="text-[11px] text-error mt-1">Use a link to a single reel or post, e.g. instagram.com/reel/ABC123/.</p>
                          : <p className="text-[11px] text-on-surface-variant mt-1">Adds a small Instagram link to the card.</p>}
                      </div>
                    )}
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
                            onClick={() => setForm(f => ({ ...f, orientationTouched: true, orientation: o, aspect_ratio_label: ORIENTATION_LABEL[o] }))}
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
                        {effectiveMediaType === 'video'
                          ? 'Detected from the video file; change only if it looks wrong.'
                          : effectiveMediaType === 'youtube'
                            ? 'Shorts are portrait; other YouTube videos are usually landscape.'
                            : 'Most Instagram reels are 9:16 portrait.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 sm:pt-4 bg-surface-container-low flex justify-end gap-2.5 border-t border-outline-variant/30">
              <button type="button" onClick={() => void closeForm()} disabled={saving || Boolean(videoStage)} className="flex-1 sm:flex-none px-4 py-3 sm:py-2 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploadingAnything || !instagramUrlValid || !youtubeUrlValid}
                className="flex-1 sm:flex-none justify-center px-5 py-3 sm:py-2 rounded-lg bg-tertiary text-on-tertiary text-sm sm:text-xs font-semibold hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving changes...</> : editing ? 'Save changes' : form.published ? 'Save & publish' : 'Save draft'}
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
                  {getReelMediaType(confirmDelete) === 'video' ? ', and its uploaded video and thumbnail files will be deleted' : ''}. Nothing is removed from Instagram or YouTube. This cannot be undone.
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

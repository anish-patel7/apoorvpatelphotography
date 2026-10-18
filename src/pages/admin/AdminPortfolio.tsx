import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus, Edit3, Trash2, Star, X, AlertTriangle, Upload, Loader2, CheckCircle2, Image as ImageIcon, Camera,
  Eye, EyeOff, Link2, Film, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Tags, Play, Globe,
} from 'lucide-react';
import InstagramIcon from '../../components/icons/InstagramIcon';
import {
  usePortfolioAdmin, usePortfolioCategories, generateAutoTitle, generateUniqueSlug, getProjectCover,
  type Project, type PortfolioMediaItem,
} from '../../hooks/usePortfolio';
import { useStorage, getStoragePathFromPublicUrl } from '../../hooks/useStorage';
import { isSupabaseConfigured } from '../../lib/supabase';
import { friendlyError } from '../../lib/adminErrors';
import { parseWorkLink, WORK_LINK_LABEL } from '../../utils/workLinks';
import { captureVideoFrame, detectImageDimensions, detectVideoDimensions, classifyOrientation } from '../../utils/videoOrientation';
import { formatFileSize } from '../../utils/reelMedia';

const PHOTO_BUCKET = 'portfolio-images';
const VIDEO_BUCKET = 'portfolio-videos';
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

interface MediaDraft extends PortfolioMediaItem {
  key: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  /** Local blob: preview while uploading. Never saved. */
  preview?: string;
  name?: string;
  error?: string;
}

interface WorkForm {
  category: string;
  title: string;
  link: string;
  description: string;
  location: string;
  cover: string;
  featured: boolean;
  published: boolean;
  displayOrder: string;
}

const emptyForm = (category: string): WorkForm => ({
  category,
  title: '',
  link: '',
  description: '',
  location: '',
  cover: '',
  featured: false,
  published: true,
  displayOrder: '0',
});

let keySeq = 0;
const nextKey = () => `m${Date.now().toString(36)}${(keySeq++).toString(36)}`;
const uploadFolder = () => {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminPortfolio() {
  const { projects, loading, error: loadError, create, update, remove, move } = usePortfolioAdmin();
  const cats = usePortfolioCategories();
  const photoStorage = useStorage(PHOTO_BUCKET);
  const videoStorage = useStorage(VIDEO_BUCKET);

  const activeCategories = cats.categories.filter(c => c.is_active);
  const defaultCategory = activeCategories[0]?.name || '';

  const [listFilter, setListFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [form, setForm] = useState<WorkForm>(() => emptyForm(''));
  const [media, setMedia] = useState<MediaDraft[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // Files uploaded while the form is open; removed from storage if not saved.
  const sessionUploads = useRef<string[]>([]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), notice.type === 'error' ? 7000 : 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const linkResult = useMemo(() => parseWorkLink(form.link), [form.link]);
  const uploadingCount = media.filter(m => m.status === 'uploading').length;
  const doneMedia = media.filter(m => m.status === 'done');
  const overallProgress = media.length ? Math.round((media.reduce((s, m) => s + (m.status === 'uploading' ? m.progress : 1), 0) / media.length) * 100) : 0;
  const hasWork = doneMedia.length > 0 || Boolean(linkResult.info);

  const visibleProjects = listFilter === 'All' ? projects : projects.filter(p => p.category === listFilter);
  const countByCategory = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach(p => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    return map;
  }, [projects]);

  // ---------------------------------------------------------------------------
  // Storage helpers
  // ---------------------------------------------------------------------------
  const deleteStoredFile = async (url: string | null | undefined, exceptProjectId?: string) => {
    if (!url) return;
    const usedElsewhere = projects.some(p =>
      p.id !== exceptProjectId && (p.cover_image === url || p.media.some(m => m.url === url || m.poster === url))
    );
    if (usedElsewhere) return;
    if (getStoragePathFromPublicUrl(PHOTO_BUCKET, url)) await photoStorage.removeByPublicUrl(url);
    else if (getStoragePathFromPublicUrl(VIDEO_BUCKET, url)) await videoStorage.removeByPublicUrl(url);
  };

  const discardSessionUploads = async (keep: string[] = []) => {
    const toDelete = sessionUploads.current.filter(u => !keep.includes(u));
    sessionUploads.current = [];
    await Promise.all(toDelete.map(u => deleteStoredFile(u)));
  };

  const patchMedia = (key: string, patch: Partial<MediaDraft>) =>
    setMedia(prev => prev.map(m => (m.key === key ? { ...m, ...patch } : m)));

  // ---------------------------------------------------------------------------
  // Form lifecycle
  // ---------------------------------------------------------------------------
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(defaultCategory));
    setMedia([]);
    setMode('upload');
    setAdvancedOpen(false);
    setFormError(null);
    sessionUploads.current = [];
    setShowForm(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    const link = p.external_url || p.instagram_url || '';
    setForm({
      category: p.category,
      title: p.is_auto_title ? '' : p.title,
      link,
      description: p.description || '',
      location: p.location || '',
      cover: p.cover_image || '',
      featured: Boolean(p.is_featured ?? p.featured),
      published: p.is_published ?? true,
      displayOrder: String(p.display_order ?? 0),
    });
    setMedia(p.media.map(m => ({ ...m, key: nextKey(), status: 'done', progress: 1 })));
    setMode(p.media.length === 0 && link ? 'link' : 'upload');
    setAdvancedOpen(false);
    setFormError(null);
    sessionUploads.current = [];
    setShowForm(true);
  };

  const closeForm = async () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    media.forEach(m => m.preview && URL.revokeObjectURL(m.preview));
    setMedia([]);
    await discardSessionUploads();
  };

  // ---------------------------------------------------------------------------
  // Uploads
  // ---------------------------------------------------------------------------
  const uploadPhoto = async (file: File, key: string) => {
    const dims = await detectImageDimensions(file).catch(() => null);
    const { publicUrl } = await photoStorage.uploadFile(file, {
      allowedTypes: PHOTO_TYPES,
      maxBytes: MAX_PHOTO_BYTES,
      folder: uploadFolder(),
      onProgress: f => patchMedia(key, { progress: f }),
    });
    sessionUploads.current.push(publicUrl);
    patchMedia(key, { url: publicUrl, status: 'done', progress: 1, width: dims?.width ?? null, height: dims?.height ?? null });
  };

  const uploadVideo = async (file: File, key: string) => {
    const dims = await detectVideoDimensions(file);
    let poster: string | null = null;
    const frame = await captureVideoFrame(file);
    if (frame) {
      try {
        const posterFile = new File([frame], `${file.name.replace(/\.[^/.]+$/, '')}-poster.jpg`, { type: 'image/jpeg' });
        poster = (await photoStorage.uploadFile(posterFile, { allowedTypes: PHOTO_TYPES, maxBytes: MAX_PHOTO_BYTES, folder: uploadFolder() })).publicUrl;
        sessionUploads.current.push(poster);
      } catch (err) {
        friendlyError(err, 'Portfolio video poster');
      }
    }
    const { publicUrl } = await videoStorage.uploadFile(file, {
      allowedTypes: VIDEO_TYPES,
      maxBytes: MAX_VIDEO_BYTES,
      folder: uploadFolder(),
      onProgress: f => patchMedia(key, { progress: f }),
    });
    sessionUploads.current.push(publicUrl);
    patchMedia(key, {
      url: publicUrl,
      poster,
      status: 'done',
      progress: 1,
      width: dims.detected ? dims.video_width : null,
      height: dims.detected ? dims.video_height : null,
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setFormError(null);

    const drafts: Array<{ file: File; draft: MediaDraft }> = [];
    const rejected: string[] = [];
    for (const file of files) {
      const isVideo = VIDEO_TYPES.includes(file.type);
      const isPhoto = PHOTO_TYPES.includes(file.type);
      if (!isVideo && !isPhoto) { rejected.push(`"${file.name}" is not a supported photo or video.`); continue; }
      const limit = isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
      if (file.size > limit) { rejected.push(`"${file.name}" is ${formatFileSize(file.size)} — the limit is ${formatFileSize(limit)}.`); continue; }
      drafts.push({
        file,
        draft: { key: nextKey(), url: '', type: isVideo ? 'video' : 'image', status: 'uploading', progress: 0, preview: URL.createObjectURL(file), name: file.name },
      });
    }
    if (rejected.length) setFormError(rejected.join(' '));
    if (drafts.length === 0) return;
    setMedia(prev => [...prev, ...drafts.map(d => d.draft)]);

    // Upload two at a time so several photos finish quickly without overloading mobile data.
    const queue = [...drafts];
    const failures: string[] = [];
    const worker = async () => {
      for (let item = queue.shift(); item; item = queue.shift()) {
        const { file, draft } = item;
        try {
          if (draft.type === 'video') await uploadVideo(file, draft.key);
          else await uploadPhoto(file, draft.key);
        } catch (err) {
          const message = friendlyError(err, 'Portfolio upload', `"${file.name}" could not be uploaded.`);
          failures.push(message);
          patchMedia(draft.key, { status: 'error', error: message });
        }
      }
    };
    await Promise.all([worker(), worker()]);
    // Show why uploads failed (tile tooltips aren't visible on phones).
    if (failures.length) setFormError([...rejected, ...Array.from(new Set(failures))].join(' '));
  };

  const removeMedia = async (key: string) => {
    const item = media.find(m => m.key === key);
    setMedia(prev => prev.filter(m => m.key !== key));
    if (!item) return;
    if (item.preview) URL.revokeObjectURL(item.preview);
    if (form.cover && (form.cover === item.url || form.cover === item.poster)) setForm(f => ({ ...f, cover: '' }));
    // Files uploaded in this session can be deleted straight away; saved ones are cleaned up on save.
    for (const url of [item.url, item.poster]) {
      if (url && sessionUploads.current.includes(url)) {
        sessionUploads.current = sessionUploads.current.filter(u => u !== url);
        await deleteStoredFile(url);
      }
    }
  };

  const moveMedia = (key: string, dir: -1 | 1) =>
    setMedia(prev => {
      const i = prev.findIndex(m => m.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFormError(null);
    try {
      const { publicUrl } = await photoStorage.uploadFile(file, { allowedTypes: PHOTO_TYPES, maxBytes: MAX_PHOTO_BYTES, folder: uploadFolder() });
      sessionUploads.current.push(publicUrl);
      setForm(f => ({ ...f, cover: publicUrl }));
    } catch (err) {
      setFormError(friendlyError(err, 'Portfolio cover upload', 'The cover image could not be uploaded.'));
    }
  };

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const handleSave = async (publishOverride?: boolean) => {
    setFormError(null);
    const published = publishOverride ?? form.published;

    if (!form.category) { setFormError('Please choose a work category.'); return; }
    if (uploadingCount > 0) { setFormError('Please wait until your uploads have finished.'); return; }
    if (linkResult.error) { setFormError(linkResult.error); return; }
    if (!hasWork) { setFormError('Please upload at least one photo or video, or paste a work link.'); return; }

    const link = linkResult.info;
    const items: PortfolioMediaItem[] = doneMedia.map(({ url, type, poster, width, height }) => ({ url, type, poster, width, height }));
    // Direct image/video links become gallery items.
    if (link && (link.kind === 'image' || link.kind === 'video') && !items.some(m => m.url === link.url)) {
      items.push({ url: link.url, type: link.kind });
    }

    const typedTitle = form.title.trim();
    const isAutoTitle = !typedTitle;
    const title = typedTitle || (editing?.is_auto_title ? editing.title : generateAutoTitle(form.category));
    const coverCandidates = items.flatMap(m => (m.type === 'image' ? [m.url] : m.poster ? [m.poster] : []));
    const cover = form.cover && (coverCandidates.includes(form.cover) || sessionUploads.current.includes(form.cover) || form.cover === editing?.cover_image)
      ? form.cover
      : coverCandidates[0] || '';
    const firstWithSize = items.find(m => m.width && m.height);
    const order = Number.parseInt(form.displayOrder, 10);

    const instagram = link?.kind === 'instagram' ? link : null;
    const isReel = instagram?.instagramType === 'reel';
    const external = link && ['youtube', 'vimeo', 'website'].includes(link.kind) ? link.url : null;

    const payload: Partial<Project> = {
      title,
      is_auto_title: isAutoTitle,
      category: form.category,
      cover_image: cover,
      cover_image_url: cover,
      media: items,
      instagram_url: instagram?.url ?? null,
      video_url: isReel ? instagram!.url : null,
      reel_url: isReel ? instagram!.url : null,
      external_url: external,
      content_type: instagram ? (isReel ? 'reel' : 'post') : 'photo',
      description: form.description.trim(),
      location: form.location.trim(),
      featured: form.featured,
      is_featured: form.featured,
      is_published: published,
      display_order: Number.isFinite(order) ? order : 0,
      video_width: firstWithSize?.width ?? undefined,
      video_height: firstWithSize?.height ?? undefined,
      orientation: firstWithSize ? classifyOrientation(firstWithSize.width!, firstWithSize.height!) : undefined,
    };
    if (!editing) {
      payload.slug = generateUniqueSlug(title);
      payload.date = String(new Date().getFullYear());
      payload.is_real_work = true;
    }

    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, payload);
        // Delete stored files this work no longer uses.
        const kept = new Set([cover, ...items.flatMap(m => [m.url, m.poster || ''])]);
        const old = [editing.cover_image, ...editing.media.flatMap(m => [m.url, m.poster || ''])];
        await Promise.all(old.filter(u => u && !kept.has(u)).map(u => deleteStoredFile(u, editing.id)));
        setNotice({ type: 'success', text: 'Portfolio updated.' });
      } else {
        await create(payload);
        setNotice({ type: 'success', text: published ? 'Work uploaded successfully.' : 'Your work has been saved as a draft.' });
      }
      await discardSessionUploads([cover, ...items.flatMap(m => [m.url, m.poster || ''])]);
      media.forEach(m => m.preview && URL.revokeObjectURL(m.preview));
      setShowForm(false);
      setEditing(null);
      setMedia([]);
    } catch (err) {
      setFormError(friendlyError(err, 'Save portfolio work', 'Your work could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // List actions
  // ---------------------------------------------------------------------------
  const quick = async (p: Project, action: () => Promise<unknown>, success: string) => {
    setBusyId(p.id);
    try {
      await action();
      setNotice({ type: 'success', text: success });
    } catch (err) {
      setNotice({ type: 'error', text: friendlyError(err, 'Portfolio quick action', 'That change could not be saved. Please try again.') });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const target = confirmDelete;
      await remove(target.id);
      await Promise.all([target.cover_image, ...target.media.flatMap(m => [m.url, m.poster || ''])].map(u => deleteStoredFile(u, target.id)));
      setNotice({ type: 'success', text: 'Work deleted.' });
      setConfirmDelete(null);
    } catch (err) {
      setNotice({ type: 'error', text: friendlyError(err, 'Delete portfolio work', 'This work could not be deleted. Please try again.') });
    } finally {
      setDeleting(false);
    }
  };

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-3.5 py-3 sm:py-2.5 text-base sm:text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors';
  const labelClass = 'block text-sm font-semibold text-on-surface mb-2';

  return (
    <div className="space-y-6">
      {notice && (
        <div
          role="status"
          className={`px-4 py-3 rounded-xl flex items-center gap-2.5 text-sm border ${
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
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-xl p-4 text-sm flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>Saving is not available in this preview. Sample work is shown.</span>
        </div>
      )}
      {loadError && (
        <div role="alert" className="bg-error/10 border border-error/30 text-error rounded-xl p-4 text-sm flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Camera size={22} className="text-tertiary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-on-surface">Portfolio</h2>
          </div>
          <p className="text-on-surface-variant text-sm mt-1">Upload your latest photography and films. Published work appears on the website straight away.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 border border-outline-variant/40 text-on-surface text-sm font-semibold rounded-lg hover:border-tertiary/60 hover:text-tertiary transition-colors cursor-pointer"
          >
            <Tags size={16} /> Categories
          </button>
          <button
            onClick={openCreate}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-tertiary text-on-tertiary text-sm font-semibold rounded-lg hover:bg-tertiary-fixed transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={16} /> Add Work
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Filter by category">
        {['All', ...cats.categories.map(c => c.name).filter(n => countByCategory.has(n))].map(name => (
          <button
            key={name}
            role="tab"
            aria-selected={listFilter === name}
            onClick={() => setListFilter(name)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              listFilter === name ? 'bg-tertiary text-on-tertiary border-tertiary' : 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {name} <span className="opacity-70">({name === 'All' ? projects.length : countByCategory.get(name)})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-on-surface-variant text-sm">
          <Loader2 size={24} className="animate-spin mx-auto mb-2 text-tertiary" />
          <span>Loading your portfolio…</span>
        </div>
      ) : visibleProjects.length === 0 ? (
        <div className="text-center py-20 px-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
          <p className="text-on-surface font-semibold text-base">No work here yet</p>
          <p className="text-on-surface-variant text-sm mt-1">Tap "Add Work" to upload photos or videos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visibleProjects.map(p => {
            const cover = getProjectCover(p);
            const isFeatured = Boolean(p.is_featured ?? p.featured);
            const isPublished = p.is_published ?? true;
            const photos = p.media.filter(m => m.type === 'image').length;
            const videos = p.media.filter(m => m.type === 'video').length;
            const position = projects.findIndex(x => x.id === p.id);
            const busy = busyId === p.id;

            return (
              <div key={p.id} className={`bg-surface-container-low rounded-xl overflow-hidden border shadow-xs flex flex-col ${isPublished ? 'border-outline-variant/30' : 'border-dashed border-amber-500/50'}`}>
                <div className="aspect-[4/3] relative bg-surface-container-lowest overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={p.display_title} loading="lazy" className={`w-full h-full object-cover ${isPublished ? '' : 'opacity-70'}`} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
                      {p.instagram_url ? <InstagramIcon size={30} /> : p.external_url ? <Globe size={30} /> : <ImageIcon size={30} />}
                      <span className="text-xs">{p.instagram_url ? 'Instagram work' : p.external_url ? 'Work link' : 'No cover'}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white border border-white/20">{p.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${isPublished ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-black'}`}>
                      {isPublished ? <Eye size={10} /> : <EyeOff size={10} />} {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {isFeatured && (
                    <span className="absolute top-2 right-2 bg-tertiary text-on-tertiary p-1.5 rounded-full" title="Featured on homepage"><Star size={12} fill="currentColor" /></span>
                  )}
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 text-white/90 flex items-center gap-1.5">
                    {photos > 0 && <span className="flex items-center gap-0.5"><ImageIcon size={10} /> {photos}</span>}
                    {videos > 0 && <span className="flex items-center gap-0.5"><Film size={10} /> {videos}</span>}
                    {p.instagram_url && <InstagramIcon size={10} />}
                    {p.external_url && <Link2 size={10} />}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3">
                  <h3 className="font-display font-semibold text-base text-on-surface truncate" title={p.display_title}>{p.display_title}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => quick(p, () => update(p.id, { is_published: !isPublished }), isPublished ? 'Hidden from the website (saved as a draft).' : 'Published to the website.')}
                      disabled={busy}
                      className={`text-xs font-semibold px-2 py-2 rounded-md border transition-colors cursor-pointer disabled:opacity-40 ${isPublished ? 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface' : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'}`}
                    >
                      {isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => quick(p, () => update(p.id, { is_featured: !isFeatured }), isFeatured ? 'Removed from the homepage.' : 'Featured on the homepage.')}
                      disabled={busy}
                      title="Toggle Featured"
                      className={`text-xs font-semibold px-2 py-2 rounded-md border transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1 ${isFeatured ? 'border-tertiary/50 text-tertiary hover:bg-tertiary/10' : 'border-outline-variant/40 text-on-surface-variant hover:text-on-surface'}`}
                    >
                      <Star size={12} fill={isFeatured ? 'currentColor' : 'none'} /> {isFeatured ? 'Featured' : 'Feature'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 pt-2 border-t border-outline-variant/20 mt-auto">
                    <button onClick={() => openEdit(p)} disabled={busy} className="p-2 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container cursor-pointer" title="Edit" aria-label={`Edit ${p.display_title}`}>
                      <Edit3 size={16} />
                    </button>
                    {listFilter === 'All' && (
                      <>
                        <button onClick={() => quick(p, () => move(p.id, -1), 'Order updated.')} disabled={busy || position === 0} className="p-2 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container cursor-pointer disabled:opacity-30" title="Move earlier" aria-label="Move earlier"><ArrowUp size={16} /></button>
                        <button onClick={() => quick(p, () => move(p.id, 1), 'Order updated.')} disabled={busy || position === projects.length - 1} className="p-2 rounded-md text-on-surface-variant hover:text-tertiary hover:bg-surface-container cursor-pointer disabled:opacity-30" title="Move later" aria-label="Move later"><ArrowDown size={16} /></button>
                      </>
                    )}
                    {busy && <Loader2 size={14} className="animate-spin text-tertiary" />}
                    <button onClick={() => setConfirmDelete(p)} disabled={busy} className="p-2 rounded-md text-on-surface-variant hover:text-error hover:bg-surface-container cursor-pointer ml-auto" title="Delete" aria-label={`Delete ${p.display_title}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== Add / Edit Work ===================== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto" onClick={() => void closeForm()}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="work-form-title"
            className="bg-surface-container-low sm:rounded-2xl max-w-xl w-full min-h-full sm:min-h-0 px-4 pt-5 sm:p-6 border-0 sm:border border-outline-variant/30 space-y-5 sm:my-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <h3 id="work-form-title" className="font-display text-xl font-bold text-on-surface">{editing ? 'Edit Work' : 'Add Work'}</h3>
              <button onClick={() => void closeForm()} aria-label="Close" className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"><X size={20} /></button>
            </div>

            {formError && (
              <div role="alert" className="p-3 bg-error/15 border border-error/30 rounded-xl text-error text-sm flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Category */}
            <div>
              <label htmlFor="work-category" className={labelClass}>Work category <span className="text-tertiary">*</span></label>
              <select
                id="work-category"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                {!form.category && <option value="">Choose a category…</option>}
                {[...activeCategories.map(c => c.name), ...(form.category && !activeCategories.some(c => c.name === form.category) ? [form.category] : [])].map(name => (
                  <option key={name} value={name} className="bg-surface-container text-on-surface">{name}</option>
                ))}
              </select>
            </div>

            {/* 2. Add work */}
            <div>
              <span className={labelClass}>Add work <span className="text-tertiary">*</span></span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/30 mb-3">
                {([
                  ['upload', 'Upload Media', <Upload key="u" size={15} />],
                  ['link', 'Add Work Link', <Link2 key="l" size={15} />],
                ] as Array<['upload' | 'link', string, React.ReactNode]>).map(([key, label, icon]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMode(key)}
                    className={`py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${mode === key ? 'bg-tertiary text-on-tertiary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {mode === 'upload' ? (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-outline-variant/50 hover:border-tertiary/60 bg-surface-container-lowest/60 text-center cursor-pointer transition-colors">
                    <Upload size={26} className="text-tertiary" />
                    <span className="text-sm font-semibold text-on-surface">Choose photos or videos</span>
                    <span className="text-xs text-on-surface-variant">You can select several at once · Photos up to 10 MB · Videos (MP4, MOV) up to 50 MB</span>
                    <input type="file" multiple accept={[...PHOTO_TYPES, ...VIDEO_TYPES].join(',')} onChange={handleFiles} className="hidden" />
                  </label>

                  {uploadingCount > 0 && (
                    <div aria-live="polite">
                      <div className="flex justify-between text-xs text-on-surface-variant mb-1">
                        <span>Uploading {uploadingCount} file{uploadingCount === 1 ? '' : 's'}…</span>
                        <span>{overallProgress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full bg-tertiary transition-all" style={{ width: `${overallProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {media.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {media.map((m, i) => {
                        const thumb = m.type === 'image' ? (m.url || m.preview) : (m.poster || '');
                        const isCover = Boolean(form.cover) && (form.cover === m.url || form.cover === m.poster);
                        return (
                          <div key={m.key} className={`relative aspect-square rounded-lg overflow-hidden border bg-black ${isCover ? 'border-tertiary ring-2 ring-tertiary/50' : 'border-outline-variant/30'}`}>
                            {thumb ? (
                              <img src={thumb} alt={m.name || `Item ${i + 1}`} className="w-full h-full object-cover" />
                            ) : m.type === 'video' && m.preview ? (
                              <video src={m.preview} muted playsInline className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/60"><Film size={22} /></div>
                            )}
                            {m.type === 'video' && (
                              <span className="absolute top-1 left-1 bg-black/70 text-white rounded px-1 py-0.5 text-[9px] font-bold flex items-center gap-0.5"><Play size={8} fill="currentColor" /> VIDEO</span>
                            )}
                            {isCover && <span className="absolute top-1 right-1 bg-tertiary text-on-tertiary rounded px-1 py-0.5 text-[9px] font-bold">COVER</span>}
                            {m.status === 'uploading' && (
                              <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1 text-white text-[11px] font-semibold">
                                <Loader2 size={18} className="animate-spin" /> {Math.round(m.progress * 100)}%
                              </div>
                            )}
                            {m.status === 'error' && (
                              <div className="absolute inset-0 bg-error/85 flex items-center justify-center p-1 text-center text-white text-[10px] font-semibold" title={m.error}>Upload failed</div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 flex justify-between bg-gradient-to-t from-black/80 to-transparent p-1">
                              <div className="flex">
                                <button type="button" onClick={() => moveMedia(m.key, -1)} disabled={i === 0} aria-label="Move left" className="p-1 text-white disabled:opacity-30 cursor-pointer"><ArrowLeft size={13} /></button>
                                <button type="button" onClick={() => moveMedia(m.key, 1)} disabled={i === media.length - 1} aria-label="Move right" className="p-1 text-white disabled:opacity-30 cursor-pointer"><ArrowRight size={13} /></button>
                              </div>
                              <div className="flex">
                                {m.status === 'done' && (m.type === 'image' || m.poster) && !isCover && (
                                  <button type="button" onClick={() => setForm(f => ({ ...f, cover: m.type === 'image' ? m.url : m.poster! }))} aria-label="Use as cover" title="Use as cover" className="p-1 text-white cursor-pointer"><Star size={13} /></button>
                                )}
                                <button type="button" onClick={() => void removeMedia(m.key)} aria-label={`Remove ${m.name || 'item'}`} className="p-1 text-white cursor-pointer"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {media.length > 0 && (
                    <p className="text-xs text-on-surface-variant">Tap ★ to choose the cover. The first photo is used if you don't choose one.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    inputMode="url"
                    value={form.link}
                    onChange={e => setForm({ ...form, link: e.target.value })}
                    placeholder="Paste an Instagram, YouTube, Vimeo or website link"
                    className={inputClass}
                    aria-label="Work link"
                  />
                  {linkResult.error ? (
                    <p className="text-sm text-error">{linkResult.error}</p>
                  ) : linkResult.info ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> {WORK_LINK_LABEL[linkResult.info.kind]} recognised
                      {linkResult.info.kind === 'website' && ' — visitors will open it in a new tab'}
                    </p>
                  ) : (
                    <p className="text-xs text-on-surface-variant">Instagram posts and reels, YouTube and Vimeo play on your website. Other links open in a new tab.</p>
                  )}
                  {media.length > 0 && (
                    <p className="text-xs text-on-surface-variant">This work also has {media.length} uploaded file{media.length === 1 ? '' : 's'} (see Upload Media).</p>
                  )}
                </div>
              )}
            </div>

            {/* 3. Title (optional) */}
            <div>
              <label htmlFor="work-title" className={labelClass}>Title <span className="text-on-surface-variant font-normal">(optional)</span></label>
              <input
                id="work-title"
                type="text"
                maxLength={120}
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder={form.category ? `Leave blank to use "${form.category} Collection"` : 'e.g. Kensington Garden Wedding'}
                className={inputClass}
              />
            </div>

            {/* 4. Advanced settings */}
            <div className="rounded-xl border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setAdvancedOpen(o => !o)}
                aria-expanded={advancedOpen}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-on-surface cursor-pointer"
              >
                Advanced settings
                {advancedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {advancedOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/20 pt-4">
                  <div>
                    <label htmlFor="work-description" className={labelClass}>Description</label>
                    <textarea id="work-description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="A short story about this shoot…" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="work-location" className={labelClass}>Location</label>
                    <input id="work-location" type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. London" className={inputClass} />
                  </div>
                  <div>
                    <span className={labelClass}>Cover image</span>
                    <div className="flex items-center gap-3">
                      {form.cover ? (
                        <img src={form.cover} alt="Cover" className="w-16 h-16 rounded-lg object-cover border border-outline-variant/30" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-outline-variant/40 flex items-center justify-center text-on-surface-variant/60"><ImageIcon size={20} /></div>
                      )}
                      <div className="flex flex-col gap-1">
                        <label className={`text-sm text-tertiary font-semibold flex items-center gap-1.5 ${photoStorage.uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:underline'}`}>
                          <Upload size={14} /> Upload a cover image
                          <input type="file" accept={PHOTO_TYPES.join(',')} onChange={handleCoverFile} className="hidden" />
                        </label>
                        {form.cover && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, cover: '' }))} className="text-xs text-on-surface-variant hover:text-on-surface text-left cursor-pointer">Use first photo instead</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="work-order" className={labelClass}>Display order</label>
                    <input id="work-order" type="number" step={1} value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: e.target.value })} className={inputClass} />
                    <p className="text-xs text-on-surface-variant mt-1">Lower numbers appear first. Newest work shows first among equal numbers.</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-on-surface py-1">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-tertiary w-5 h-5" />
                    Feature on the homepage
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-sm text-on-surface py-1">
                    <input type="checkbox" checked={!form.published} onChange={e => setForm({ ...form, published: !e.target.checked })} className="accent-tertiary w-5 h-5" />
                    Keep as a draft (hidden from the website)
                  </label>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 sm:pt-4 bg-surface-container-low flex gap-2.5 border-t border-outline-variant/30">
              <button
                type="button"
                onClick={() => void closeForm()}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || uploadingCount > 0}
                className="flex-[2] sm:flex-none sm:ml-auto justify-center px-5 py-3 sm:py-2.5 rounded-lg bg-tertiary text-on-tertiary text-sm font-semibold hover:bg-tertiary-fixed shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving changes...</>
                  : uploadingCount > 0 ? <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                  : editing ? 'Save Changes'
                  : form.published ? 'Publish Work' : 'Save Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== Categories ===================== */}
      {showCategories && (
        <CategoriesDialog
          cats={cats}
          countByCategory={countByCategory}
          onClose={() => setShowCategories(false)}
          onNotice={setNotice}
          inputClass={inputClass}
        />
      )}

      {/* ===================== Delete confirmation ===================== */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]" onClick={() => !deleting && setConfirmDelete(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-work-title" className="bg-surface-container-low rounded-t-2xl sm:rounded-2xl max-w-sm w-full p-6 border border-outline-variant/30 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 id="delete-work-title" className="font-display text-lg font-bold text-on-surface">Delete this work?</h3>
            <p className="text-sm text-on-surface-variant">"{confirmDelete.display_title}" and its photos and videos will be removed from the website. This cannot be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="flex-1 px-4 py-3 sm:py-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant text-sm font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-3 sm:py-2.5 rounded-lg bg-error text-white text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
                {deleting && <Loader2 size={14} className="animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesDialog({
  cats,
  countByCategory,
  onClose,
  onNotice,
  inputClass,
}: {
  cats: ReturnType<typeof usePortfolioCategories>;
  countByCategory: Map<string, number>;
  onClose: () => void;
  onNotice: (n: { type: 'success' | 'error'; text: string }) => void;
  inputClass: string;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onNotice({ type: 'success', text: success });
      return true;
    } catch (err) {
      setError(friendlyError(err, 'Manage categories', 'That change could not be saved. Please try again.'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="categories-title" className="bg-surface-container-low sm:rounded-2xl max-w-lg w-full min-h-full sm:min-h-0 p-5 sm:p-6 border-0 sm:border border-outline-variant/30 space-y-4 sm:my-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <h3 id="categories-title" className="font-display text-xl font-bold text-on-surface">Work Categories</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer"><X size={20} /></button>
        </div>

        {!cats.managed && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
            Editing categories needs a one-time setup by your website developer. The standard categories are available meanwhile.
          </div>
        )}
        {error && <div role="alert" className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-sm">{error}</div>}

        <form
          className="flex gap-2"
          onSubmit={async e => {
            e.preventDefault();
            if (await run(() => cats.create(newName), 'Category added.')) setNewName('');
          }}
        >
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category, e.g. Maternity" className={inputClass} disabled={!cats.managed || busy} aria-label="New category name" />
          <button type="submit" disabled={!cats.managed || busy || !newName.trim()} className="shrink-0 px-4 rounded-lg bg-tertiary text-on-tertiary text-sm font-semibold disabled:opacity-50 cursor-pointer">Add</button>
        </form>

        <ul className="divide-y divide-outline-variant/20 rounded-xl border border-outline-variant/30">
          {cats.categories.map((c, i) => {
            const count = countByCategory.get(c.name) ?? 0;
            return (
              <li key={c.id} className="flex items-center gap-2 px-3 py-2.5">
                {editingId === c.id ? (
                  <form
                    className="flex-1 flex gap-2"
                    onSubmit={async e => {
                      e.preventDefault();
                      if (await run(() => cats.rename(c.id, editName), 'Category renamed.')) setEditingId(null);
                    }}
                  >
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} aria-label="Category name" />
                    <button type="submit" disabled={busy} className="px-3 rounded-lg bg-tertiary text-on-tertiary text-sm font-semibold cursor-pointer">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="px-2 text-sm text-on-surface-variant cursor-pointer">Cancel</button>
                  </form>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${c.is_active ? 'text-on-surface' : 'text-on-surface-variant line-through'}`}>{c.name}</p>
                      <p className="text-xs text-on-surface-variant">{count} item{count === 1 ? '' : 's'}{c.is_active ? '' : ' · hidden'}</p>
                    </div>
                    <button onClick={() => run(() => cats.move(c.id, -1), 'Order updated.')} disabled={!cats.managed || busy || i === 0} className="p-2 text-on-surface-variant disabled:opacity-30 cursor-pointer" aria-label={`Move ${c.name} up`}><ArrowUp size={15} /></button>
                    <button onClick={() => run(() => cats.move(c.id, 1), 'Order updated.')} disabled={!cats.managed || busy || i === cats.categories.length - 1} className="p-2 text-on-surface-variant disabled:opacity-30 cursor-pointer" aria-label={`Move ${c.name} down`}><ArrowDown size={15} /></button>
                    <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} disabled={!cats.managed || busy} className="p-2 text-on-surface-variant hover:text-tertiary disabled:opacity-30 cursor-pointer" aria-label={`Rename ${c.name}`}><Edit3 size={15} /></button>
                    <button onClick={() => run(() => cats.setActive(c.id, !c.is_active), c.is_active ? 'Category hidden from the website.' : 'Category shown on the website.')} disabled={!cats.managed || busy} className="p-2 text-on-surface-variant hover:text-tertiary disabled:opacity-30 cursor-pointer" aria-label={c.is_active ? `Hide ${c.name}` : `Show ${c.name}`} title={c.is_active ? 'Hide tab on website' : 'Show tab on website'}>
                      {c.is_active ? <Eye size={15} /> : <EyeOff size={15} />}
                    </button>
                    <button
                      onClick={() => run(() => cats.remove(c.id), 'Category deleted.')}
                      disabled={!cats.managed || busy || count > 0}
                      className="p-2 text-on-surface-variant hover:text-error disabled:opacity-30 cursor-pointer"
                      aria-label={`Delete ${c.name}`}
                      title={count > 0 ? 'Move or delete the work in this category first' : 'Delete category'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-on-surface-variant">Renaming a category updates all of its work. Hidden categories keep their work but don't show as a tab on the website.</p>
      </div>
    </div>
  );
}
